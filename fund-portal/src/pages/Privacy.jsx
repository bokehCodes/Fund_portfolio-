import { Link } from 'react-router-dom'
import { useSettings } from '../context/Settings'

export default function Privacy() {
  const { settings: s } = useSettings()
  return (
    <div>
      <header className="nav">
        <div className="wrap nav-in">
          <Link to="/" className="brand">{s.logo_url && <img src={s.logo_url} alt="" />}<span>{s.site_name}</span></Link>
          <nav><Link to="/login" className="btn small">Client login</Link></nav>
        </div>
      </header>
      <main className="wrap narrow section-sm">
        <div className="policy full">{s.privacy_policy}</div>
        <p><Link to="/" className="link small">← Back to site</Link></p>
      </main>
    </div>
  )
}
