// One-shot helper to push 20260521000000_demo_donut_vendor.sql to the
// remote Supabase via the Management API, bypassing the migration-history
// mismatch that blocks `supabase db push`. Safe to re-run — the migration
// itself is idempotent (uses ON CONFLICT DO UPDATE).
const fs = require('fs')
const path = require('path')

// Read from streetlocal/.env so the token never lands in git. Format
// of .env: SUPABASE_ACCESS_TOKEN=sbp_... / SUPABASE_PROJECT_REF=...
function readEnv () {
  const envPath = path.join(__dirname, '..', '.env')
  const out = {}
  if (!fs.existsSync(envPath)) return out
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+?)\s*$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}
const env = readEnv()
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || env.SUPABASE_PROJECT_REF
if (!TOKEN || !PROJECT_REF) {
  console.error('Missing SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF in env or .env')
  process.exit(1)
}

async function main () {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '20260521000000_demo_donut_vendor.sql'), 'utf8')
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const text = await r.text()
  console.log('HTTP', r.status)
  console.log(text)
  if (!r.ok) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
