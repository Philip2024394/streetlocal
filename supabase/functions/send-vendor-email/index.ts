// supabase/functions/send-vendor-email/index.ts
//
// Forwards a customer order to the vendor's configured email address via Resend.
//
// Invoked from the productslocalemail customer app via supabase.functions.invoke().
// Body: {
//   vendorId, vendorEmail, customerName, customerPhone, customerEmail,
//   customerAddress, orderPayload, summaryBody
// }
//
// Env required (set with `npx supabase secrets set …`):
//   RESEND_API_KEY  — your Resend API key (re_...)
//   RESEND_FROM     — verified sender (e.g. orders@streetlocal.live)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "orders@streetlocal.live";

function fmtRupiah(n: number): string {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "access-control-allow-origin": origin || "*",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured on the server" }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  const {
    vendorId,
    vendorEmail,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    orderPayload,
    summaryBody,
  } = body || {};

  if (!vendorEmail) {
    return new Response(JSON.stringify({ error: "missing vendorEmail" }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
  if (!orderPayload) {
    return new Response(JSON.stringify({ error: "missing orderPayload" }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  const op = orderPayload || {};
  const items: any[] = Array.isArray(op.items) ? op.items : [];
  const orderNumber = op.orderNumber || String(Date.now()).slice(-6);
  const placedAt = op.placedAt ? new Date(op.placedAt) : new Date();
  const total = Number(op.total || 0);
  const subtotal = Number(op.subtotal || 0);
  const deliveryFee = Number(op.delivery?.fee || 0);
  const deliveryType = op.delivery?.type || (op.delivery?.enabled ? "delivery" : "pickup");
  const deliveryZone = op.delivery?.zone || "";
  const paymentMethod = op.payment?.method || "cod";
  const note = op.note || "";
  const shopName = op.shop?.name || "Your Store";
  const shopAddress = op.shop?.address || "";

  const itemsHtml = items
    .map((it) => {
      const qty = it.qty || 1;
      const name = escapeHtml(it.name || "Item");
      const lineTotal = Number(it.lineTotal != null ? it.lineTotal : (it.price || 0) * qty);
      return `<tr>
  <td style="padding:8px 4px;border-bottom:1px solid #eee;">${qty}× ${name}</td>
  <td style="padding:8px 4px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums;">${escapeHtml(fmtRupiah(lineTotal))}</td>
</tr>`;
    })
    .join("\n");

  const itemsText = items
    .map((it) => {
      const qty = it.qty || 1;
      const lineTotal = Number(it.lineTotal != null ? it.lineTotal : (it.price || 0) * qty);
      return `  ${qty}x ${it.name || "Item"} — ${fmtRupiah(lineTotal)}`;
    })
    .join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <div style="background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <div style="border-bottom:2px solid #1a1a1a;padding-bottom:12px;margin-bottom:16px;">
        <div style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(shopName)}</div>
        <h1 style="margin:4px 0 0;font-size:22px;font-weight:900;">New order #${escapeHtml(orderNumber)}</h1>
        <div style="font-size:12px;color:#888;margin-top:4px;">${escapeHtml(placedAt.toLocaleString())}</div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:12px;color:#888;font-weight:700;margin-bottom:6px;">Customer</div>
        <div style="font-size:14px;line-height:1.5;">
          <div><strong>${escapeHtml(customerName || "—")}</strong></div>
          ${customerEmail ? `<div>Email: <a href="mailto:${escapeHtml(customerEmail)}" style="color:#1a1a1a;">${escapeHtml(customerEmail)}</a></div>` : ""}
          ${customerPhone ? `<div>Phone: ${escapeHtml(customerPhone)}</div>` : ""}
          ${customerAddress ? `<div>Address: ${escapeHtml(customerAddress)}</div>` : ""}
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:12px;color:#888;font-weight:700;margin-bottom:6px;">Items</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${itemsHtml}
        </table>
      </div>

      <div style="margin-bottom:16px;border-top:1px solid #eee;padding-top:12px;font-size:14px;">
        ${deliveryFee > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#666;"><span>Subtotal</span><span>${escapeHtml(fmtRupiah(subtotal))}</span></div>` : ""}
        ${deliveryFee > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#666;"><span>Delivery${deliveryZone ? " — " + escapeHtml(deliveryZone) : ""}</span><span>${escapeHtml(fmtRupiah(deliveryFee))}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:8px 0 0;border-top:1px solid #eee;margin-top:8px;font-weight:900;font-size:16px;"><span>Total</span><span>${escapeHtml(fmtRupiah(total))}</span></div>
      </div>

      <div style="margin-bottom:16px;font-size:13px;color:#666;line-height:1.6;">
        <div><strong>Fulfillment:</strong> ${escapeHtml(deliveryType === "delivery" ? "Delivery" : "Pickup / Collection")}</div>
        <div><strong>Payment:</strong> ${escapeHtml(paymentMethod.toUpperCase())}</div>
        ${note ? `<div style="margin-top:6px;"><strong>Note:</strong> ${escapeHtml(note)}</div>` : ""}
      </div>

      ${shopAddress ? `<div style="font-size:12px;color:#888;border-top:1px solid #eee;padding-top:12px;">${escapeHtml(shopAddress)}</div>` : ""}
      <div style="font-size:11px;color:#aaa;margin-top:12px;">Reply directly to this email to message the customer.</div>
    </div>
    <div style="text-align:center;font-size:11px;color:#aaa;margin-top:16px;">Sent via StreetLocal.live</div>
  </div>
</body></html>`;

  const textParts = [
    `${shopName}`,
    `New order #${orderNumber}`,
    placedAt.toLocaleString(),
    "",
    `Customer: ${customerName || "—"}`,
    customerEmail ? `Email: ${customerEmail}` : "",
    customerPhone ? `Phone: ${customerPhone}` : "",
    customerAddress ? `Address: ${customerAddress}` : "",
    "",
    "Items:",
    itemsText,
    "",
    deliveryFee > 0 ? `Subtotal: ${fmtRupiah(subtotal)}` : "",
    deliveryFee > 0 ? `Delivery${deliveryZone ? " (" + deliveryZone + ")" : ""}: ${fmtRupiah(deliveryFee)}` : "",
    `Total: ${fmtRupiah(total)}`,
    "",
    `Fulfillment: ${deliveryType === "delivery" ? "Delivery" : "Pickup / Collection"}`,
    `Payment: ${paymentMethod.toUpperCase()}`,
    note ? `Note: ${note}` : "",
    "",
    shopAddress ? shopAddress : "",
    "",
    "Reply directly to this email to message the customer.",
    "— Sent via StreetLocal.live",
  ].filter(Boolean).join("\n");

  const subject = `New order #${orderNumber} — ${customerName || customerPhone || "Customer"}`;

  const payload: Record<string, unknown> = {
    from: RESEND_FROM,
    to: [vendorEmail],
    subject,
    html,
    text: textParts,
  };
  if (customerEmail) {
    payload.reply_to = customerEmail;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const message = data?.message || data?.error || `Resend error ${res.status}`;
    return new Response(JSON.stringify({ error: message, status: res.status, vendorId, summaryBody }), {
      status: res.status,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, id: data?.id || null, vendorId, summaryBody }), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
