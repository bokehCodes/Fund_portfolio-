import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../lib/util'
import ImageField from '../components/ImageField'

const blank = { title: '', summary: '', body: '', image_url: '', visibility: 'public', published: true }

export default function NewsAdmin() {
  const [items, setItems] = useState([])
  const [f, setF] = useState(blank)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    const { data } = await supabase.from('news').select('*').order('published_at', { ascending: false })
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    const payload = { title: f.title, summary: f.summary || null, body: f.body || null, image_url: f.image_url || null, visibility: f.visibility, published: f.published }
    const { error } = editing
      ? await supabase.from('news').update(payload).eq('id', editing)
      : await supabase.from('news').insert(payload)
    if (error) return alert(error.message)
    setF(blank); setEditing(null); load()
  }
  const edit = (n) => { setEditing(n.id); setF({ ...blank, ...n, summary: n.summary || '', body: n.body || '', image_url: n.image_url || '' }); window.scrollTo(0, 0) }
  const del = async (n) => { if (confirm('Delete this article?')) { await supabase.from('news').delete().eq('id', n.id); load() } }
  const toggle = async (n) => { await supabase.from('news').update({ published: !n.published }).eq('id', n.id); load() }

  return (
    <>
      <div className="card">
        <h3>{editing ? 'Edit article' : 'New article'}</h3>
        <form onSubmit={save}>
          <div className="field"><label>Title</label><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="field"><label>Short summary</label><input value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></div>
          <div className="field"><label>Full text</label><textarea rows="6" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
          <ImageField label="Image" value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} folder="news" />
          <div className="form-grid">
            <div className="field"><label>Visible to</label>
              <select value={f.visibility} onChange={(e) => setF({ ...f, visibility: e.target.value })}>
                <option value="public">Everyone (shown on landing page)</option>
                <option value="clients">Logged-in clients only</option>
              </select></div>
            <div className="field"><label>Status</label>
              <select value={f.published ? '1' : '0'} onChange={(e) => setF({ ...f, published: e.target.value === '1' })}>
                <option value="1">Published</option><option value="0">Draft</option>
              </select></div>
          </div>
          <button className="btn">{editing ? 'Update' : 'Publish'}</button>{' '}
          {editing && <button type="button" className="btn ghost" onClick={() => { setEditing(null); setF(blank) }}>Cancel</button>}
        </form>
      </div>

      <div className="card">
        <h3>All articles</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>Date</th><th>Title</th><th>Audience</th><th>Status</th><th /></tr></thead>
          <tbody>{items.map((n) => (
            <tr key={n.id}>
              <td>{fmtDate(n.published_at)}</td><td>{n.title}</td>
              <td>{n.visibility === 'public' ? 'Everyone' : 'Clients'}</td>
              <td>{n.published ? 'Published' : 'Draft'}</td>
              <td className="r">
                <button className="btn ghost small" onClick={() => toggle(n)}>{n.published ? 'Unpublish' : 'Publish'}</button>{' '}
                <button className="btn ghost small" onClick={() => edit(n)}>Edit</button>{' '}
                <button className="btn ghost small" onClick={() => del(n)}>Delete</button>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  )
}
