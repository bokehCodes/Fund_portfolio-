import { fmtDate, money, TYPE_LABEL, CLASS_LABEL, signed } from '../lib/util'

export default function TxTable({ txs, cur, onDelete }) {
  if (!txs.length) return <p className="muted">No transactions yet.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Type</th><th>Asset</th><th>Details</th><th className="r">Amount</th>
            {onDelete && <th />}
          </tr>
        </thead>
        <tbody>
          {txs.map((t) => (
            <tr key={t.id}>
              <td>{fmtDate(t.occurred_on)}</td>
              <td><span className={'pill ' + t.type}>{TYPE_LABEL[t.type]}</span></td>
              <td>
                {t.asset_class ? CLASS_LABEL[t.asset_class] : '—'}
                {t.asset_name ? <div className="muted small">{t.asset_name}</div> : null}
              </td>
              <td className="muted">{t.note || '—'}</td>
              <td className={'r ' + (signed(t) >= 0 ? 'pos' : 'neg')}>
                {signed(t) >= 0 ? '+' : '−'}{money(Math.abs(signed(t)), cur)}
              </td>
              {onDelete && (
                <td className="r"><button className="btn ghost small" onClick={() => onDelete(t)}>Delete</button></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
