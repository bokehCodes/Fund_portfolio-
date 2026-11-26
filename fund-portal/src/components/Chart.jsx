export default function Chart({ points }) {
  if (!points || points.length < 2) return <p className="muted">The balance chart appears once there are two or more transactions.</p>
  const W = 640, H = 200, P = 8
  const ys = points.map((p) => p.y)
  const min = Math.min(0, ...ys), max = Math.max(...ys)
  const span = max - min || 1
  const x = (i) => P + (i * (W - 2 * P)) / (points.length - 1)
  const y = (v) => H - P - ((v - min) * (H - 2 * P)) / span
  const line = points.map((p, i) => `${x(i)},${y(p.y)}`).join(' ')
  const area = `${P},${H - P} ${line} ${W - P},${H - P}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" preserveAspectRatio="none" role="img" aria-label="Balance over time">
      <polygon points={area} fill="var(--primary)" opacity="0.12" />
      <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
