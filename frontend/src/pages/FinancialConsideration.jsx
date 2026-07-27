import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, ReferenceArea,
  ScatterChart, Scatter, ZAxis,
  BarChart, Bar, Cell,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  OVHcloud:        '#2563eb',
  'T-Cloud Public':'#0891b2',
  STACKIT:         '#16a34a',
  Scaleway:        '#d97706',
  IONOS:           '#7c3aed',
}

const REV_COLORS = {
  AWS:             '#374151',
  OVHcloud:        '#2563eb',
  IONOS:           '#7c3aed',
  'T-Cloud Public':'#0891b2',
  Scaleway:        '#d97706',
  STACKIT:         '#16a34a',
}

/* Inline SVG label — white rect masks the line, text sits on top */
function InlineLabel({ viewBox, value, fill }) {
  const { x, y } = viewBox ?? {}
  if (x == null) return null
  const w = (value?.length ?? 0) * 5.0 + 8
  return (
    <g>
      <rect x={x - w / 2} y={y - 7} width={w} height={13} fill="white" fillOpacity={0.88} rx={2} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize="8.5" fontWeight="600" fill={fill}>
        {value}
      </text>
    </g>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const seen = new Set()
  const items = payload
    .map(p => ({ name: p.dataKey.replace('_proj', ''), value: p.value, proj: p.dataKey.endsWith('_proj') }))
    .filter(p => p.value != null && !seen.has(p.name) && seen.add(p.name))
  return (
    <div style={{ background:'var(--tt-bg)', border:'1px solid var(--tt-border)', borderRadius:6, padding:'8px 12px', fontSize:12 }}>
      <div style={{ fontWeight:600, marginBottom:4, color:'var(--tt-head)' }}>{label}</div>
      <div style={{ marginBottom:3, color:'#374151' }}>AWS: 100.0</div>
      {items.map(p => (
        <div key={p.name} style={{ color: COLORS[p.name] ?? '#555', marginBottom:2 }}>
          {p.name}: {p.value?.toFixed(1)}{p.proj ? ' ↗ proj.' : ''}
        </div>
      ))}
    </div>
  )
}

function RevTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const fmt = v => v >= 1000 ? `€${(v / 1000).toFixed(1)}B` : `€${v}M`
  return (
    <div style={{ background:'var(--tt-bg)', border:'1px solid var(--tt-border)', borderRadius:6, padding:'8px 12px', fontSize:12 }}>
      <div style={{ fontWeight:600, marginBottom:4, color:'var(--tt-head)' }}>{label}</div>
      {payload.filter(p => p.value != null).map(p => (
        <div key={p.dataKey} style={{ color: REV_COLORS[p.dataKey] ?? '#555', marginBottom:2 }}>
          {p.dataKey}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

const fmtRev  = v => v == null ? '—' : v >= 1000 ? `€${(v / 1000).toFixed(0)}B` : `€${v}M`
const fmtTick = v => v >= 1000 ? `€${(v / 1000).toFixed(0)}B` : `€${v}M`

/* ── Funding mix constants ───────────────────────────────────────── */
const TYPE_TO_GROUP = {
  Capex: 'Capex', Region: 'Capex',
  Debt: 'Debt', 'EU Debt': 'Debt',
  IPO: 'Market Capital', 'PE/VC': 'Market Capital',
  Parent: 'Parent',
  'EU Grant': 'EU Programmes', 'EU Tender': 'EU Programmes',
  Infrastructure: 'Other', Acquisition: 'Other', Contract: 'Other',
}
const FUNDING_GROUPS  = ['Capex', 'Debt', 'Market Capital', 'Parent', 'EU Programmes', 'Other']
const FUNDING_COLORS  = {
  Capex:            '#3b82f6',
  Debt:             '#f97316',
  'Market Capital': '#8b5cf6',
  Parent:           '#0891b2',
  'EU Programmes':  '#10b981',
  Other:            '#9ca3af',
}

/* ── Milestone bubble chart ──────────────────────────────────────── */
const PROVIDER_Y = {
  AWS: 6, OVHcloud: 5, Scaleway: 4, 'T-Cloud Public': 3, IONOS: 2, STACKIT: 1,
}
const PROVIDER_ROW_LABELS = ['STACKIT', 'IONOS', 'T-Cloud Public', 'Scaleway', 'OVHcloud', 'AWS']

const dotRadius = amount_m => {
  if (amount_m == null) return 12
  if (amount_m === 0)   return 6
  if (amount_m < 100)   return 18
  if (amount_m < 500)   return 24
  if (amount_m < 2000)  return 30
  return 40
}

function MilestoneTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const fmtAmt = v => v == null ? 'Undisclosed' : v === 0 ? '—' : v >= 1000 ? `€${(v / 1000).toFixed(1)}B` : `€${v}M`
  const col = REV_COLORS[d.provider] ?? '#888'
  return (
    <div style={{ background:'var(--tt-bg)', border:`2px solid ${col}`, borderRadius:8, padding:'10px 14px', maxWidth:290, fontSize:12, pointerEvents:'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
        <span style={{ background:col, width:9, height:9, borderRadius:'50%', display:'inline-block', flexShrink:0 }} />
        <span style={{ fontWeight:700, color:'var(--tt-head)', fontSize:13, lineHeight:1.3 }}>{d.label}</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:7, fontSize:11, alignItems:'center' }}>
        <span style={{ color:'#6b7280' }}>{d.provider}</span>
        <span style={{ color:'#9ca3af' }}>·</span>
        <span style={{ color:'#6b7280' }}>{d.year}</span>
        <span style={{ color:'#9ca3af' }}>·</span>
        <span style={{ color:col, fontWeight:700 }}>{fmtAmt(d.amount_m)}</span>
        <span style={{ background:'#f3f4f6', color:'#374151', borderRadius:4, padding:'1px 6px', fontSize:10 }}>{d.type}</span>
      </div>
      <div style={{ color:'#4b5563', lineHeight:1.65, borderTop:'1px solid #f0f0f0', paddingTop:7 }}>
        {d.description}
      </div>
    </div>
  )
}

const fmtBubble = v => v >= 1000 ? `€${(v / 1000).toFixed(0)}B` : `€${v}M`

/* Radius computed from amount_m — label rendered inside the bubble */
function MilestoneDot({ cx, cy, payload }) {
  if (!payload || cx == null || cy == null) return null
  const fill        = REV_COLORS[payload.provider] ?? '#888'
  const undisclosed = payload.amount_m == null
  const isLaunch    = payload.amount_m === 0
  const r           = dotRadius(payload.amount_m)
  const fontSize    = r >= 30 ? 9 : 7.5
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
        fill={fill} fillOpacity={undisclosed ? 0.18 : 0.78}
        stroke={fill} strokeWidth={2}
        strokeDasharray={undisclosed ? '4 2' : undefined} />
      {!undisclosed && !isLaunch && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fontSize={fontSize} fontWeight="700" fill="white"
          style={{ pointerEvents:'none', userSelect:'none' }}>
          {fmtBubble(payload.amount_m)}
        </text>
      )}
    </g>
  )
}

/* ── Investment Efficiency scatter components ────────────────────── */
function EfficiencyDot({ cx, cy, payload }) {
  if (!payload || cx == null || cy == null) return null
  const fill = REV_COLORS[payload.provider] ?? '#888'
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={fill} fillOpacity={0.85} stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={fill}>
        {payload.provider}
      </text>
      {payload.pts_per_bn != null && (
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize={8} fill="#6b7280">
          {payload.pts_per_bn} pts/€B
        </text>
      )}
    </g>
  )
}

function EfficiencyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const col = REV_COLORS[d.provider] ?? '#888'
  const fmtM = v => v >= 1000 ? `€${(v / 1000).toFixed(1)}B` : `€${v}M`
  return (
    <div style={{ background:'var(--tt-bg)', border:`2px solid ${col}`, borderRadius:8, padding:'10px 14px', fontSize:12, minWidth:200 }}>
      <div style={{ fontWeight:700, color:col, marginBottom:7 }}>{d.provider}</div>
      <div style={{ color:'#374151', marginBottom:3 }}>Readiness: <strong>{d.score_now}</strong> / 100</div>
      <div style={{ color:'#374151', marginBottom:3 }}>Cumulative (disclosed): <strong>{fmtM(d.cumulative_m)}</strong></div>
      <div style={{ color:'#374151', marginBottom:3 }}>Efficiency: <strong>{d.pts_per_bn} pts / €B</strong></div>
      {d.undisclosed_count > 0 && (
        <div style={{ color:'#9ca3af', fontSize:10, marginTop:6, borderTop:'1px solid #f0f0f0', paddingTop:5 }}>
          +{d.undisclosed_count} undisclosed event(s) not counted in total
        </div>
      )}
    </div>
  )
}

/* ── Capital structure bar tooltip ───────────────────────────────── */
function FundingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null && p.value > 0)
  const total = items.reduce((s, p) => s + p.value, 0)
  const fmtM = v => v >= 1000 ? `€${(v / 1000).toFixed(1)}B` : `€${v}M`
  return (
    <div style={{ background:'var(--tt-bg)', border:'1px solid var(--tt-border)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ fontWeight:700, color:'var(--tt-head)', marginBottom:7 }}>{label}</div>
      {items.map(p => (
        <div key={p.dataKey} style={{ display:'flex', justifyContent:'space-between', gap:20, marginBottom:3 }}>
          <span style={{ color: FUNDING_COLORS[p.dataKey] ?? '#555', fontWeight:600 }}>{p.dataKey}</span>
          <span style={{ color:'#374151' }}>{fmtM(p.value)}</span>
        </div>
      ))}
      <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:5, marginTop:5, display:'flex', justifyContent:'space-between', fontWeight:700, color:'#374151' }}>
        <span>Total</span><span>{fmtM(total)}</span>
      </div>
    </div>
  )
}

export default function FinancialConsideration() {
  const [data, setData]             = useState(null)
  const [error, setError]           = useState(null)
  const [legendCollapsed, setLegendCollapsed] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/api/financial')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
  }, [])

  if (error) return (
    <div className="content">
      <div className="ss-header"><div className="ss-title">Financial Consideration</div></div>
      <p style={{ color:'#ef4444', marginTop:16 }}>Failed to load: {error}</p>
    </div>
  )

  if (!data) return (
    <div className="content">
      <div className="ss-header">
        <div>
          <div className="ss-title">Financial Consideration</div>
          <div className="ss-sub">Loading…</div>
        </div>
      </div>
    </div>
  )

  const { providers, chart_data, revenue_chart_data, revenue_summary, milestones } = data

  /* lookup table for revenue chart inline labels */
  const revByYear = Object.fromEntries(revenue_chart_data.map(r => [r.year, r]))

  /* milestone bubble data — attach y-position and size */
  const milestonePoints = milestones.map(m => ({
    ...m,
    y: PROVIDER_Y[m.provider] ?? 0,
  }))
  const milestoneByProvider = PROVIDER_ROW_LABELS.reduce((acc, k) => {
    acc[k] = milestonePoints.filter(m => m.provider === k)
    return acc
  }, {})

  /* investment efficiency — cumulative disclosed capital vs readiness */
  const efficiencyData = providers.map(p => {
    const ms = milestones.filter(m => m.provider === p.key && m.amount_m != null && m.amount_m > 0)
    const cumulative_m = ms.reduce((s, m) => s + m.amount_m, 0)
    const undisclosed_count = milestones.filter(m => m.provider === p.key && m.amount_m == null).length
    const pts_per_bn = cumulative_m > 0 ? +(p.score_now / cumulative_m * 1000).toFixed(1) : null
    return { provider: p.key, cumulative_m, score_now: p.score_now, pts_per_bn, undisclosed_count }
  })

  /* capital structure — group milestones by consolidated funding type */
  const fundingMixData = providers.map(p => {
    const row = { provider: p.key, score_now: p.score_now }
    FUNDING_GROUPS.forEach(g => { row[g] = 0 })
    milestones
      .filter(m => m.provider === p.key && m.amount_m != null && m.amount_m > 0)
      .forEach(m => {
        const grp = TYPE_TO_GROUP[m.type]
        if (grp) row[grp] += m.amount_m
      })
    FUNDING_GROUPS.forEach(g => { if (row[g] === 0) row[g] = null })
    return row
  })


  return (
    <div className="content">

      {/* ── Header ── */}
      <div className="ss-header">
        <div>
          <div className="ss-title">Financial Consideration</div>
          <div className="ss-sub">EU Cloud Provider Readiness Gap — Historical Growth &amp; Projected Parity with AWS</div>
        </div>
      </div>

      {/* ══ ROW 1 — two charts side by side ═════════════════════════════════ */}
      <div className="fc-row">

        {/* ── Left column: Gap Closure ── */}
        <div className="fc-col">
          <div className="fc-chart-wrap">
            <div className="fc-chart-title">Readiness Gap Closure — EU Providers vs AWS (2006 – 2050)</div>
            <div style={{ fontSize:'0.7rem', color:'#6b7280', padding:'2px 6px 8px', fontStyle:'italic' }}>
              velocity (pts/yr) = score ÷ (2026 − launch year) &nbsp;·&nbsp; 
              <br /> parity ≈ 2026 + (100 − score) ÷ velocity
            </div>

            {/* Velocity strip — compact, inside the white card */}
            <div className="fc-strip fc-strip--compact">
              {providers.map(p => (
                <div key={p.key} className="fc-strip-item" style={{ borderLeft:`3px solid ${COLORS[p.key]}` }}>
                  <span className="fc-strip-name">{p.key}</span>
                  <span className="fc-strip-score" style={{ color:COLORS[p.key] }}>{p.score_now}</span>
                  <span className="fc-strip-meta">{p.velocity.toFixed(1)} pts/yr · ~{p.parity_year ? Math.ceil(p.parity_year) : '—'}</span>
                </div>
              ))}
            </div>

            <div className="fc-legend">
              {providers.map(p => (
                <div key={p.key} className="fc-legend-item">
                  <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke={COLORS[p.key]} strokeWidth="2.5"/></svg>
                  <span style={{ color: COLORS[p.key] }}>{p.key}</span>
                </div>
              ))}
              <div className="fc-legend-item">
                <svg width="22" height="10">
                  <line x1="0" y1="5" x2="22" y2="5" stroke="#374151" strokeWidth="2" strokeDasharray="5 3"/>
                </svg>
                <span style={{ color:'#374151' }}>AWS (target = 100)</span>
              </div>
              <div className="fc-legend-item fc-legend-zone">
                <span className="fc-legend-box" />
                <span style={{ color:'#64748b' }}>Projected zone</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart_data} margin={{ top:14, right:16, bottom:8, left:0 }}>
                <ReferenceArea x1={2026} x2={2050} fill="#e0e7ff" fillOpacity={0.35} />
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" type="number" domain={[2006, 2050]}
                  ticks={[2006,2010,2015,2020,2026,2030,2035,2040,2045,2050]}
                  tick={{ fontSize:10 }} />
                <YAxis domain={[0,100]} tickCount={6} tick={{ fontSize:10 }}
                  label={{ value:'Readiness score', angle:-90, position:'insideLeft', offset:14, fontSize:10 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={100} stroke="#374151" strokeWidth={1.5} strokeDasharray="5 3" />
                <ReferenceLine x={2026} stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3"
                  label={{ value:'Now', position:'insideTopLeft', fontSize:9, fill:'#64748b' }} />
                <ReferenceLine x={2030} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3"
                  label={{ value:'EC Digital Decade', position:'insideTopLeft', fontSize:9, fill:'#b45309' }} />
                {providers.map(p => (
                  <Line key={p.key+'_h'} dataKey={p.key} name={p.key}
                    stroke={COLORS[p.key]} strokeWidth={2.5}
                    dot={false} connectNulls={false} legendType="none" />
                ))}
                {providers.map(p => (
                  <Line key={p.key+'_p'} dataKey={p.key+'_proj'} name={p.key+'_proj'}
                    stroke={COLORS[p.key]} strokeWidth={2} strokeDasharray="5 4"
                    dot={false} connectNulls={false} legendType="none" />
                ))}
                {providers.map(p => (
                  <ReferenceDot key={p.key+'_dot'} x={2026} y={p.score_now}
                    r={4} fill={COLORS[p.key]} stroke="#fff" strokeWidth={2} />
                ))}
                {/* Names written in the running lines */}
                {providers.map(p => {
                  const launch   = p.launch_year
                  const midYr    = Math.round(launch + (2026 - launch) * 0.4)
                  const midScore = parseFloat((p.velocity * (midYr - launch)).toFixed(1))
                  return (
                    <ReferenceDot key={p.key+'_lbl'} x={midYr} y={midScore}
                      r={0} fill="none" stroke="none"
                      label={<InlineLabel value={`${p.key} `} fill={COLORS[p.key]} />} />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          <div className="fc-analysis-block">
            <div className="fc-analysis-heading">Considering the launch date</div>
            <p>
              Each line starts at zero at the provider's cloud launch year and climbs toward
              AWS at 100. The shaded zone is projection — each provider continues at the same
              annual rate observed historically. <strong>T-Cloud Public</strong> and <strong>STACKIT</strong> are
              on track to close the gap around 2030. The other three converge between 2040 and 2048.
            </p>
          </div>
          </div>

        </div>

        {/* ── Right column: Revenue Scale ── */}
        <div className="fc-col">
          <div className="fc-chart-wrap">
            <div className="fc-chart-title">Annual Revenue (EUR) — EU Providers vs AWS, 2019–2024</div>

            {/* Revenue strip — compact, inside the white card */}
            <div className="fc-strip fc-strip--compact">
              {revenue_summary.map(p => (
                <div key={p.key} className="fc-strip-item" style={{ borderLeft:`3px solid ${REV_COLORS[p.key]}` }}>
                  <span className="fc-strip-name">{p.key}</span>
                  <span className="fc-strip-score" style={{ color:REV_COLORS[p.key] }}>{fmtRev(p.revenue_latest_m)}</span>
                  <span className="fc-strip-meta">{p.cagr_5yr != null ? `${p.cagr_5yr}% CAGR` : 'est.'}</span>
                </div>
              ))}
            </div>

            <div className="fc-legend">
              {revenue_summary.map(p => (
                <div key={p.key} className="fc-legend-item">
                  <svg width="22" height="10">
                    <line x1="0" y1="5" x2="22" y2="5"
                      stroke={REV_COLORS[p.key]} strokeWidth="2.5"
                      strokeDasharray={p.key === 'AWS' ? '6 3' : undefined}/>
                  </svg>
                  <span style={{ color: REV_COLORS[p.key] }}>{p.key}</span>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenue_chart_data} margin={{ top:14, right:16, bottom:8, left:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" type="number" domain={[2019, 2024]}
                  ticks={[2019,2020,2021,2022,2023,2024]}
                  tick={{ fontSize:10 }} />
                <YAxis scale="log" domain={[50, 200000]}
                  ticks={[100, 500, 1000, 5000, 10000, 50000, 100000]}
                  tickFormatter={fmtTick}
                  tick={{ fontSize:9 }}
                  label={{ value:'Revenue (EUR m, log)', angle:-90, position:'insideLeft', offset:14, fontSize:10 }} />
                <Tooltip content={<RevTooltip />} />
                {revenue_summary.map(p => (
                  <Line key={p.key} dataKey={p.key} name={p.key}
                    stroke={REV_COLORS[p.key]}
                    strokeWidth={p.key === 'AWS' ? 2 : 2.5}
                    strokeDasharray={p.key === 'AWS' ? '6 3' : undefined}
                    dot={false} connectNulls={false} legendType="none" />
                ))}
                {/* Names written in the running lines */}
                {revenue_summary.map(p => {
                  const startYr = p.key === 'STACKIT' ? 2022 : 2019
                  const midYr   = p.key === 'STACKIT' ? 2023 : 2021
                  const midVal  = revByYear[midYr]?.[p.key]
                  if (midVal == null) return null
                  return (
                    <ReferenceDot key={p.key+'_lbl'} x={midYr} y={midVal}
                      r={0} fill="none" stroke="none"
                      label={<InlineLabel value={p.key} fill={REV_COLORS[p.key]} />} />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          <div className="fc-analysis-block">
            <div className="fc-analysis-heading">The financial gap</div>
            <p>
              AWS cloud revenue in 2024 reached <strong>~€99B</strong> — roughly <strong>74×</strong> larger
              than IONOS (€1.3B), the highest-revenue EU provider shown. The log scale is the only way
              to show all providers on the same axis. Despite strong growth in STACKIT and Scaleway,
              closing this financial gap is a multi-decade undertaking.
            </p>
          </div>
          </div>

        </div>

      </div>

      {/* ══ ROW 2 — Investment & Funding Timeline ════════════════════════════ */}
      <div style={{ marginTop:28 }}>
        <div className="fc-chart-wrap">
          <div className="fc-chart-title">Investment &amp; Funding Milestones — EU Providers &amp; AWS (2006 – 2026)</div>
          <div style={{ fontSize:'0.72rem', color:'#6b7280', padding:'2px 6px 8px', lineHeight:1.6 }}>
            Bubble size proportional to capital committed. Dashed outline = amount undisclosed. Hover any bubble for the full story.
          </div>

          {/* Legend */}
          <div className="fc-legend" style={{ paddingBottom:10 }}>
            {PROVIDER_ROW_LABELS.map(k => (
              <div key={k} className="fc-legend-item">
                <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:REV_COLORS[k], flexShrink:0 }} />
                <span style={{ color:REV_COLORS[k] }}>{k}</span>
              </div>
            ))}
            <div className="fc-legend-item">
              <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', border:'1.5px dashed #9ca3af', flexShrink:0 }} />
              <span style={{ color:'#9ca3af' }}>Undisclosed</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={420}>
            <ScatterChart margin={{ top:50, right:30, bottom:10, left:110 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="year" type="number" domain={[2005, 2027]}
                ticks={[2006,2008,2010,2012,2014,2016,2018,2020,2022,2024,2026]}
                tick={{ fontSize:10 }} name="Year" />
              <YAxis dataKey="y" type="number" domain={[0.5, 6.5]}
                ticks={[1,2,3,4,5,6]}
                tickFormatter={v => PROVIDER_ROW_LABELS[v - 1] ?? ''}
                tick={{ fontSize:10, fontWeight:600 }}
                width={108} axisLine={false} tickLine={false} />
              <Tooltip content={<MilestoneTooltip />} cursor={false} />
              {PROVIDER_ROW_LABELS.map(k => (
                <Scatter key={k} data={milestoneByProvider[k] ?? []}
                  shape={<MilestoneDot />} legendType="none" />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        <div className="fc-analysis-block" style={{ marginTop:12 }}>
          <div className="fc-analysis-heading">Reading the timeline</div>
          <p>
            Each bubble marks a capital event — IPO, parent commitment, government grant, or annual capex.
            AWS operates at a scale no EU provider approaches: its FY2024 group capex (~€76B) exceeds
            the total cumulative investment of all five EU providers combined.
            STACKIT's €11B Lübbenau data centre commitment is the single largest EU sovereign cloud
            infrastructure pledge to date, yet still represents less than one quarter of AWS's annual capex.
          </p>
        </div>
        </div>

      </div>

      {/* ══ ROW 3+4 — Efficiency & Capital Structure (two columns) ════════ */}
      <div className="fc-row" style={{ marginTop:28 }}>

        {/* ── Left: Investment Efficiency Scatter ── */}
        <div className="fc-col">
          <div className="fc-chart-wrap">
            <div className="fc-thesis-q">
              Do EU providers extract meaningful sovereign readiness from each euro invested — or does scale ultimately decide?
            <br /> <i>(for every €1 invested, how is that closing the gap from AWS?)</i>
            </div>
            <div className="fc-chart-title">Investment Efficiency — Cumulative Capital vs Technical Readiness</div>
            <div style={{ fontSize:'0.7rem', color:'#6b7280', padding:'2px 6px 4px' }}>
              X = total disclosed capital committed (log scale) · Y = current readiness score (AWS = 100) · Label = pts/€B
            </div>
            <div style={{ fontSize:'0.7rem', color:'#6b7280', padding:'0 6px 10px', fontStyle:'italic' }}>
              pts/€B = readiness score ÷ total disclosed capital (€B)
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top:30, right:60, bottom:52, left:50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="cumulative_m" type="number" name="Cumulative Investment"
                  scale="log" domain={[500, 20000]}
                  ticks={[500, 1000, 2000, 5000, 10000]}
                  tickFormatter={v => v >= 1000 ? `€${(v / 1000).toFixed(0)}B` : `€${v}M`}
                  tick={{ fontSize:9 }}
                  label={{ value:'Cumulative Disclosed Capital (log scale)', position:'insideBottom', offset:-32, fontSize:10, fill:'#6b7280' }} />
                <YAxis dataKey="score_now" type="number" domain={[0, 100]}
                  tick={{ fontSize:9 }}
                  label={{ value:'Readiness Score', angle:-90, position:'insideLeft', offset:14, fontSize:10, fill:'#6b7280' }} />
                <Tooltip content={<EfficiencyTooltip />} />
                <Scatter data={efficiencyData} shape={<EfficiencyDot />} legendType="none" />
              </ScatterChart>
            </ResponsiveContainer>

            <div className="fc-analysis-block" style={{ marginTop:8 }}>
              <div className="fc-analysis-heading">Reading efficiency</div>
              <p>
                Providers top-left — high readiness, low cumulative capital — are the most efficient.
                <strong> T-Cloud Public</strong> and <strong>IONOS</strong> both sit there: Deutsche Telekom
                runs targeted data-centre capex; IONOS has converted IPO and PE capital directly into cloud infrastructure.
                <strong> STACKIT</strong> appears capital-heavy because the <strong>€11B Lübbenau commitment</strong> is counted
                in full even though Phase 1 completes in 2027 — the readiness gain will materialise post-2027.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Capital Structure Stacked Bar ── */}
        <div className="fc-col">
          <div className="fc-chart-wrap">
            <div className="fc-thesis-q">
              How does capital structure — market-funded independence vs parent-subsidised scale — shape each provider's path to sovereignty?
              <br /> <i>(where the money to build each provider's cloud came from?)</i>
            </div>
            <div className="fc-chart-title">Capital Structure by Source — EU Providers (Disclosed Only)</div>
            <div style={{ fontSize:'0.7rem', color:'#6b7280', padding:'2px 6px 6px' }}>
              Stacked by funding category. Undisclosed events excluded. STACKIT dominated by the €11B Lübbenau parent commitment.
            </div>

            <div className="fc-legend" style={{ paddingBottom:8 }}>
              {FUNDING_GROUPS.map(g => (
                <div key={g} className="fc-legend-item">
                  <span style={{ display:'inline-block', width:12, height:12, borderRadius:2, background:FUNDING_COLORS[g], flexShrink:0 }} />
                  <span style={{ color:'#374151' }}>{g}</span>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={fundingMixData} margin={{ top:14, right:16, bottom:8, left:50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                <XAxis dataKey="provider" tick={{ fontSize:10, fontWeight:600 }} />
                <YAxis
                  tickFormatter={v => v >= 1000 ? `€${(v / 1000).toFixed(0)}B` : `€${v}M`}
                  tick={{ fontSize:9 }}
                  label={{ value:'Capital (€M)', angle:-90, position:'insideLeft', offset:14, fontSize:10, fill:'#6b7280' }} />
                <Tooltip content={<FundingTooltip />} />
                {FUNDING_GROUPS.map(g => (
                  <Bar key={g} dataKey={g} stackId="mix" fill={FUNDING_COLORS[g]} name={g} />
                ))}
              </BarChart>
            </ResponsiveContainer>

            <div className="fc-analysis-block" style={{ marginTop:12 }}>
              <div className="fc-analysis-heading">Capital independence as a sovereignty signal</div>
              <p>
                <strong>OVHcloud</strong> and <strong>IONOS</strong> are the most market-funded EU providers —
                their IPOs and PE capital mean growth is validated by external investors rather than subsidised
                by a parent. <strong>Scaleway</strong> and <strong>STACKIT</strong> are overwhelmingly
                parent-funded: Iliad's €3B and Schwarz's €11B Lübbenau come from Europe's largest retail groups.
                <strong> EU Programmes</strong> remain small — public funding has catalysed, not carried, EU sovereign cloud.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ══ Methodology legend ═════════════════════════════════════════════ */}
      <div className="legend" style={{ marginTop:28 }}>
        <div
          className={`legend-title${legendCollapsed ? ' collapsed' : ''}`}
          onClick={() => setLegendCollapsed(c => !c)}
        >
          How these charts are computed
        </div>
        <div className={`legend-body${legendCollapsed ? ' hidden' : ''}`}>
          <div className="legend-grid">

            <div>
              <div className="legend-heading">Gap closure velocity &amp; parity year</div>
              <p className="ra-legend-text">
                Each EU provider's <strong>readiness score</strong> (0–100, where AWS = 100) is taken at the analysis point (2026).
                <strong> Velocity</strong> is the average annual improvement since the provider's cloud launch:
              </p>
              <p className="ra-legend-text" style={{ fontFamily:'monospace', background:'#f3f4f6', padding:'4px 8px', borderRadius:4, margin:'4px 0' }}>
                velocity (pts/yr) = score ÷ (2026 − launch year)
              </p>
              <p className="ra-legend-text">
                <strong>Parity year</strong> is when the provider would reach 100 (AWS baseline) if it sustains that pace:
              </p>
              <p className="ra-legend-text" style={{ fontFamily:'monospace', background:'#f3f4f6', padding:'4px 8px', borderRadius:4, margin:'4px 0' }}>
                parity ≈ 2026 + (100 − score) ÷ velocity
              </p>
              <p className="ra-legend-text">
                Projections are linear extrapolations and do not account for capital step-changes, regulatory shifts, or diminishing returns as scores approach 100.
              </p>
            </div>

            <div>
              <div className="legend-heading">Investment efficiency (pts/€B)</div>
              <p className="ra-legend-text">
                Efficiency measures how much readiness each provider has extracted from its disclosed capital base:
              </p>
              <p className="ra-legend-text" style={{ fontFamily:'monospace', background:'#f3f4f6', padding:'4px 8px', borderRadius:4, margin:'4px 0' }}>
                pts/€B = score ÷ cumulative disclosed capital (€B)
              </p>
              <p className="ra-legend-text">
                Only capital events with a publicly confirmed amount are counted. Undisclosed rounds are shown as dashed bubbles in the milestone timeline but excluded from the cumulative total.
                A <strong>higher pts/€B</strong> means the provider achieved a stronger technical position relative to what it has disclosed investing — not that it is operationally cheaper overall. Providers with large committed-but-unspent capital (e.g. STACKIT's €11B Lübbenau pledge) will appear less efficient until the resulting readiness gains materialise.
              </p>
              <div className="legend-heading" style={{ marginTop:12 }}>Capital structure categories</div>
              <p className="ra-legend-text">
                <strong>Capex</strong> — data-centre and infrastructure capital expenditure.{' '}
                <strong>Debt</strong> — bond issuances and credit facilities.{' '}
                <strong>Market Capital</strong> — IPO proceeds and private-equity rounds.{' '}
                <strong>Parent</strong> — funding committed by the owning group.{' '}
                <strong>EU Programmes</strong> — IPCEI grants, EIB loans, and public tender contracts.{' '}
                <strong>Other</strong> — acquisitions and infrastructure contracts not classified above.
              </p>
            </div>

          </div>
          <div className="legend-source">
            Readiness scores from CloudSov technical benchmarking (Chapter 6). Revenue and capital data from provider annual reports, press releases, and EU public procurement records (2006–2026). AWS figures from Amazon annual reports (2019–2024).
          </div>
        </div>
      </div>

    </div>
  )
}
