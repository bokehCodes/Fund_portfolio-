import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSettings } from '../context/Settings'
import { useAuth } from '../context/Auth'
import NewsList from '../components/NewsList'

export default function Landing() {
  const { settings: s } = useSettings()
  const { session } = useAuth()
  const [news, setNews] = useState([])

  useEffect(() => {
    supabase.from('news').select('*').eq('published', true).eq('visibility', 'public')
      .order('published_at', { ascending: false }).limit(6)
      .then(({ data }) => setNews(data || []))
      .catch((error) => {
        console.error('Failed to load public news.', error)
        setNews([])
      })
  }, [])

  return (
    <div>
      <header className="nav">
        <div className="wrap nav-in">
          <a href="#top" className="brand">
            {s.logo_url && <img src={s.logo_url} alt="" />}
            <span>{s.site_name}</span>
          </a>
          <nav>
            <a href="#services">Services</a>
            <a href="#news">News</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <Link to={session ? '/dashboard' : '/login'} className="btn small">{session ? 'My account' : 'Client login'}</Link>
          </nav>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="wrap hero-in">
          <div>
            {s.tagline && <span className="eyebrow">{s.tagline}</span>}
            <h1>{s.hero_title}</h1>
            <p className="lead">{s.hero_subtitle}</p>
            <Link to={session ? '/dashboard' : '/login'} className="btn">{session ? 'Open dashboard' : 'Client login'}</Link>
          </div>
          {s.hero_image_url ? <img src={s.hero_image_url} alt="" className="hero-img" /> : <div className="hero-img placeholder" />}
        </div>
      </section>

      {s.services.length > 0 && (
        <section id="services" className="section">
          <div className="wrap">
            <h2>What we manage</h2>
            <div className="grid3">
              {s.services.map((v, i) => (
                <div key={i} className="card">
                  <h3>{v.title}</h3>
                  <p className="muted">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="news" className="section alt">
        <div className="wrap">
          <h2>Latest news</h2>
          <NewsList items={news} />
        </div>
      </section>

      <section id="about" className="section">
        <div className="wrap narrow">
          <h2>{s.about_title}</h2>
          <p className="lead pre">{s.about_text}</p>
        </div>
      </section>

      <section id="contact" className="section alt">
        <div className="wrap narrow">
          <h2>Contact</h2>
          {s.contact_email && <p>Email: <a href={'mailto:' + s.contact_email}>{s.contact_email}</a></p>}
          {s.contact_phone && <p>Phone: {s.contact_phone}</p>}
          {s.address && <p className="pre">{s.address}</p>}
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          <p className="muted small">{s.disclaimer}</p>
          <p className="muted small">© {new Date().getFullYear()} {s.site_name} · <Link to="/privacy" className="link">Privacy policy</Link></p>
        </div>
      </footer>
    </div>
  )
}
