import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/Auth'
import { useSettings } from '../context/Settings'
import { money, stats, balanceSeries, CLASS_LABEL, TYPE_LABEL, fmtDate } from '../lib/util'
import Chart from '../components/Chart'
import TxTable from '../components/TxTable'
import NewsList from '../components/NewsList'

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const { settings: s } = useSettings()
  const cur = s.currency || 'USD'
  const [tab, setTab] = useState('overview')
  const [txs, setTxs] = useState([])
  const [holdings, setHoldings] = useState([])
  const [news, setNews] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const [t, h, n] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', profile.id)
          .order('occurred_on', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('holdings').select('*').eq('user_id', profile.id),
        supabase.from('news').select('*').eq('published', true).order('published_at', { ascending: false }),
      ])
      setTxs(t.data || []); setHoldings(h.data || []); setNews(n.data || [])
    })()
  }, [profile?.id])

  const st = useMemo(() => stats(txs), [txs])
  const series = useMemo(() => balanceSeries(txs), [txs])
  const filtered = filter === 'all' ? txs : txs.filter((t) => t.type === filter)
  const profitRows = txs.filter((t) => t.type === 'profit' || t.type === 'loss')

  return (
    <div>
      <header className="nav">
        <div className="wrap nav-in">
          <Link to="/" className="brand">{s.logo_url && <img src={s.logo_url} alt="" />}<span>{s.site_name}</span></Link>
          <nav>
            {profile?.role === 'admin' && <Link to="/admin" className="btn ghost small">Admin</Link>}
            <button className="btn ghost small" onClick={signOut}>Sign out</button>
          </nav>
        </div>
      </header>

      <main className="wrap section-sm">
        <h1 className="h1">Welcome{profile?.full_name ? ', ' + profile.full_name : ''}</h1>
        {profile?.account_ref && <p className="muted">Account ref: {profile.account_ref}</p>}

        <div className="tabs">
          {['overview', 'transactions', 'profits', 'news'].map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid3">
              <div className="card stat"><span className="muted">Current balance</span><strong>{money(st.balance, cur)}</strong></div>
              <div className="card stat"><span className="muted">Net deposited</span><strong>{money(st.netContributed, cur)}</strong></div>
              <div className="card stat">
                <span className="muted">Total profit</span>
                <strong className={st.profit >= 0 ? 'pos' : 'neg'}>{money(st.profit, cur)}</strong>
              </div>
            </div>

            <div className="card"><h3>Balance over time</h3><Chart points={series} /></div>

            {holdings.length > 0 && (
              <div className="card">
                <h3>Current holdings</h3>
                <div className="table-wrap"><table>
                  <thead><tr><th>Asset</th><th>Class</th><th className="r">Invested</th><th className="r">Current value</th></tr></thead>
                  <tbody>{holdings.map((h) => (
                    <tr key={h.id}><td>{h.asset_name}</td><td>{CLASS_LABEL[h.asset_class]}</td>
                      <td className="r">{money(h.invested, cur)}</td><td className="r">{money(h.current_value, cur)}</td></tr>
                  ))}</tbody>
                </table></div>
              </div>
            )}

            <div className="card"><h3>Recent activity</h3><TxTable txs={txs.slice(0, 5)} cur={cur} /></div>
          </>
        )}

        {tab === 'transactions' && (
          <div className="card">
            <div className="row">
              <h3>Transaction history</h3>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All types</option>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <TxTable txs={filtered} cur={cur} />
          </div>
        )}

        {tab === 'profits' && (
          <>
            <div className="card">
              <h3>Profit by asset class</h3>
              {Object.keys(st.byClass).length === 0 ? <p className="muted">No profit entries yet.</p> : (
                <div className="table-wrap"><table><tbody>
                  {Object.entries(st.byClass).map(([k, v]) => (
                    <tr key={k}><td>{CLASS_LABEL[k]}</td><td className={'r ' + (v >= 0 ? 'pos' : 'neg')}>{money(v, cur)}</td></tr>
                  ))}
                </tbody></table></div>
              )}
            </div>
            <div className="card"><h3>Where and when profit came from</h3><TxTable txs={profitRows} cur={cur} /></div>
          </>
        )}

        {tab === 'news' && (
          <div className="card"><h3>News &amp; updates</h3><NewsList items={news} /></div>
        )}

        <p className="muted small disc">{s.disclaimer}</p>
      </main>
    </div>
  )
}
