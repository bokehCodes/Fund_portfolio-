import { useState } from 'react'
import { uploadImage } from '../lib/util'

export default function ImageField({ label, value, onChange, folder }) {
  const [busy, setBusy] = useState(false)
  const pick = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try { onChange(await uploadImage(f, folder)) } catch (err) { alert(err.message) }
    setBusy(false)
  }
  return (
    <div className="field">
      <label>{label}</label>
      {value && <img src={value} alt="" className="thumb" />}
      <input type="file" accept="image/*" onChange={pick} />
      {busy && <span className="muted small">Uploading…</span>}
      {value && <button type="button" className="btn ghost small" onClick={() => onChange('')}>Remove</button>}
    </div>
  )
}
