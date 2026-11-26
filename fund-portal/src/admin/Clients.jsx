import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSettings } from '../context/Settings'
import { useAuth } from '../context/Auth'
import { money, stats, CLASS_LABEL, TYPE_LABEL } from '../lib/util'
import TxTable from '../components/TxTable'

export default function Clients() {
  const [list, setList] = useState([])
  const [sel, setSel] = useState(null)

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setList(data || [])
  }
  useEffect(() => { load() }, [])

  if (sel) return <ClientDetail client={sel} onBack={() => { setSel(null); load() }} />

  return (
    <>
      <div className="card">
        <h3>Add a new client</h3>
        <p className="muted">
          In your Supabase dashboard open <b>Authentication → Users → Add user → Create new user</b>, enter the client’s
          email and a password, and tick “Auto Confirm User”. They appear here immediately, ready for you to add their
          name and records.
        </p>
        <button className="btn ghost small" onClick={load}>Refresh list</button>
      </div>
      <div className="card">
        <h3>All accounts</h3>
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Ref</th><th>Role</th><th>Consent</th><th /></tr></thead>
          <tbody>{list.map((p) => (
            <tr key={p.id}>
              <td>{p.full_name || '—'}</td><td>{p.email}</td><td>{p.account_ref || '—'}</td><td>{p.role}</td>
              <td>{p.consent_at ? <span className="pos">Signed {new Date(p.consent_at).toLocaleDateString()}</span> : <span className="muted">Not yet</span>}</td>
              <td className="r"><button className="btn small" onClick={() => setSel(p)}>Open</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

function ClientDetail({ client, onBack }) {
  const { profile: currentProfile } = useAuth()
  const { settings: s } = useSettings()
  const cur = s.currency || 'USD'
  const [p, setP] = useState(client)
  const [txs, setTxs] = useState([])
  const [holdings, setHoldings] = useState([])
  const [tx, setTx] = useState({ type: 'profit', asset_class: 'bonds', asset_name: '', amount: '', occurred_on: today(), note: '' })
  const [h, setH] = useState({ asset_class: 'bonds', asset_name: '', invested: '', current_value: '' })
  const [roleBusy, setRoleBusy] = useState(false)

  const load = async () => {
    const [t, hh] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', p.id).order('occurred_on', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('holdings').select('*').eq('user_id', p.id).order('asset_name'),
    ])
    setTxs(t.data || []); setHoldings(hh.data || [])
  }
  useEffect(() => { load() }, [p.id])

  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').update({ full_name: p.full_name, account_ref: p.account_ref }).eq('id', p.id)
    alert(error ? error.message : 'Saved')
  }

  const changeRole = async (role) => {
    if (role === p.role || roleBusy) return
    if (p.id === currentProfile?.id && role !== 'admin') {
      alert('You cannot demote your own administrator account.')
      return
    }
    if (p.role === 'admin' && role === 'client') {
      const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
      if (error) return alert(`Could not verify the administrator count: ${error.message}`)
      if (count <= 1) return alert('The last administrator cannot be demoted.')
    }
    if (!confirm(`Change ${p.email} from ${p.role} to ${role}?`)) return

    setRoleBusy(true)
    try {
      const { data, error } = await supabase.from('profiles').update({ role }).eq('id', p.id).select('*').single()
      if (error) return alert(error.message)
      setP(data)
    } catch (error) {
      alert(error.message || 'Could not change the account role.')
    } finally {
      setRoleBusy(false)
    }
  }

  const addTx = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('transactions').insert({
      user_id: p.id, type: tx.type, asset_class: tx.asset_class || null, asset_name: tx.asset_name || null,
      amount: Number(tx.amount), occurred_on: tx.occurred_on, note: tx.note || null,
    })
    if (error) return alert(error.message)
    setTx({ ...tx, amount: '', note: '', asset_name: '' })
    load()
  }
  const delTx = async (t) => {
    if (!confirm('Delete this transaction?')) return
    await supabase.from('transactions').delete().eq('id', t.id)
    load()
  }

  const addHolding = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('holdings').insert({
      user_id: p.id, asset_class: h.asset_class, asset_name: h.asset_name,
      invested: Number(h.invested || 0), current_value: Number(h.current_value || 0),
    })
    if (error) return alert(error.message)
    setH({ ...h, asset_name: '', invested: '', current_value: '' })
    load()
  }
  const updHolding = async (row, patch) => {
    await supabase.from('holdings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', row.id)
    load()
  }
  const delHolding = async (row) => {
    if (!confirm('Delete this holding?')) return
    await supabase.from('holdings').delete().eq('id', row.id)
    load()
  }

  const st = stats(txs)

  return (
    <>
      <button className="btn ghost small" onClick={onBack}>← All clients</button>
      <div className="card">
        <h3>{p.email}</h3>
        <div className="form-grid">
          <div className="field"><label>Full name</label>
            <input value={p.full_name || ''} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></div>
          <div className="field"><label>Account reference</label>
            <input value={p.account_ref || ''} onChange={(e) => setP({ ...p, account_ref: e.target.value })} /></div>
          <div className="field"><label>Role</label>
            <select value={p.role} disabled={roleBusy} onChange={(e) => changeRole(e.target.value)}>
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select></div>
        </div>
        <button className="btn small" onClick={saveProfile}>Save</button>
        <p className="muted small">
          {p.consent_at
            ? `Privacy consent signed by “${p.consent_name}” on ${new Date(p.consent_at).toLocaleString()} (policy v${p.consent_version}).`
            : 'Privacy consent not yet signed.'}
        </p>
        <p className="muted">Balance {money(st.balance, cur)} · Net deposited {money(st.netContributed, cur)} · Profit {money(st.profit, cur)}</p>
      </div>

      <div className="card">
        <h3>Add transaction</h3>
        <form onSubmit={addTx} className="form-grid">
          <div className="field"><label>Type</label>
            <select value={tx.type} onChange={(e) => setTx({ ...tx, type: e.target.value })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div className="field"><label>Asset class</label>
            <select value={tx.asset_class} onChange={(e) => setTx({ ...tx, asset_class: e.target.value })}>
              <option value="">—</option>
              {['bonds', 'crypto', 'precious_metals', 'cash'].map((k) => <option key={k} value={k}>{CLASS_LABEL[k]}</option>)}</select></div>
          <div className="field"><label>Asset name (e.g. US 10Y Treasury, BTC, Gold)</label>
            <input value={tx.asset_name} onChange={(e) => setTx({ ...tx, asset_name: e.target.value })} /></div>
          <div className="field"><label>Amount ({cur}, positive number)</label>
            <input type="number" step="0.01" min="0" required value={tx.amount} onChange={(e) => setTx({ ...tx, amount: e.target.value })} /></div>
          <div className="field"><label>Date</label>
            <input type="date" required value={tx.occurred_on} onChange={(e) => setTx({ ...tx, occurred_on: e.target.value })} /></div>
          <div className="field"><label>Note shown to client</label>
            <input value={tx.note} onChange={(e) => setTx({ ...tx, note: e.target.value })} /></div>
          <div className="field"><label>&nbsp;</label><button className="btn">Add</button></div>
        </form>
      </div>

      <div className="card"><h3>Transactions</h3><TxTable txs={txs} cur={cur} onDelete={delTx} /></div>

      <div className="card">
        <h3>Holdings</h3>
        <form onSubmit={addHolding} className="form-grid">
          <div className="field"><label>Class</label>
            <select value={h.asset_class} onChange={(e) => setH({ ...h, asset_class: e.target.value })}>
              {['bonds', 'crypto', 'precious_metals', 'cash'].map((k) => <option key={k} value={k}>{CLASS_LABEL[k]}</option>)}</select></div>
          <div className="field"><label>Asset name</label>
            <input required value={h.asset_name} onChange={(e) => setH({ ...h, asset_name: e.target.value })} /></div>
          <div className="field"><label>Invested</label>
            <input type="number" step="0.01" value={h.invested} onChange={(e) => setH({ ...h, invested: e.target.value })} /></div>
          <div className="field"><label>Current value</label>
            <input type="number" step="0.01" value={h.current_value} onChange={(e) => setH({ ...h, current_value: e.target.value })} /></div>
          <div className="field"><label>&nbsp;</label><button className="btn">Add holding</button></div>
        </form>
        {holdings.length > 0 && (
          <div className="table-wrap"><table>
            <thead><tr><th>Asset</th><th>Class</th><th>Invested</th><th>Current value</th><th /></tr></thead>
            <tbody>{holdings.map((r) => (
              <tr key={r.id}>
                <td>{r.asset_name}</td><td>{CLASS_LABEL[r.asset_class]}</td>
                <td><input type="number" step="0.01" defaultValue={r.invested}
                  onBlur={(e) => Number(e.target.value) !== Number(r.invested) && updHolding(r, { invested: Number(e.target.value) })} /></td>
                <td><input type="number" step="0.01" defaultValue={r.current_value}
                  onBlur={(e) => Number(e.target.value) !== Number(r.current_value) && updHolding(r, { current_value: Number(e.target.value) })} /></td>
                <td className="r"><button className="btn ghost small" onClick={() => delHolding(r)}>Delete</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  )
}
