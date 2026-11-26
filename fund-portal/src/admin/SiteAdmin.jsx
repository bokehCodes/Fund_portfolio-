import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSettings, PRESETS, applyPalette } from '../context/Settings'
import ImageField from '../components/ImageField'

const COLORS = [['bg', 'Background'], ['surface', 'Cards'], ['text', 'Text'], ['muted', 'Muted text'], ['primary', 'Primary'], ['accent', 'Accent']]

export default function SiteAdmin() {
  const { settings, reload } = useSettings()
  const [f, setF] = useState({ ...settings })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setF((o) => ({ ...o, [k]: v }))
  const setPalette = (p) => { setF((o) => ({ ...o, palette: p })); applyPalette(p) }
  const setService = (i, k, v) => set('services', f.services.map((s, j) => (j === i ? { ...s, [k]: v } : s)))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { id, bumpPolicy, ...rest } = f
    if (bumpPolicy) rest.privacy_version = (Number(f.privacy_version) || 1) + 1
    const { error } = await supabase.from('site_settings').upsert({ ...rest, id: 1 })
    setSaving(false)
    if (error) return alert(error.message)
    await reload()
    alert('Site updated')
  }

  return (
    <form onSubmit={save}>
      <div className="card">
        <h3>Brand</h3>
        <div className="form-grid">
          <div className="field"><label>Site / firm name</label><input value={f.site_name || ''} onChange={(e) => set('site_name', e.target.value)} /></div>
          <div className="field"><label>Tagline</label><input value={f.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></div>
          <div className="field"><label>Currency code (USD, EUR, GBP…)</label><input value={f.currency || 'USD'} onChange={(e) => set('currency', e.target.value.toUpperCase())} /></div>
        </div>
        <ImageField label="Logo" value={f.logo_url} onChange={(v) => set('logo_url', v)} folder="brand" />
      </div>

      <div className="card">
        <h3>Colour palette</h3>
        <div className="row wrap-row">
          {Object.keys(PRESETS).map((k) => (
            <button type="button" key={k} className="btn ghost small" onClick={() => setPalette(PRESETS[k])}>
              {k[0].toUpperCase() + k.slice(1)}
            </button>
          ))}
        </div>
        <div className="form-grid">
          {COLORS.map(([k, label]) => (
            <div className="field" key={k}><label>{label}</label>
              <input type="color" value={f.palette[k]} onChange={(e) => setPalette({ ...f.palette, [k]: e.target.value })} /></div>
          ))}
        </div>
        <p className="muted small">Changes preview instantly. Press “Save site” to keep them for everyone.</p>
      </div>

      <div className="card">
        <h3>Landing page</h3>
        <div className="field"><label>Hero title</label><input value={f.hero_title || ''} onChange={(e) => set('hero_title', e.target.value)} /></div>
        <div className="field"><label>Hero subtitle</label><textarea rows="2" value={f.hero_subtitle || ''} onChange={(e) => set('hero_subtitle', e.target.value)} /></div>
        <ImageField label="Hero image" value={f.hero_image_url} onChange={(v) => set('hero_image_url', v)} folder="hero" />
        <div className="field"><label>About title</label><input value={f.about_title || ''} onChange={(e) => set('about_title', e.target.value)} /></div>
        <div className="field"><label>About text</label><textarea rows="5" value={f.about_text || ''} onChange={(e) => set('about_text', e.target.value)} /></div>
      </div>

      <div className="card">
        <h3>Service cards</h3>
        {f.services.map((s, i) => (
          <div className="form-grid" key={i}>
            <div className="field"><label>Title</label><input value={s.title} onChange={(e) => setService(i, 'title', e.target.value)} /></div>
            <div className="field"><label>Text</label><input value={s.text} onChange={(e) => setService(i, 'text', e.target.value)} /></div>
            <div className="field"><label>&nbsp;</label>
              <button type="button" className="btn ghost small" onClick={() => set('services', f.services.filter((_, j) => j !== i))}>Remove</button></div>
          </div>
        ))}
        <button type="button" className="btn ghost small" onClick={() => set('services', [...f.services, { title: '', text: '' }])}>+ Add card</button>
      </div>

      <div className="card">
        <h3>Contact &amp; legal</h3>
        <div className="form-grid">
          <div className="field"><label>Email</label><input value={f.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} /></div>
          <div className="field"><label>Phone</label><input value={f.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} /></div>
        </div>
        <div className="field"><label>Address</label><textarea rows="2" value={f.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
        <div className="field"><label>Privacy policy (clients must sign this before first login)</label>
          <textarea rows="16" value={f.privacy_policy || ''} onChange={(e) => set('privacy_policy', e.target.value)} /></div>
        <label className="check">
          <input type="checkbox" checked={!!f.bumpPolicy} onChange={(e) => set('bumpPolicy', e.target.checked)} />
          <span>I changed the policy in a significant way: make every client sign it again (raises version from {f.privacy_version || 1}).</span>
        </label>
        <div className="field"><label>Disclaimer (footer and dashboard)</label><textarea rows="3" value={f.disclaimer || ''} onChange={(e) => set('disclaimer', e.target.value)} /></div>
      </div>

      <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save site'}</button>
    </form>
  )
}
