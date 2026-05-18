import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useReadiness } from '../hooks/useReadiness'

// ── Colour palette ─────────────────────────────────────────────────────────
const PROVIDER_COLORS = {
  AWS:       '#FF9900',
  Hetzner:   '#E53935',
  OVHcloud:  '#1565C0',
  STACKIT:   '#1A237E',
  Scaleway:  '#7B1FA2',
}
const FALLBACK_COLORS = [
  '#00897B','#F4511E','#6D4C41','#039BE5','#43A047',
  '#FB8C00','#8E24AA','#3949AB','#00ACC1','#C0CA33',
  '#D81B60','#546E7A','#5E35B1',
]
function colorFor(name, allProviders) {
  if (PROVIDER_COLORS[name]) return PROVIDER_COLORS[name]
  const extra = allProviders.filter(p => !PROVIDER_COLORS[p])
  return FALLBACK_COLORS[extra.indexOf(name) % FALLBACK_COLORS.length]
}

// ── Custom tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const sorted = [...payload].sort((a, b) => b.value - a.value)
  return (
    <div className="ra-tooltip">
      <div className="ra-tooltip-label">{label}</div>
      {sorted.map(entry => (
        <div key={entry.name} className="ra-tooltip-row">
          <span className="ra-tooltip-dot" style={{ background: entry.color }} />
          <span className="ra-tooltip-name">{entry.name}</span>
          <span className="ra-tooltip-val">{entry.value}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Detail panel ────────────────────────────────────────────────────────────
function DetailPanel({ provider, dimension, details, categories }) {
  if (!provider || !dimension || !details || !details[provider]) return null
  const isFeatureCat = categories && categories[dimension]
  if (!isFeatureCat) {
    const meta = details[provider]?.meta ?? {}
    const key = dimension === 'Scalability' ? 'scalability' : 'performance'
    return (
      <div className="ra-detail">
        <div className="ra-detail-title">{provider} — {dimension}</div>
        <div className="ra-detail-score">Score: {meta[`${key}_score`] ?? '—'}%</div>
        <div className="ra-detail-note">{meta[`${key}_note`] ?? ''}</div>
        {meta[`${key}_source`] && (
          <a className="ra-detail-src" href={meta[`${key}_source`]} target="_blank" rel="noreferrer">
            Source ↗
          </a>
        )}
      </div>
    )
  }
  const services = categories[dimension] ?? []
  const catData = details[provider]?.[dimension] ?? {}
  return (
    <div className="ra-detail">
      <div className="ra-detail-title">{provider} — {dimension}</div>
      <table className="ra-detail-table">
        <thead>
          <tr>
            <th>AWS Service</th>
            <th>Coverage</th>
            <th>EU Equivalent / Note</th>
          </tr>
        </thead>
        <tbody>
          {services.map(svc => {
            const d = catData[svc] ?? {}
            const cov = d.coverage ?? 'N'
            return (
              <tr key={svc}>
                <td className="ra-svc-name">{svc}</td>
                <td>
                  <span className={`ra-cov ra-cov-${cov.toLowerCase()}`}>{cov}</span>
                </td>
                <td className="ra-svc-note">
                  {d.equivalent && <strong>{d.equivalent}</strong>}
                  {d.equivalent && d.note && ' — '}
                  {d.note}
                  {d.source && (
                    <a href={d.source} target="_blank" rel="noreferrer" className="ra-src-link"> ↗</a>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ReadinessAssessment() {
  const { data, error } = useReadiness()
  const [activeProviders, setActiveProviders] = useState(null)
  const [selected, setSelected] = useState({ provider: null, dimension: null })

  const providers = data?.providers ?? []
  const chartData = data?.chart_data ?? []
  const details = data?.details ?? {}
  const categories = data?.categories ?? {}

  // Default: show all providers once data loads
  const visibleProviders = activeProviders ?? providers

  // Toggle a provider on/off
  function toggleProvider(name) {
    const current = activeProviders ?? providers
    if (current.includes(name)) {
      if (current.length === 1) return // keep at least one
      setActiveProviders(current.filter(p => p !== name))
    } else {
      setActiveProviders([...current, name])
    }
  }

  // Gap summary: for each visible non-AWS provider, avg gap across all dimensions
  const gapSummary = useMemo(() => {
    if (!chartData.length || !providers.length) return []
    const awsRow = Object.fromEntries(chartData.map(r => [r.dimension, r.AWS ?? 100]))
    return providers
      .filter(p => p !== 'AWS')
      .map(p => {
        const gaps = chartData.map(r => (awsRow[r.dimension] ?? 100) - (r[p] ?? 0))
        const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
        const score = Math.round(chartData.reduce((a, r) => a + (r[p] ?? 0), 0) / chartData.length)
        return { name: p, avgGap: avg, avgScore: score }
      })
      .sort((a, b) => a.avgGap - b.avgGap)
  }, [chartData, providers])

  if (error) return (
    <div className="content" style={{ color: '#dc2626' }}>
      API error: {error}. Is the FastAPI server running on port 8000?
    </div>
  )
  if (!data) return (
    <div className="content" style={{ color: '#6b7280' }}>Loading…</div>
  )

  return (
    <div className="content">
      {/* Header */}
      <div className="ss-header">
        <div>
          <div className="ss-title">Cloud Readiness Assessment</div>
          <div className="ss-sub">
            EU Provider Capability Gap Analysis · AWS as 100% baseline · {providers.length} providers · 60 services across 13 dimensions
          </div>
        </div>
      </div>

      {/* Provider toggles */}
      <div className="ra-toggles">
        {providers.map(p => (
          <button
            key={p}
            className={`ra-toggle-btn${visibleProviders.includes(p) ? ' active' : ''}`}
            style={visibleProviders.includes(p) ? { borderColor: colorFor(p, providers), color: colorFor(p, providers) } : {}}
            onClick={() => toggleProvider(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Line chart */}
      <div className="ra-chart-wrap">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="dimension"
              angle={-40}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 12, fill: '#374151' }}
              height={80}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 12, fill: '#374151' }}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <ReferenceLine y={100} stroke="#FF9900" strokeDasharray="4 2" strokeWidth={1} />
            {visibleProviders.map(p => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={colorFor(p, providers)}
                strokeWidth={p === 'AWS' ? 2.5 : 2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{
                  r: 6,
                  cursor: 'pointer',
                  onClick: (_, payload) => setSelected({ provider: p, dimension: payload.index !== undefined ? chartData[payload.index]?.dimension : null }),
                }}
                strokeDasharray={p === 'AWS' ? '6 3' : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="ra-chart-hint">Click any data point to inspect service-level detail below.</p>

      {/* Dimension selector for detail panel */}
      <div className="ra-dim-nav">
        <span className="ra-dim-label">Inspect dimension:</span>
        {(data.dimensions ?? []).map(dim => (
          <button
            key={dim}
            className={`ra-dim-btn${selected.dimension === dim ? ' active' : ''}`}
            onClick={() => setSelected(s => ({ ...s, dimension: dim }))}
          >
            {dim}
          </button>
        ))}
      </div>

      {/* Provider selector for detail panel */}
      {selected.dimension && (
        <div className="ra-dim-nav" style={{ marginTop: 6 }}>
          <span className="ra-dim-label">Provider:</span>
          {providers.map(p => (
            <button
              key={p}
              className={`ra-dim-btn${selected.provider === p ? ' active' : ''}`}
              style={selected.provider === p ? { borderColor: colorFor(p, providers), color: colorFor(p, providers) } : {}}
              onClick={() => setSelected(s => ({ ...s, provider: p }))}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      <DetailPanel
        provider={selected.provider}
        dimension={selected.dimension}
        details={details}
        categories={categories}
      />

      {/* Gap summary table */}
      <div className="ra-gap-section">
        <div className="ra-gap-title">Average Gap to AWS (across all 13 dimensions)</div>
        <table className="ra-gap-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Provider</th>
              <th>Avg. Coverage</th>
              <th>Avg. Gap to AWS</th>
              <th>Gap bar</th>
            </tr>
          </thead>
          <tbody>
            {gapSummary.map((row, i) => (
              <tr key={row.name}>
                <td className="ra-gap-rank">#{i + 1}</td>
                <td>
                  <span className="ra-gap-dot" style={{ background: colorFor(row.name, providers) }} />
                  {row.name}
                </td>
                <td className="ra-gap-score">{row.avgScore}%</td>
                <td className="ra-gap-val">−{row.avgGap}%</td>
                <td className="ra-gap-bar-cell">
                  <div className="ra-gap-bar-bg">
                    <div
                      className="ra-gap-bar-fill"
                      style={{ width: `${row.avgGap}%`, background: colorFor(row.name, providers) }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
