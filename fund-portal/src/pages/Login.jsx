import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useSettings } from '../context/Settings'

export default function Login() {
  const { signIn, signOut } = useAuth()
  const { settings: s } = useSettings()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error, profile } = await signIn(email.trim(), password)
    if (error) {
      setBusy(false)
      return setErr('Invalid email or password.')
    }
    if (!profile) {
      await signOut()
      setBusy(false)
      return setErr('Your account profile is unavailable. Please contact your account manager.')
    }
    setBusy(false)
    nav(profile.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        {s.logo_url && <img src={s.logo_url} alt="" className="login-logo" />}
        <h2>{s.site_name}</h2>
        <p className="muted">Client login</p>
        <div className="field"><label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
        <div className="field"><label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
        {err && <p className="neg">{err}</p>}
        <button className="btn full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted small">Accounts are created by your account manager. Forgot your password? Please contact us. On first login you will be asked to read and sign our <Link to="/privacy" className="link">privacy policy</Link>.</p>
        <Link to="/" className="link small">← Back to site</Link>
      </form>
    </div>
  )
}
