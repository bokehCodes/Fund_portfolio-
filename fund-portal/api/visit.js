// Vercel serverless function: receives a visit from the browser, adds the
// location Vercel detected from the connection, and stores it in Supabase.
// Uses only the public anon key; row-level security limits what it can do.

const clip = (v, n = 300) => (v == null ? null : String(v).slice(0, n))
const dec = (v) => { try { return v ? decodeURIComponent(v) : null } catch { return v || null } }

function maskIp(ip) {
  if (!ip) return null
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::'
  const p = ip.split('.')
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const h = req.headers
    const url = process.env.VITE_SUPABASE_URL
    const key = process.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key) return res.status(500).end()

    const row = {
      user_id: b.user_id || null,
      session_id: clip(b.session_id, 64),
      event: b.event === 'login' ? 'login' : 'page_view',
      path: clip(b.path),
      referrer: clip(b.referrer),
      country: clip(h['x-vercel-ip-country'], 8),
      region: clip(dec(h['x-vercel-ip-country-region']), 64),
      city: clip(dec(h['x-vercel-ip-city']), 96),
      ip_masked: maskIp((h['x-forwarded-for'] || '').split(',')[0].trim()),
      timezone: clip(b.timezone, 64),
      language: clip(b.language, 32),
      device_type: clip(b.device_type, 16),
      os: clip(b.os, 32),
      browser: clip(b.browser, 32),
      screen: clip(b.screen, 24),
      user_agent: clip(b.user_agent, 400),
    }

    const r = await fetch(`${url}/rest/v1/visit_logs`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: h.authorization || `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    })
    return res.status(r.ok ? 204 : 502).end()
  } catch {
    return res.status(400).end()
  }
}
