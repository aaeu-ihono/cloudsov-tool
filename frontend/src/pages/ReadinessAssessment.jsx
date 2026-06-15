import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useReadiness } from '../hooks/useReadiness'

// ── Colour palette ──────────────────────────────────────────────────────────
const PROVIDER_COLORS = {
  AWS:      '#FF9900',
  'T-Systems OTC':  '#E53935',
  STACKIT:  '#1A237E',
  // Scaleway: '#7B1FA2',
}
const FALLBACK_COLORS = [
  '#00897B','#F4511E','#6D4C41','#039BE5','#43A047',
  '#8b5513','#8E24AA','#3949AB','#00ACC1','#C0CA33',
  '#D81B60','#546E7A','#5E35B1', '#000000',
]
function colorFor(name, allProviders) {
  // alert(allProviders)
  if (PROVIDER_COLORS[name]) return PROVIDER_COLORS[name]
  const extra = allProviders.filter(p => !PROVIDER_COLORS[p])
  return FALLBACK_COLORS[extra.indexOf(name) % FALLBACK_COLORS.length]
}
function gradId(name) {
  return `grad-${name.replace(/[^a-zA-Z0-9]/g, '_')}`
}

// Services NOT needed by Alps Alpine (industry-standard additions)
const GLOBE_SERVICES = new Set([
  'AWS Elastic Beanstalk', 'Amazon EFS', 'Amazon Aurora', 'Amazon ElastiCache',
  'Amazon Redshift', 'Amazon CloudFront', 'AWS Direct Connect', 'AWS CloudTrail',
  'AWS CloudFormation', 'Amazon Kinesis',
])

// ── Tooltip ─────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, details, categories }) {
  if (!active || !payload?.length) return null
  const sorted = [...payload].sort((a, b) => b.value - a.value)
  const isCat = Boolean(categories?.[label])
  const services = isCat ? (categories[label] ?? []) : null

  return (
    <div className="ra-tooltip">
      <div className="ra-tooltip-label">{label}</div>
      {sorted.map(entry => {
        const catData = isCat ? (details[entry.name]?.[label] ?? {}) : null
        const metaKey = label === 'Scalability' ? 'scalability' : 'performance'
        const note = !isCat && entry.name !== 'AWS'
          ? details[entry.name]?.meta?.[`${metaKey}_note`]
          : null

        return (
          <div key={entry.name} className="ra-tooltip-block">
            <div className="ra-tooltip-row">
              <span className="ra-tooltip-dot" style={{ background: entry.color }} />
              <span className="ra-tooltip-name">{entry.name}</span>
              <span className="ra-tooltip-val">{entry.value}%</span>
            </div>
            {services && catData && (
              <div className="ra-tooltip-coverage">
                {services.map(svc => {
                  const cov = (catData[svc]?.coverage ?? 'N').toLowerCase()
                  const short = svc.replace(/^(AWS |Amazon )/, '')
                  const equiv = catData[svc]?.equivalent
                  const equivShort = equiv ? equiv.split(/[,(]/)[0].trim().slice(0, 16) : null
                  return (
                    <span key={svc} className={`ra-tooltip-svc ra-tooltip-svc-${cov}`}>
                      {cov === 'n' ? <s>{short}</s> : short}
                      {equivShort && cov !== 'n' && (
                        <span className="ra-tt-equiv"> ▸ {equivShort}</span>
                      )}
                    </span>
                  )
                })}
              </div>
            )}
            {note && (
              <div className="ra-tooltip-note">
                {note.length > 90 ? note.slice(0, 90) + '…' : note}
              </div>
            )}
          </div>
        )
      })}
      {isCat && (
        <div className="ra-tooltip-legend">
          <span className="ra-tooltip-svc ra-tooltip-svc-y">Full</span>
          <span className="ra-tooltip-svc ra-tooltip-svc-p">Partial</span>
          <span className="ra-tooltip-svc ra-tooltip-svc-n">None</span>
        </div>
      )}
    </div>
  )
}

// ── Detail panel ─────────────────────────────────────────────────────────────
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

// ── Legend ───────────────────────────────────────────────────────────────────
function ReadinessLegend({ categories }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showServices, setShowServices] = useState(false)
  const catEntries = Object.entries(categories ?? {})
  const totalServices = catEntries.reduce((sum, [, svcs]) => sum + svcs.length, 0)

  return (
    <div className="legend" style={{ marginTop: 28 }}>
      <div
        className={`legend-title${collapsed ? ' collapsed' : ''}`}
        onClick={() => setCollapsed(c => !c)}
      >
        Assessment Methodology &amp; Services Reference
      </div>
      <div className={`legend-body${collapsed ? ' hidden' : ''}`}>
        <div className="ra-legend-grid">

          {/* Left — methodology */}
          <div>
            <div className="legend-heading">How it works</div>
            <p className="ra-legend-text">
              AWS is used as the 100% capability baseline across 13 dimensions. Each EU provider
              is scored per dimension based on whether a managed equivalent service exists.
              The gap between a provider line and the AWS ceiling is the readiness gap —
              the larger the gap, the more migration friction an enterprise would face.
            </p>
            <div className="legend-heading" style={{ marginTop: 12 }}>Coverage scoring (per service)</div>
            <div className="legend-row" style={{ marginTop: 4 }}>
              <span className="ra-cov ra-cov-y">Y</span>
              <span className="legend-desc">Full — a managed equivalent exists with comparable functionality and GA status</span>
            </div>
            <div className="legend-row">
              <span className="ra-cov ra-cov-p">P</span>
              <span className="legend-desc">Partial — service exists but is in beta, feature-limited, or requires a workaround</span>
            </div>
            <div className="legend-row">
              <span className="ra-cov ra-cov-n">N</span>
              <span className="legend-desc">None — no managed equivalent; self-hosting on IaaS required</span>
            </div>
            <div className="legend-heading" style={{ marginTop: 12 }}>Dimension scoring</div>
            <p className="ra-legend-text">
              Each feature dimension score = (Y×2 + P×1) / (services×2) × 100.
              Scalability &amp; Performance are pre-assessed 0–100 scores based on published
              regions, auto-scaling capabilities, and SLA documentation.
            </p>
          </div>

          {/* Right — services list */}
          <div>
            <div className="legend-heading" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{totalServices} AWS services · {catEntries.length} feature dimensions</span>
              <button className="ra-legend-expand-btn" onClick={() => setShowServices(s => !s)}>
                {showServices ? 'collapse ▴' : 'show all ▾'}
              </button>
            </div>

            {!showServices && (
              <div className="ra-legend-cat-chips">
                {catEntries.map(([cat, svcs]) => (
                  <span key={cat} className="ra-legend-chip">
                    {cat} <span className="ra-legend-chip-count">{svcs.length}</span>
                  </span>
                ))}
              </div>
            )}

            {showServices && (
              <div className="ra-legend-services">
                {catEntries.map(([cat, svcs]) => (
                  <div key={cat} className="ra-legend-cat">
                    <div className="ra-legend-cat-name">
                      {cat} <span className="ra-legend-cat-count">{svcs.length} services</span>
                    </div>
                    <div className="ra-legend-svc-list">
                      {svcs.map(svc => (
                        <span key={svc} className={`ra-legend-svc${GLOBE_SERVICES.has(svc) ? ' ra-legend-svc-globe' : ''}`}>
                          {GLOBE_SERVICES.has(svc) ? '🌐' : '⭐'} {svc.replace(/^(AWS |Amazon )/, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        <div className="legend-source">
          ⭐ = Required by Alps Alpine (Ja in checklist) — 50 services &nbsp;·&nbsp;
          🌐 = Industry Top-50 standard, not currently identified as needed — 10 services &nbsp;·&nbsp;
          Source: <a href="https://aws.amazon.com/products/" target="_blank" rel="noreferrer">aws.amazon.com/products</a> ·
          Full mapping in <code>REFERENCES.md</code>
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ReadinessAssessment() {
  const { data, error } = useReadiness()
  const [activeProviders, setActiveProviders] = useState(null)
  const [selected, setSelected] = useState({ provider: null, dimension: null })
  const [expandedRows, setExpandedRows] = useState(new Set())

  const providers = data?.providers ?? []
  const chartData = data?.chart_data ?? []
  const details = data?.details ?? {}
  const categories = data?.categories ?? {}

  const visibleProviders = activeProviders ?? providers

  function toggleProvider(name) {
    const current = activeProviders ?? providers
    if (current.includes(name)) {
      if (current.length === 1) return
      setActiveProviders(current.filter(p => p !== name))
    } else {
      setActiveProviders([...current, name])
    }
  }

  // On first load: default to AWS + top 3 EU providers by avg score
  useEffect(() => {
    if (!data || activeProviders !== null) return
    const top3 = providers
      .filter(p => p !== 'AWS')
      .map(p => ({
        name: p,
        avg: chartData.reduce((a, r) => a + (r[p] ?? 0), 0) / chartData.length,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map(p => p.name)
    setActiveProviders(['AWS', ...top3])
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const tooltipRenderer = useCallback(
    (props) => <CustomTooltip {...props} details={details} categories={categories} />,
    [details, categories]
  )

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

      {/* ── Header ── */}
      <div className="ss-header">
        <div>
          <div className="ss-title">Cloud Readiness Assessment</div>
          <div className="ss-sub">
            EU Provider Capability Gap Analysis · AWS as 100% baseline · {providers.length} providers · 60 services across 13 dimensions
          </div>
        </div>
      </div>

      {/* ── Provider grid toggles ── */}
      <div className="ra-toggle-grid">
        {providers.map(p => (
          <button
            key={p}
            className={`ra-toggle-btn${visibleProviders.includes(p) ? ' active' : ''}`}
            style={visibleProviders.includes(p) ? {
              borderColor: colorFor(p, providers),
              background: colorFor(p, providers) + '18',
              color: colorFor(p, providers),
            } : {}}
            onClick={() => toggleProvider(p)}
          >
            <span
              className="ra-toggle-dot"
              style={{ background: visibleProviders.includes(p) ? colorFor(p, providers) : '#d1d5db' }}
            />
            {p}
          </button>
        ))}
      </div>

      {/* ── Charts row: Radar + Area side by side ── */}
      <div className="ra-charts-row">

        {/* Radar — narrower column */}
        <div className="ra-charts-col ra-charts-col-radar">
          <div className="ra-section-label">Coverage Profile</div>
          <div className="ra-section-sub">Each provider's shape vs the AWS outer ring</div>
          <div className="ra-radar-wrap ra-charts-fill">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  tickFormatter={v => `${v}%`}
                  tickCount={5}
                />
                <Tooltip content={tooltipRenderer} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.73rem', paddingTop: 10 }}
                />
                {visibleProviders.map(p => (
                  <Radar
                    key={p}
                    name={p}
                    dataKey={p}
                    stroke={colorFor(p, providers)}
                    fill={colorFor(p, providers)}
                    fillOpacity={p === 'AWS' ? 0.07 : 0.13}
                    strokeWidth={p === 'AWS' ? 2.5 : 1.8}
                    strokeDasharray={p === 'AWS' ? '6 3' : undefined}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area chart — wider column */}
        <div className="ra-charts-col ra-charts-col-area">
          <div className="ra-section-label">Dimension Breakdown</div>
          <div className="ra-section-sub">Hover a point for service detail · click to pin below</div>
          <div className="ra-chart-wrap ra-charts-fill">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 80 }}>
                <defs>
                  {visibleProviders.map(p => (
                    <linearGradient key={p} id={gradId(p)} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={colorFor(p, providers)} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={colorFor(p, providers)} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="dimension"
                  angle={-40}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  height={90}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 12, fill: '#374151' }}
                  width={45}
                />
                <Tooltip content={tooltipRenderer} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.73rem' }}
                />
                <ReferenceLine y={100} stroke="#FF9900" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: 'AWS baseline', position: 'insideTopRight', fontSize: 10, fill: '#FF9900' }} />
                {visibleProviders.map(p => (
                  <Area
                    key={p}
                    type="monotone"
                    dataKey={p}
                    stroke={colorFor(p, providers)}
                    strokeWidth={p === 'AWS' ? 2.5 : 2}
                    fill={p === 'AWS' ? 'none' : `url(#${gradId(p)})`}
                    fillOpacity={1}
                    dot={{ r: 4, strokeWidth: 1.5, stroke: colorFor(p, providers), fill: '#fff' }}
                    activeDot={{
                      r: 6,
                      cursor: 'pointer',
                      onClick: (_, payload) => {
                        const idx = payload?.index ?? payload?.activeIndex
                        setSelected({ provider: p, dimension: idx !== undefined ? chartData[idx]?.dimension : null })
                      },
                    }}
                    strokeDasharray={p === 'AWS' ? '6 3' : undefined}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>


      {/* ── Dimension + provider selector ── */}
      <div className="ra-dim-nav" style={{ marginTop: 16 }}>
        <span className="ra-dim-label">Inspect:</span>
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

      {/* ── Detail panel ── */}
      <DetailPanel
        provider={selected.provider}
        dimension={selected.dimension}
        details={details}
        categories={categories}
      />

   
      {/* ── Gap summary ── */}
      <div className="ra-gap-section">
        <div className="ra-gap-title">
          Average Gap to AWS (across all 13 dimensions)
          <span className="ra-gap-hint"> · click a row to see service alternatives</span>
        </div>
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
            {gapSummary.map((row, i) => {
              const isExpanded = expandedRows.has(row.name)
              return (
                <React.Fragment key={row.name}>
                  <tr
                    className={`ra-gap-row${isExpanded ? ' ra-gap-row-expanded' : ''}`}
                    onClick={() => setExpandedRows(prev => {
                      const next = new Set(prev)
                      isExpanded ? next.delete(row.name) : next.add(row.name)
                      return next
                    })}
                  >
                    <td className="ra-gap-rank">#{i + 1}</td>
                    <td>
                      <span className="ra-gap-expand-icon">{isExpanded ? '▼' : '▶'}</span>
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

                  {isExpanded && (
                    <tr className="ra-expand-row">
                      <td colSpan={5} className="ra-expand-cell">
                        <div className="ra-expand-panel">
                          {Object.entries(categories).map(([cat, svcs]) => {
                            const catData = details[row.name]?.[cat] ?? {}
                            return (
                              <div key={cat} className="ra-expand-cat">
                                <div className="ra-expand-cat-name">{cat}</div>
                                <div className="ra-expand-svc-list">
                                  {svcs.map(svc => {
                                    const d = catData[svc] ?? {}
                                    const cov = (d.coverage ?? 'N').toLowerCase()
                                    const short = svc.replace(/^(AWS |Amazon )/, '')
                                    return (
                                      <div key={svc} className={`ra-expand-svc ra-expand-svc-${cov}`}>
                                        <span className="ra-expand-aws-name">
                                          {cov === 'n' ? <s>{short}</s> : short}
                                        </span>
                                        {cov !== 'n' && d.equivalent && (
                                          <span className="ra-expand-equiv">▸ {d.equivalent}</span>
                                        )}
                                        {cov === 'n' && (
                                          <span className="ra-expand-none">No alternative</span>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

         {/* ── Legend ── */}
      <ReadinessLegend categories={categories} />


    </div>
  )
}
