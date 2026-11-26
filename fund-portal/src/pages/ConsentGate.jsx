import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/Auth'
import { useSettings } from '../context/Settings'

export default function ConsentGate() {
  const { signOut, refreshProfile } = useAuth()
  const { settings: s } = useSettings()
  const policy = typeof s.privacy_policy === 'string' ? s.privacy_policy.trim() : ''
  const [agree, setAgree] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!policy) {
      setErr('The privacy policy is unavailable. Please contact your account manager before signing.')
      return
    }
    setBusy(true); setErr('')
    try {
      const { error } = await supabase.rpc('accept_consent', { p_name: name.trim() })
      if (error) {
        const missingFunction = error.code === 'PGRST202' || error.message?.includes('accept_consent')
        throw new Error(missingFunction
          ? 'The consent service is not available. Ask the administrator to run supabase/fix_roles_and_consent.sql and reload the Supabase schema cache. ' + error.message
          : error.message)
      }
      const profile = await refreshProfile()
      if (!profile) throw new Error('Consent was saved, but your account profile could not be reloaded. Please sign out and contact your account manager.')
    } catch (error) {
      setErr(error.message || 'Could not save your consent. Please try again or contact your account manager.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gate-wrap">
      <form className="card gate" onSubmit={submit}>
        <h2>Privacy policy &amp; consent</h2>
        <p className="muted">Please read and sign before continuing to your account.</p>
        {policy
          ? <div className="policy">{policy}</div>
          : <p className="neg" role="alert">The privacy policy has not been configured. You cannot sign an empty policy. Please contact your account manager.</p>}
        {policy && (
          <label className="check">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I have read this privacy policy and I consent to the collection and use of my information as described.</span>
          </label>
        )}
        <div className="field">
          <label>Type your full name as your signature</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {err && <p className="neg">{err}</p>}
        <div className="row wrap-row">
          <button className="btn" disabled={!policy || !agree || !name.trim() || busy}>{busy ? 'Saving…' : 'Sign and continue'}</button>
          <button type="button" className="btn ghost" onClick={signOut}>Decline and sign out</button>
        </div>
      </form>
    </div>
  )
}
