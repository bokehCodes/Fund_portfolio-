import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/Auth'
import { useSettings } from '../context/Settings'

export default function ConsentGate() {
  const { signOut, refreshProfile } = useAuth()
  const { settings: s } = useSettings()
  const [agree, setAgree] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.rpc('accept_consent', { p_name: name })
    if (error) { setErr(error.message); setBusy(false); return }
    await refreshProfile()
    setBusy(false)
  }

  return (
    <div className="gate-wrap">
      <form className="card gate" onSubmit={submit}>
        <h2>Privacy policy &amp; consent</h2>
        <p className="muted">Please read and sign before continuing to your account.</p>
        <div className="policy">{s.privacy_policy}</div>
        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I have read this privacy policy and I consent to the collection and use of my information as described.</span>
        </label>
        <div className="field">
          <label>Type your full name as your signature</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {err && <p className="neg">{err}</p>}
        <div className="row wrap-row">
          <button className="btn" disabled={!agree || !name.trim() || busy}>{busy ? 'Saving…' : 'Sign and continue'}</button>
          <button type="button" className="btn ghost" onClick={signOut}>Decline and sign out</button>
        </div>
      </form>
    </div>
  )
}
