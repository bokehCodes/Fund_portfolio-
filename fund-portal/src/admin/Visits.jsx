import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const count = (rows, key) => {
  const m = {}
  rows.forEach((r) => { const k = r[key] || 'Unknown'; m[k] = (m[k] || 0) + 1 })
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 6)
}

export default function Visits() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [users, setUsers] = useState({})

  useEffect(() => {
    ;(async () => {
      const [v, p] = await Promise.all([
        supabase.from('visit_logs').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('profiles').select('id,email,full_name'),
      ])
      setRows(v.data || [])
      const m = {}; (p.data || []).forEach((x) => { m[x.id] = x.full_name || x.email }); setUsers(m)
    })()
  }, [])

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return rows
    return rows.filter((r) => [r.country, r.city, r.device_type, r.os, r.browser, r.path, users[r.user_id]]
      .some((x) => (x || '').toLowerCase().includes(t)))
  }, [rows, q, users])

  const exportCsv = () => {
    const cols = ['created_at', 'event', 'user', 'path', 'country', 'region', 'city', 'ip_masked', 'timezone', 'language', 'device_type', 'os', 'browser', 'screen', 'referrer']
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const lines = [cols.join(',')].concat(shown.map((r) => cols.map((c) => esc(c === 'user' ? users[r.user_id] : r[c])).join(',')))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    a.download = 'visits.csv'; a.click()
  }

  return (
    <>
      <div className="grid3">
        {[['Top countries', 'country'], ['Devices', 'device_type'], ['Browsers', 'browser']].map(([t, k]) => (
          <div className="card" key={k}><h3>{t}</h3>
            {count(rows, k).map(([n, c]) => <div className="row" key={n}><span>{n}</span><span className="muted">{c}</span></div>)}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="row">
          <h3>Visit log (latest 1000, clients who signed the privacy consent)</h3>
          <button className="btn ghost small" onClick={exportCsv}>Export CSV</button>
        </div>
        <div className="field"><input placeholder="Filter by country, city, device, client, page…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Time</th><th>Who</th><th>Event / page</th><th>Location</th><th>Device</th><th>Timezone</th></tr></thead>
          <tbody>{shown.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>{users[r.user_id] || <span className="muted">Visitor</span>}</td>
              <td>{r.event === 'login' ? 'Login' : r.path}</td>
              <td>{[r.city, r.region, r.country].filter(Boolean).join(', ') || '—'}<div className="muted small">{r.ip_masked}</div></td>
              <td>{r.device_type} · {r.os} · {r.browser}<div className="muted small">{r.screen}</div></td>
              <td>{r.timezone}<div className="muted small">{r.language}</div></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  )
}
