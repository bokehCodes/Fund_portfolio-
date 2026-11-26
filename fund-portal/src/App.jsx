import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/Auth'
import { useSettings } from './context/Settings'
import { track } from './lib/track'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Privacy from './pages/Privacy'
import ConsentGate from './pages/ConsentGate'
import Dashboard from './pages/Dashboard'
import Admin from './admin/Admin'

const consented = (profile, settings) =>
  !!profile?.consent_at && (profile.consent_version || 0) >= (settings.privacy_version || 1)

function Guard({ children, admin }) {
  const { session, profile, loading } = useAuth()
  const { settings } = useSettings()
  if (loading) return <div className="center">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (!consented(profile, settings)) return <ConsentGate />
  if (admin && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const loc = useLocation()
  const { profile } = useAuth()
  const { settings } = useSettings()
  const ok = consented(profile, settings)

  // Visits are recorded only for signed-in clients who have signed the consent.
  useEffect(() => { if (ok) track(loc.pathname) }, [loc.pathname, ok])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
      <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
