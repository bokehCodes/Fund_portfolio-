import { fmtDate } from '../lib/util'
import { useState } from 'react'

export default function NewsList({ items }) {
  const [open, setOpen] = useState(null)
  if (!items.length) return <p className="muted">No news yet.</p>
  return (
    <div className="news-grid">
      {items.map((n) => (
        <article key={n.id} className="card news-card" onClick={() => setOpen(open === n.id ? null : n.id)}>
          {n.image_url && <img src={n.image_url} alt="" className="news-img" />}
          <div className="news-body">
            <span className="muted small">{fmtDate(n.published_at)}</span>
            <h3>{n.title}</h3>
            {n.summary && <p className="muted">{n.summary}</p>}
            {open === n.id && n.body && <div className="news-full">{n.body}</div>}
            {n.body && <span className="link small">{open === n.id ? 'Show less' : 'Read more'}</span>}
          </div>
        </article>
      ))}
    </div>
  )
}
