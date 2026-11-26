import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/Auth'
import { useSettings } from '../context/Settings'
import Clients from './Clients'
import NewsAdmin from './NewsAdmin'
import SiteAdmin from './SiteAdmin'
import Visits from './Visits'

export default function Admin() {
  const { signOut } = useAuth()
  const { settings: s } = useSettings()
  const [tab, setTab] = useState('clients')

  return (
    <div>
      <header className="nav">
        <div className="wrap nav-in">
          <span className="brand"><span>{s.site_name} · Admin</span></span>
          <nav>
            <Link to="/" className="btn ghost small">View site</Link>
            <Link to="/dashboard" className="btn ghost small">My dashboard</Link>
            <button className="btn ghost small" onClick={signOut}>Sign out</button>
          </nav>
        </div>
      </header>
      <main className="wrap section-sm">
        <div className="tabs">
          {[['clients', 'Clients'], ['news', 'News'], ['visits', 'Visits'], ['site', 'Site & design']].map(([k, v]) => (
            <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{v}</button>
          ))}
        </div>
        {tab === 'clients' && <Clients />}
        {tab === 'news' && <NewsAdmin />}
        {tab === 'visits' && <Visits />}
        {tab === 'site' && <SiteAdmin />}
      </main>
    </div>
  )
}
