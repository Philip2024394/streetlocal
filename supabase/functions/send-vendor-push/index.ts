// supabase/functions/send-vendor-push/index.ts
//
// Triggered by a Supabase database webhook on chat_messages INSERT
// (with the optional filter sender_role=eq.customer).
//
// For each new customer message it loads all push subscriptions for the
// conversation's vendor and POSTs a Web Push notification to each endpoint,
// signed with VAPID JWT.
//
// Env required:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   VAPID_PUBLIC_KEY   (URL-safe base64, raw 65-byte EC P-256 public key)
//   VAPID_PRIVATE_KEY  (URL-safe base64, 32-byte d scalar)
//   VAPID_SUBJECT      (e.g. mailto:alerts@example.com)
//
// We use the npm:web-push package via Deno's npm specifier, which handles
// VAPID signing, AES-GCM payload encryption, and per-endpoint POSTs.

import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:alerts@streetlocal.live";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function fmtRupiah(n: number): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response("VAPID keys not configured", { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  // Supabase database webhook payload shape: { type, table, record, schema, old_record }
  const record = body?.record ?? body;
  if (!record?.conversation_id) {
    return new Response("missing conversation_id", { status: 400 });
  }
  if (record.sender_role && record.sender_role !== "customer") {
    return new Response("ignored: not a customer message", { status: 200 });
  }

  // Fetch conversation -> vendor_id + customer_name
  const { data: conv, error: convErr } = await supabase
    .from("chat_conversations")
    .select("vendor_id, customer_name, customer_phone")
    .eq("id", record.conversation_id)
    .single();
  if (convErr || !conv) {
    return new Response("conversation not found", { status: 404 });
  }

  // Fetch all subscriptions for this vendor
  const { data: subs, error: subsErr } = await supabase
    .from("vendor_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("vendor_id", conv.vendor_id);
  if (subsErr) return new Response(subsErr.message, { status: 500 });
  if (!subs || subs.length === 0) {
    return new Response("no subscriptions", { status: 200 });
  }

  // Build notification payload
  const op = record.order_payload || {};
  const items: any[] = Array.isArray(op.items) ? op.items : [];
  const itemsLine =
    items.length > 0
      ? items.map((i) => `${i.qty || 1}x ${i.name || ""}`).join(", ")
      : record.body || "New message";
  const title = `New order — ${conv.customer_name || conv.customer_phone || "Customer"}`;
  const bodyText = `${itemsLine}${op.total ? " · " + fmtRupiah(op.total) : ""}`;

  const payload = JSON.stringify({
    title,
    body: bodyText,
    conversationId: record.conversation_id,
    vendorId: conv.vendor_id,
  });

  const results: any[] = [];
  for (const s of subs) {
    const sub = {
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    };
    try {
      await webpush.sendNotification(sub, payload, { TTL: 60 });
      results.push({ id: s.id, ok: true });
    } catch (e: any) {
      const status = e?.statusCode;
      // 404 / 410 => endpoint dead — clean up
      if (status === 404 || status === 410) {
        await supabase.from("vendor_push_subscriptions").delete().eq("id", s.id);
      }
      results.push({ id: s.id, ok: false, status, message: e?.body || e?.message });
    }
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { "content-type": "application/json" },
  });
});
