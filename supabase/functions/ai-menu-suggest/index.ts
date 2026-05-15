// AI menu suggest — generates a short appetizing description and a
// 2-3 word perk ribbon for a menu item, given just the item name.
//
// Used by the vendor item editor — there's a "✨ Suggest" button next
// to the description field that calls this and fills both fields.
//
// Payload: { name: string, category?: string, language?: string }
// Returns: { description: string, perk: string }
//
// Provider: Anthropic Claude Haiku (fast + cheap). API key lives in
// the `ANTHROPIC_API_KEY` secret; set with:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Deploy:
//   supabase functions deploy ai-menu-suggest --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' }, status })

interface SuggestRequest {
  name?: string
  category?: string
  language?: string
}
interface SuggestResponse {
  description: string
  perk: string
}

function parseModelOutput (raw: string): SuggestResponse {
  // Claude is asked to reply with JSON; if it wraps in prose we extract
  // the first {...} block. Defensive — never trust the model strictly.
  const match = raw.match(/\{[\s\S]*\}/)
  const blob = match ? match[0] : raw
  try {
    const parsed = JSON.parse(blob)
    return {
      description: String(parsed.description || '').trim().slice(0, 240),
      perk: String(parsed.perk || '').trim().slice(0, 28),
    }
  } catch {
    // Fall back: take first line as description, empty perk.
    const firstLine = raw.split('\n').find(l => l.trim()) || ''
    return { description: firstLine.trim().slice(0, 240), perk: '' }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  let body: SuggestRequest
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const name = String(body?.name || '').trim().slice(0, 80)
  if (!name) return json({ error: 'name required' }, 400)
  const category = String(body?.category || '').trim().slice(0, 40)
  const language = String(body?.language || 'English').trim().slice(0, 24)

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'AI not configured for this shop yet — ask the StreetLocal team to enable it.' }, 503)

  const system = `You are a copywriter for a food shop's menu. Write in ${language}. Your output is ALWAYS a single JSON object with two keys:
{
  "description": "1 short sentence (16–24 words). Sensory, mouth-watering, no marketing fluff, no exclamation marks, no quotes around brand names.",
  "perk": "2–3 word badge tag for a corner ribbon (e.g. 'Bestseller', 'Fresh today', 'Crowd favourite', 'Chef's pick'). Punchy, no punctuation."
}
Never include any commentary outside the JSON. Never wrap in markdown code fences.`

  const user = category
    ? `Item: "${name}" (category: ${category})`
    : `Item: "${name}"`

  let modelResp: Response
  try {
    modelResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 220,
        temperature: 0.7,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
  } catch (e) {
    return json({ error: 'AI provider unreachable', detail: String(e) }, 502)
  }

  if (!modelResp.ok) {
    const errText = await modelResp.text().catch(() => '')
    return json({ error: 'AI provider error', status: modelResp.status, detail: errText.slice(0, 400) }, 502)
  }

  const result = await modelResp.json().catch(() => null) as { content?: Array<{ type: string, text?: string }> } | null
  const text = result?.content?.find(c => c.type === 'text')?.text || ''
  if (!text) return json({ error: 'Empty AI response' }, 502)

  const out = parseModelOutput(text)
  if (!out.description) return json({ error: 'Could not parse AI output' }, 502)

  return json(out)
})
