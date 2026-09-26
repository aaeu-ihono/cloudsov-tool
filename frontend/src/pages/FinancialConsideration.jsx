import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, ReferenceArea,
  ScatterChart, Scatter, ZAxis,
  BarChart, Bar, Cell, LabelList, ComposedChart,
  ResponsiveContainer,
} from 'recharts'
import { API_BASE_URL } from '../config'
import LoadingSpinner from '../components/LoadingSpinner'

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

/* ── Global revenue chart (parent group + cloud arm) ───────────────────── */

const GLOBAL_REV_ORDER = ['AWS', 'OVHcloud', 'IONOS', 'T-Cloud Public', 'Scaleway', 'STACKIT']

/* The part of the parent that is not the cloud arm. Deliberately colourless —
   the cloud arm is what the chart is about. */
const PARENT_FILL = '#d8dde5'

/* Why a cloud figure is absent, in the words the JSON files use. */
const ABSENCE_TEXT = {
  undisclosed:      'cloud arm revenue not published',
  not_located:      'not found in an accessible company source',
  not_applicable:   'cloud arm did not exist as a reporting unit',
  not_yet_reported: 'period not closed at the compile date',
}

/* One <defs> block per provider: a diagonal hatch in that provider's colour,
   used on years where the parent is known but the cloud split is not. */
function HatchDefs() {
  return (
    <svg width="0" height="0" style={{ position:'absolute' }} aria-hidden="true">
      <defs>
        {GLOBAL_REV_ORDER.map(k => (
          <pattern key={k} id={`hatch-${k.replace(/\W/g, '')}`}
            width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#f1f3f7" />
            <line x1="0" y1="0" x2="0" y2="6" stroke={REV_COLORS[k]} strokeWidth="2" strokeOpacity="0.45" />
          </pattern>
        ))}
      </defs>
    </svg>
  )
}

/* Names the series at the end of its own line, so identity never rests on
   matching a colour back to a legend box. */
function EndLabel({ x, y, value, index, name, lastIdx, suffix, muted }) {
  if (index !== lastIdx || value == null) return null
  return (
    <text x={x + 7} y={y + 3.5} fontSize={muted ? '8.5' : '9.5'}
      fontWeight={muted ? '500' : '700'} fill={REV_COLORS[name]}
      opacity={muted ? 0.75 : 1}>
      {suffix ? `${suffix} ` : ''}{name} {value}%
    </text>
  )
}

/* ── How European the revenue is ───────────────────────────────────────── */

const EU_KIND_TEXT = {
  'exact':          'a region table, every year',
  'derived from the published country breakdown':
                    'revenue country by country; all of them European',
  'floor only':     'only domestic against foreign, so this is a minimum',
  'not disclosed':  'no geographic breakdown of any kind',
}

function EuropeLabel({ x, y, value, index, name, lastIdx, floor }) {
  if (value == null) return null
  if (floor) {
    /* Every mark is labelled, because there are only two of them and each
       one is a separate statement rather than a point on a trend. */
    return (
      <text x={x + 9} y={y + 3.5} fontSize="8.5" fontWeight="600" fill={REV_COLORS[name]}>
        ≥{value}%
      </text>
    )
  }
  if (index !== lastIdx) return null
  return (
    <text x={x + 8} y={y + 3.5} fontSize="9.5" fontWeight="700" fill={REV_COLORS[name]}>
      {name} {value}%
    </text>
  )
}

function EuropeTooltip({ active, payload, label, meta }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null)
  if (!items.length) return null
  return (
    <div style={{ background:'var(--tt-bg)', border:'1px solid var(--tt-border)', borderRadius:6, padding:'8px 12px', fontSize:12, maxWidth:280 }}>
      <div style={{ fontWeight:600, marginBottom:4, color:'var(--tt-head)' }}>{label}</div>
      {items.map(p => {
        const k  = p.dataKey.replace('__eu', '')
        const ep = meta?.find(m => m.key === k)
        const countries = p.payload?.[`${k}__eu_countries`]
        return (
          <div key={p.dataKey} style={{ marginBottom:3 }}>
            <span style={{ color:REV_COLORS[k], fontWeight:600 }}>
              {k}: {ep?.kind === 'floor only' ? 'at least ' : ''}{p.value}%
            </span>
            {countries && <div style={{ color:'#9ca3af', fontSize:11 }}>{countries}</div>}
            {ep?.kind === 'floor only' && (
              <div style={{ color:'#9ca3af', fontSize:11, fontStyle:'italic' }}>
                Germany alone; the European share is higher but is not published
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* Why a provider carries no line at all in the combined share chart. */
const NO_SHARE_TEXT = {
  undisclosed:    'cloud arm revenue never published',
  not_located:    'no group figure found for the early years',
  not_applicable: 'not a separate reporting unit',
}

function ShareTooltip({ active, payload, label, cells }) {
  if (!active || !payload?.length) return null
  const items = payload.filter(p => p.value != null)
  if (!items.length) return null
  return (
    <div style={{ background:'var(--tt-bg)', border:'1px solid var(--tt-border)', borderRadius:6, padding:'8px 12px', fontSize:12, maxWidth:270 }}>
      <div style={{ fontWeight:600, marginBottom:4, color:'var(--tt-head)' }}>{label}</div>
      {items.map(p => {
        const k = p.dataKey.replace('__share', '')
        const c = cells?.[k]?.[label]
        return (
          <div key={p.dataKey} style={{ marginBottom:3 }}>
            <span style={{ color:REV_COLORS[k], fontWeight:600 }}>{k}: {p.value}%</span>
            {c?.cloud != null && (
              <span style={{ color:'#9ca3af' }}> · {fmtM(c.cloud)} of {fmtM(c.parent)}</span>
            )}
            {c?.basis_note && (
              <div style={{ color:'#b45309', fontSize:11, fontStyle:'italic' }}>
                basis changed: {c.basis_note}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const fmtM = v =>
  v == null ? '—'
  : v >= 1000 ? `€${(v / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })}B`
  : `€${v.toLocaleString('en-GB', { maximumFractionDigits: 1 })}M`

/* The known figure is either a box the cloud arm sits inside, which caps it,
   or a piece of the cloud arm, which props it up. Said in plain words, not as
   "upper bound" and "lower bound". */
const BOUND_TEXT = {
  upper: {
    short:  'the cloud arm is part of this, so it is smaller',
    inline: 'smaller than',
    long:   'The cloud arm is one of several things inside this figure, so it cannot be larger than this.',
    mult:   n => `at least ${n}× bigger`,
    multWhy:'the real gap can only be wider, never narrower',
  },
  lower: {
    short:  'this is only one part of the cloud arm, so the whole is bigger',
    inline: 'bigger than',
    long:   'This figure covers only part of the cloud arm, so the whole must be at least this much.',
    mult:   n => `no more than ${n}× bigger`,
    multWhy:'the real gap can only be narrower, never wider',
  },
}
const PERIMETER_TEXT = 'a differently drawn business, so it neither caps nor props up the cloud arm'

function GlobalRevTooltip({ active, payload, label, cells, pkey, proxy }) {
  if (!active || !payload?.length) return null
  const c = cells?.[pkey]?.[label]
  if (!c) return null
  const orig = c.original_currency === 'USD' && c.original_parent != null
  return (
    <div style={{ background:'var(--tt-bg)', border:'1px solid var(--tt-border)', borderRadius:6, padding:'8px 12px', fontSize:12, maxWidth:280 }}>
      <div style={{ fontWeight:600, marginBottom:4, color:'var(--tt-head)' }}>{pkey} · {label}</div>
      <div style={{ color:'#4b5563', marginBottom:2 }}>
        Parent group: {fmtM(c.parent)}
        {orig && <span style={{ color:'#9ca3af' }}> (${c.original_parent.toLocaleString('en-GB')}M)</span>}
      </div>
      {c.cloud != null ? (
        <div style={{ color:REV_COLORS[pkey], fontWeight:600 }}>
          Cloud arm: {fmtM(c.cloud)}
          {c.parent ? <span style={{ color:'#9ca3af', fontWeight:400 }}> · {(c.cloud / c.parent * 100).toFixed(1)}% of group</span> : null}
        </div>
      ) : (
        <div style={{ color:'#9ca3af', fontStyle:'italic' }}>
          Cloud arm: {ABSENCE_TEXT[c.cloud_status] ?? c.cloud_status}
        </div>
      )}
      {c.proxy != null && proxy && (
        <div style={{ marginTop:4, paddingTop:4, borderTop:'1px solid #eef0f4', color:'#6b7280' }}>
          {proxy.short_label}: {fmtM(c.proxy)}
          {c.proxy_share_pct != null && <span style={{ color:'#9ca3af' }}> · {c.proxy_share_pct}% of group</span>}
          <div style={{ fontSize:11, fontStyle:'italic', color:'#9ca3af' }}>
            {BOUND_TEXT[proxy.bound]?.long ?? PERIMETER_TEXT}
            {c.proxy_basis ? ` · basis ${c.proxy_basis}` : ''}
          </div>
        </div>
      )}
      {c.parent == null && (
        <div style={{ color:'#9ca3af', fontStyle:'italic', marginTop:2 }}>
          Parent: {ABSENCE_TEXT[c.parent_status] ?? c.parent_status}
        </div>
      )}
    </div>
  )
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
  const [rev, setRev]               = useState(null)
  const [error, setError]           = useState(null)
  const [legendCollapsed, setLegendCollapsed] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/financial`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setData)
      .catch(e => setError(String(e)))
  }, [])

  /* Kept as its own request so a failure here cannot blank the other charts. */
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/revenue`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setRev)
      .catch(() => setRev({ providers: [], rows: [], cells: {} }))
  }, [])

  if (error) return (
    <div className="content">
      <div className="ss-header"><div className="ss-title">Financial Consideration</div></div>
      <p style={{ color:'#ef4444', marginTop:16 }}>
        Failed to load: {error}. The backend may still be waking up — try refreshing in a minute.
      </p>
    </div>
  )

  if (!data) return (
    <div className="content">
      <div className="ss-header">
        <div className="ss-title">Financial Consideration</div>
      </div>
      <LoadingSpinner message="Loading financial data…" />
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

      {/* ══ ROW 5 — Global revenue: parent group and cloud arm ═══════════════ */}
      {rev && rev.rows?.length > 0 && (
        <div style={{ marginTop:28 }}>
          <HatchDefs />
          <div className="fc-chart-wrap">
            <div className="fc-chart-title">Global Revenue — Parent Group and Cloud Arm, 2015–2026</div>
            <div style={{ fontSize:'0.72rem', color:'#6b7280', padding:'2px 6px 10px', lineHeight:1.6 }}>
              Each bar is the parent group's total revenue for that year. The solid coloured part is the
              cloud arm inside it; the grey part is everything else the group does. A hatched bar means the
              group's revenue is published but the cloud arm's is not, so the split cannot be drawn.
              A dashed line inside a hatched bar is the closest figure the provider does publish —
              usually a larger business the cloud arm sits inside. It is not the cloud arm; it only
              says how big the cloud arm could be. Each panel has its own scale — Amazon and OVHcloud differ by
              three orders of magnitude and cannot share an axis. Figures are EUR millions; Amazon is
              converted year by year at the ECB annual average reference rate, from{' '}
              {rev.fx?.eur_per_usd?.['2015']?.toFixed(3)} in 2015 to{' '}
              {rev.fx?.eur_per_usd?.['2025']?.toFixed(3)} in 2025.
            </div>

            <div className="fc-legend" style={{ paddingBottom:12 }}>
              <div className="fc-legend-item">
                <span style={{ display:'inline-block', width:12, height:12, background:PARENT_FILL, flexShrink:0 }} />
                <span style={{ color:'#6b7280' }}>Parent group, excluding the cloud arm</span>
              </div>
              <div className="fc-legend-item">
                <span style={{ display:'inline-block', width:12, height:12, background:'#374151', flexShrink:0 }} />
                <span style={{ color:'#374151' }}>Cloud arm (published)</span>
              </div>
              <div className="fc-legend-item">
                <span style={{ display:'inline-block', width:12, height:12, flexShrink:0,
                  background:'repeating-linear-gradient(45deg, #9ca3af 0 2px, #f1f3f7 2px 6px)' }} />
                <span style={{ color:'#9ca3af' }}>Cloud arm undisclosed — split cannot be drawn</span>
              </div>
              <div className="fc-legend-item">
                <span style={{ color:'#9ca3af' }}>No bar = no published group figure for that year</span>
              </div>
            </div>

            <div className="fc-revsplit">
            <div className="fc-revsplit-left">
            <div className="fc-smallmult">
              {GLOBAL_REV_ORDER.map(pkey => {
                const meta  = rev.providers.find(p => p.key === pkey)
                const rows  = rev.rows.map(r => ({
                  year:      r.year,
                  parent_ex: r[`${pkey}__parent_ex`],
                  cloud:     r[`${pkey}__cloud`],
                  proxy:     r[`${pkey}__proxy`],
                  status:    r[`${pkey}__cloud_status`],
                }))
                /* A year with no bar is either still open or was never found.
                   The two are different things and are labelled differently. */
                const gaps = rows
                  .filter(r => r.parent_ex == null)
                  .map(r => ({ year: r.year, why: rev.cells?.[pkey]?.[r.year]?.parent_status }))
                const missing = gaps.filter(g => g.why !== 'not_yet_reported').map(g => g.year)
                const pending = gaps.filter(g => g.why === 'not_yet_reported').map(g => g.year)
                const hasCloudEver = rows.some(r => r.cloud != null)
                return (
                  <div key={pkey} className="fc-sm-panel">
                    <div className="fc-sm-head">
                      <span className="fc-sm-name" style={{ color:REV_COLORS[pkey] }}>{pkey}</span>
                      <span className="fc-sm-parent">{meta?.parent_name}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={190}>
                      <ComposedChart data={rows} margin={{ top:6, right:6, bottom:0, left:-6 }} barCategoryGap="18%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize:9 }} interval={1} tickLine={false} />
                        <YAxis tick={{ fontSize:9 }} width={46} tickLine={false} axisLine={false}
                          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}B` : `${v}M`} />
                        <Tooltip cursor={{ fill:'rgba(0,0,0,0.03)' }}
                          content={<GlobalRevTooltip cells={rev.cells} pkey={pkey} proxy={meta?.proxy} />} />
                        <Bar dataKey="parent_ex" stackId="a" isAnimationActive={false}>
                          {rows.map(r => (
                            <Cell key={r.year}
                              fill={r.cloud == null
                                ? `url(#hatch-${pkey.replace(/\W/g, '')})`
                                : PARENT_FILL} />
                          ))}
                        </Bar>
                        <Bar dataKey="cloud" stackId="a" fill={REV_COLORS[pkey]} isAnimationActive={false} />
                        {/* The closest figure this provider does publish. Not
                            the cloud arm: usually a larger business the cloud
                            arm sits inside, occasionally only one part of it. */}
                        {meta?.proxy && (
                          <Line type="stepAfter" dataKey="proxy" stroke={REV_COLORS[pkey]}
                            strokeWidth={1.6} strokeDasharray="4 3" dot={false}
                            connectNulls={false} isAnimationActive={false} legendType="none" />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="fc-sm-note">
                      {meta?.proxy && (
                        <span style={{ color:REV_COLORS[pkey] }}>
                          ┄ {meta.proxy.short_label}
                          {` — ${BOUND_TEXT[meta.proxy.bound]?.short ?? PERIMETER_TEXT}. `}
                        </span>
                      )}
                      {!hasCloudEver && <span>Cloud arm revenue never published. </span>}
                      {missing.length > 0 && <span>No group figure found: {missing.join(', ')}. </span>}
                      {pending.length > 0 && <span>{pending.join(', ')} not yet reported.</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            </div>

            {/* ── Right: the one measure that puts all six on a single axis ── */}
            <div className="fc-revsplit-right">
              <div className="fc-sm-head" style={{ padding:'0 0 2px' }}>
                <span className="fc-sm-name" style={{ color:'#1a1a2e' }}>
                  Cloud arm as a share of its group
                </span>
                <span className="fc-sm-parent">
                  The six groups span a factor of 608 in size, so a euro axis cannot hold them. A share can.
                </span>
              </div>

              <ResponsiveContainer width="100%" height={430}>
                <LineChart data={rev.rows} margin={{ top:14, right:56, bottom:4, left:-8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize:10 }} interval={1} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]}
                    tick={{ fontSize:10 }} width={40} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip content={<ShareTooltip cells={rev.cells} />} />
                  {GLOBAL_REV_ORDER.map(pkey => {
                    const key = `${pkey}__share`
                    /* Index of the last year that has a value, so the series
                       can be named at the end of its own line instead of in a
                       legend box the reader has to look back and forth to. */
                    let lastIdx = -1
                    rev.rows.forEach((r, i) => { if (r[key] != null) lastIdx = i })
                    if (lastIdx < 0) return null
                    return (
                      <Line key={pkey} type="monotone" dataKey={key}
                        stroke={REV_COLORS[pkey]} strokeWidth={2}
                        dot={{ r: 2.5, strokeWidth: 0, fill: REV_COLORS[pkey] }}
                        activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false}>
                        <LabelList dataKey={key}
                          content={<EndLabel name={pkey} lastIdx={lastIdx} />} />
                      </Line>
                    )
                  })}
                  {/* The closest figure these providers do publish. Dashed,
                      because it says how big the cloud arm could be rather
                      than how big it is. */}
                  {GLOBAL_REV_ORDER.map(pkey => {
                    const meta = rev.providers.find(p => p.key === pkey)
                    if (!meta?.proxy) return null
                    const key = `${pkey}__proxy_share`
                    if (!rev.rows.some(r => r[key] != null)) return null
                    let lastIdx = -1
                    rev.rows.forEach((r, i) => { if (r[key] != null) lastIdx = i })
                    return (
                      <Line key={`${pkey}-proxy`} type="stepAfter" dataKey={key}
                        stroke={REV_COLORS[pkey]} strokeWidth={1.4} strokeDasharray="4 3"
                        dot={false} connectNulls={false} isAnimationActive={false}>
                        <LabelList dataKey={key}
                          content={<EndLabel name={pkey} lastIdx={lastIdx} suffix="⌈" muted />} />
                      </Line>
                    )
                  })}
                  {/* IONOS moved AdTech to discontinued operations at 30 Sep 2025.
                      The 2024 to 2025 step is that reclassification, not a movement. */}
                  <ReferenceDot x={2025} y={21.6} r={5} fill="none"
                    stroke="#b45309" strokeWidth={1.5} strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>

              <div className="fc-share-absent">
                {rev.share_coverage
                  ?.filter(s => s.years.length === 0)
                  .map(s => (
                    <div key={s.key} className="fc-share-absent-row">
                      <span style={{ color:REV_COLORS[s.key], fontWeight:600 }}>{s.key}</span>
                      <span>no line — {NO_SHARE_TEXT[s.reasons[s.reasons.length - 1]] ?? s.reasons.join(', ')}</span>
                    </div>
                  ))}
                <div className="fc-share-absent-row" style={{ color:'#b45309' }}>
                  <span style={{ fontWeight:600 }}>◌ 2025</span>
                  <span>IONOS step is the AdTech reclassification under IFRS 5, not a real change</span>
                </div>
              </div>
            </div>
            </div>

            {/* ── Growth of the cloud arm against its owner, and the size of
                   the gap to AWS in the same year and currency. ── */}
            <div className="fc-growth-table">
              <div className="fc-growth-row fc-growth-head">
                <span>Provider</span>
                <span>Parent group</span>
                <span>Cloud arm</span>
                <span>Outgrowing its owner?</span>
                <span>AWS cloud arm is</span>
              </div>
              {GLOBAL_REV_ORDER.map(pkey => {
                const g = rev.growth?.find(x => x.key === pkey)
                if (!g) return null
                const meta  = rev.providers.find(p => p.key === pkey)
                const inner = g.cloud ?? g.proxy
                const isProxy = !g.cloud && !!g.proxy
                const last  = [...rev.rows].reverse().find(r => r[`${pkey}__vs_aws`] != null)
                const mult  = last?.[`${pkey}__vs_aws`]
                const kind  = last?.[`${pkey}__vs_aws_kind`]
                /* If the known figure caps the cloud arm, dividing by it gives
                   the narrowest the gap could be. If it only props the cloud
                   arm up, dividing by it gives the widest. */
                const bt    = BOUND_TEXT[kind]
                const faster = g.cloud && g.parent && g.cloud.pct > g.parent.pct
                return (
                  <div key={pkey} className="fc-growth-row">
                    <span style={{ color:REV_COLORS[pkey], fontWeight:700 }}>{pkey}</span>
                    <span>{g.parent ? `${g.parent.pct}%/yr` : '—'}
                      <em>{g.parent ? `${g.parent.from}–${g.parent.to}` : ''}</em></span>
                    <span style={{ color: isProxy ? '#9ca3af' : REV_COLORS[pkey] }}>
                      {inner ? `${inner.pct}%/yr` : '—'}
                      <em>{inner
                        ? (isProxy ? `${meta.proxy.short_label}, ${inner.from}–${inner.to}` : `${inner.from}–${inner.to}`)
                        : 'undisclosed'}</em>
                    </span>
                    <span>
                      {!g.cloud ? <span style={{ color:'#9ca3af' }}>cannot be said</span>
                        : pkey === 'OVHcloud' ? <span style={{ color:'#9ca3af' }}>same company</span>
                        : faster ? <strong style={{ color:'#15803d' }}>yes, by {(g.cloud.pct - g.parent.pct).toFixed(1)} pts</strong>
                        : <span>no</span>}
                    </span>
                    <span>
                      {pkey === 'AWS' ? <span style={{ color:'#9ca3af' }}>—</span>
                        : mult ? (
                          <>
                            <strong>{bt ? bt.mult(Math.round(mult)) : `${mult}× bigger`}</strong>
                            <em>{last.year}{bt ? ` · ${bt.multWhy}` : ''}</em>
                          </>
                        ) : <span style={{ color:'#9ca3af' }}>—</span>}
                    </span>
                  </div>
                )
              })}
              <div className="fc-growth-foot">
                Growth is compound annual, over each figure's own available years, which differ.
                Where a provider does not publish its cloud revenue, the nearest figure it does
                publish is used instead and shown in grey. That substitute is sometimes a larger
                business the cloud arm sits inside, in which case the real gap to AWS can only be
                wider than shown; and sometimes only one national company out of several, in which
                case the real gap can only be narrower. Each row says which.
              </div>
            </div>

            <div className="fc-analysis-block" style={{ marginTop:14 }}>
              <div className="fc-analysis-heading">Reading the panels</div>
              <p>
                Only one of the six can be split for the whole window. Amazon reports AWS as one of three
                segments in its 10-K, so the cloud arm is visible in every year and grows from 7.4% of
                group revenue in 2015 to 18.0% in 2025. IONOS splits only from 2020 onwards, when it
                first reported its own revenue after being carved out of United Internet's Business
                Applications segment; before that its bar is hatched because the group figure exists but
                the cloud figure does not. OVHcloud is a single solid bar with no grey part at all: the
                parent and the cloud business are the same company, so there is nothing else to shade.
              </p>
              <p>
                The three hatched panels are the finding, not a gap in the research. Deutsche Telekom has
                never published Open Telekom Cloud revenue, iliad has never published Scaleway revenue,
                and the Schwarz Group has never published STACKIT revenue. In each case a European
                provider's cloud business sits inside a group whose revenue is dominated by something
                else entirely — telecommunications in two cases, grocery retail in the third — and the
                cloud line is small enough that the group is not required to report it separately.
              </p>
              <p>
                Something can still be said about those three, by looking at the smallest business each
                group does report that has the cloud arm inside it. For Deutsche Telekom that is the
                Systems Solutions segment, 3.4% of group revenue in 2025, down from 12.4% in 2015. For
                the Schwarz Group it is Schwarz Digits, 1.2% of group turnover. Neither figure is the
                cloud arm — each is a larger business that contains it — so the cloud arm has to be
                smaller again. Scaleway is the one case that works the other way: its published accounts
                cover only the French company and leave out the Italian and US ones, so the whole of
                Scaleway must be larger than the figure shown, not smaller.
              </p>
              <p>
                Put together, that is a firmer statement than a blank cell. In two of Europe's largest
                groups, the entire division that the sovereign cloud offer belongs to is under one
                thirtieth of the business — and the cloud offer itself is only a part of that division.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ ROW 6 — How European the revenue actually is ════════════════════ */}
      {rev?.europe?.rows?.length > 0 && (
        <div style={{ marginTop:28 }}>
          <div className="fc-chart-wrap">
            <div className="fc-chart-title">Share of Revenue Earned in Europe, 2015–2025</div>
            <div style={{ fontSize:'0.72rem', color:'#6b7280', padding:'2px 6px 10px', lineHeight:1.6 }}>
              This is the <strong>parent group's</strong> European share, not the cloud arm's — geography is
              disclosed at group level only. For OVHcloud the two are the same thing, because the group is
              the cloud business. The question here is not how big these providers are but how European
              they are: whether a European sovereign cloud offer sits inside a European business or inside
              a global one.
            </div>

            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={rev.europe.rows} margin={{ top:16, right:132, bottom:4, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize:10 }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fontSize:10 }}
                  width={46} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<EuropeTooltip meta={rev.europe.providers} />} />
                {rev.europe.providers.map(ep => {
                  if (!ep.years.length) return null
                  const key = `${ep.key}__eu`
                  /* A floor is known for two scattered years only. Joining them
                     would claim the years in between, so it is drawn as marks. */
                  const isFloor = ep.kind === 'floor only'
                  let lastIdx = -1
                  rev.europe.rows.forEach((r, i) => { if (r[key] != null) lastIdx = i })
                  return (
                    <Line key={ep.key} type="linear" dataKey={key}
                      stroke={isFloor ? 'none' : REV_COLORS[ep.key]} strokeWidth={2}
                      dot={{ r: isFloor ? 5 : 3, strokeWidth: 0, fill: REV_COLORS[ep.key] }}
                      activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false}>
                      <LabelList dataKey={key}
                        content={<EuropeLabel name={ep.key} lastIdx={lastIdx} floor={isFloor} />} />
                    </Line>
                  )
                })}
              </LineChart>
            </ResponsiveContainer>

            <div className="fc-growth-table" style={{ marginTop:14 }}>
              <div className="fc-growth-row fc-eu-row fc-growth-head">
                <span>Provider</span><span>Parent group</span>
                <span>What the parent publishes</span><span>Latest</span>
              </div>
              {GLOBAL_REV_ORDER.map(pkey => {
                const ep   = rev.europe.providers.find(p => p.key === pkey)
                const meta = rev.providers.find(p => p.key === pkey)
                if (!ep) return null
                const last = [...rev.europe.rows].reverse().find(r => r[`${pkey}__eu`] != null)
                return (
                  <div key={pkey} className="fc-growth-row fc-eu-row">
                    <span style={{ color:REV_COLORS[pkey], fontWeight:700 }}>{pkey}</span>
                    <span>{meta?.parent_name}</span>
                    <span>{EU_KIND_TEXT[ep.kind] ?? ep.kind}
                      <em>{ep.years.length ? `${ep.years[0]}–${ep.years[ep.years.length - 1]}` : 'nothing to plot'}</em></span>
                    <span>
                      {last
                        ? <><strong>{ep.kind === 'floor only' ? 'at least ' : ''}{last[`${pkey}__eu`]}%</strong>
                            <em>{last.year}{last[`${pkey}__eu_countries`] ? ` · ${last[`${pkey}__eu_countries`]}` : ''}</em></>
                        : <span style={{ color:'#9ca3af' }}>—</span>}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="fc-analysis-block" style={{ marginTop:14 }}>
              <div className="fc-analysis-heading">Why AWS is not on this chart</div>
              <p>
                Amazon reports AWS as a single worldwide segment and publishes no geographic split of it.
                Its revenue-by-country note covers the retail business. An AWS entity for the region does
                exist and does file accounts — Amazon Web Services EMEA SARL in Luxembourg, RCS B186284,
                filing since 2016 — but its territory is EMEA, which takes in Bahrain, Israel, Kuwait,
                Saudi Arabia and the United Arab Emirates alongside the United Kingdom and Switzerland.
                It is also an intra-group reselling entity, so its turnover is a transfer-pricing figure
                rather than customer revenue. Setting it against OVHcloud's European revenue would
                compare two different maps and two different kinds of number, so the chart leaves AWS out
                and says so.
              </p>
              <div className="fc-analysis-heading" style={{ marginTop:10 }}>What the four show</div>
              <p>
                They do not cluster. iliad earns every euro in France, Italy and Poland, so Scaleway sits
                inside a wholly European business. OVHcloud earns just over three quarters in Europe and
                has drifted down as its American and Asian regions grew. United Internet takes about nine
                tenths of revenue in Germany alone, so IONOS also sits inside a business that is European
                by any reading — though the exact share cannot be given, because United Internet reports
                only domestic against foreign and its foreign revenue mixes European countries with
                IONOS Inc. in Philadelphia.
              </p>
              <p>
                Deutsche Telekom is the outlier, and the movement is the point. Europe was 50.8% of its
                revenue in 2018 and is 34.0% in 2025, because T-Mobile US grew into two thirds of the
                group. Open Telekom Cloud is therefore a European sovereign cloud offer owned by a group
                that now earns most of its money in the United States — a fact that belongs in a
                sovereignty assessment whatever one concludes from it. The Schwarz Group publishes no
                geographic breakdown at all, so STACKIT cannot be placed on this axis either.
              </p>
            </div>
          </div>
        </div>
      )}

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
