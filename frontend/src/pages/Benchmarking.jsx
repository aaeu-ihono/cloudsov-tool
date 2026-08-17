import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  ResponsiveContainer,
} from 'recharts'
import GlobeView from '../components/GlobeView'

// ── Provider palette (matches FinancialConsideration.jsx) ─────────
const COLORS = {
  OVHcloud:         '#2563eb',
  Scaleway:         '#d97706',
  IONOS:            '#7c3aed',
  STACKIT:          '#16a34a',
  'T-Cloud Public': '#0891b2',
  AWS:              '#ef4444',
}
const PROVIDERS = ['OVHcloud', 'Scaleway', 'IONOS', 'STACKIT', 'T-Cloud Public', 'AWS']

// Providers shown with strikethrough in the instance table (data not self-collected)
const STRUCK = new Set(['STACKIT'])

const METRICS = [
  {
    key: 'mem', label: 'Memory IO', sub: 'STREAM TRIAD', unit: 'MB/s', profile: 'pts/stream',
    desc: 'pts/stream — STREAM Benchmark',
    how: 'Measures sustainable memory bandwidth by streaming large arrays through the CPU cache hierarchy. The TRIAD operation (A = B + scalar × C) reads two arrays and writes one simultaneously — the most demanding of the four STREAM kernels and the best single indicator of memory subsystem throughput. Higher MB/s = less memory bottleneck under data-intensive workloads.',
  },
  {
    key: 'single', label: 'CPU single', sub: 'HINT (MIPS)', unit: 'M MIPS', profile: 'pts/hint',
    desc: 'pts/hint — Hierarchical Integration Benchmark',
    how: 'Evaluates single-core integer and floating-point throughput by computing increasingly fine numerical integrals in a hierarchical fashion. The score grows as long as additional computation fits in cache, making it sensitive to core speed, IPC, and cache latency. Reported in millions of MIPS — higher is better.',
  },
  {
    key: 'multi', label: 'CPU multi', sub: '7-zip MIPS', unit: 'MIPS', profile: 'pts/compress-7zip',
    desc: 'pts/compress-7zip — 7-Zip Internal Benchmark',
    how: 'Uses the LZMA compression algorithm built into 7-zip to stress all available vCPU cores simultaneously. The compression sub-score (reported here) reflects multi-threaded integer performance, branch prediction, and memory access patterns. Reported in MIPS — higher is better.',
  },
  {
    key: 'disk', label: 'Disk IO', sub: 'PostMark TPS', unit: 'TPS', profile: 'pts/postmark',
    desc: 'pts/postmark — PostMark File-System Benchmark',
    how: 'Simulates a busy mail-server workload: creates thousands of small files (4 KB–512 KB), performs random reads and appends, then deletes them. This pattern stresses metadata operations and random small-block I/O rather than sequential throughput. Reported in Transactions Per Second — higher is better. Note: OVHcloud b3-8 uses local NVMe; all others use network-attached block storage, which disadvantages them.',
  },
  {
    key: 'app', label: 'Web / App', sub: 'Apache req/s', unit: 'req/s', profile: 'pts/apache',
    desc: 'pts/apache — Apache HTTP Server Benchmark',
    how: 'Runs Apache Bench (ab) against a local Apache instance serving a static page, measuring sustained HTTP requests per second. Reflects the combined performance of the CPU scheduler, network stack (loopback), and web-server process management. Reported in requests/second — higher is better.',
  },
  {
    key: 'net', label: 'Network', sub: 'iperf3 Mbit/s', unit: 'Mbit/s', profile: 'iperf3',
    desc: 'iperf3 — Inter-instance Network Bandwidth',
    how: 'Two same-tier instances in the same availability zone exchange data over the private network using iperf3 with multiple parallel threads. Measures the maximum achievable bandwidth between co-located VMs — relevant to distributed workloads, replication, and data pipelines. Reported in Mbit/s — higher is better. Data sourced from Cloud Mercato (pcr.cloud-mercato.com) where available.',
  },
  {
    key: 'boot', label: 'Boot speed', sub: 'seconds · ↓ better', unit: 's', profile: 'lifecycle',
    desc: 'Lifecycle — Boot Time (Gillam et al., 2013)',
    how: 'Measures the elapsed time in seconds from submitting the VM create request to SSH becoming reachable on the instance. Part of the Gillam et al. IaaS lifecycle model (Request → Boot → Setup → Run → Release). Inverted for scoring: the provider with the lowest boot time receives 100; others score proportionally lower.',
  },
  {
    key: 'setup', label: 'Setup speed', sub: 'seconds · ↓ better', unit: 's', profile: 'lifecycle',
    desc: 'Lifecycle — Setup Time (Gillam et al., 2013)',
    how: 'Measures the elapsed time in seconds for OS-level initialisation to complete after SSH is first available — covering cloud-init, package updates, and agent startup. Inverted for scoring: the provider with the lowest setup time receives 100; others score proportionally lower.',
  },
]

// Per-metric value formatter (raw number → display string)
const CELL_FMT = {
  mem:    v => Math.round(v).toLocaleString(),
  single: v => Number(v).toFixed(1),
  multi:  v => Math.round(v).toLocaleString(),
  disk:   v => Math.round(v).toLocaleString(),
  app:    v => Math.round(v).toLocaleString(),
  net:    v => Math.round(v).toLocaleString(),
  boot:   v => `${v}s`,
  setup:  v => `${v}s`,
}

// ── Normalise to 0–100 (higher = better unless invert=true) ───────
function norm(obj, invert = false) {
  const vals = PROVIDERS.map(p => obj[p])
  const best = invert ? Math.min(...vals) : Math.max(...vals)
  return Object.fromEntries(PROVIDERS.map(p => [p, Math.round((invert ? best / obj[p] : obj[p] / best) * 100)]))
}

// ── Heatmap colour helpers ────────────────────────────────────────
function scoreColor(s) {
  if (s <= 50) {
    const t = s / 50
    return `rgb(${254},${Math.round(202 + 50 * t)},${Math.round(202 * (1 - t) + 166 * t)})`
  }
  const t = (s - 50) / 50
  return `rgb(${Math.round(254 * (1 - t) + 187 * t)},${Math.round(252 * (1 - t) + 247 * t)},${Math.round(166 * (1 - t) + 208 * t)})`
}
function scoreText(s) {
  if (s >= 75) return '#14532d'
  if (s >= 50) return '#713f12'
  return '#7f1d1d'
}

// ── Recharts helpers ──────────────────────────────────────────────
const hbar = obj => PROVIDERS.map(p => ({ provider: p, value: obj[p] }))

function BenchTip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--tt-bg,#fff)', border: '1px solid var(--tt-border,#e5e7eb)', borderRadius: 6, padding: '8px 12px', fontSize: 12, minWidth: 160 }}>
      <div style={{ fontWeight: 700, marginBottom: 5, color: 'var(--tt-head,#111827)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey ?? p.name} style={{ color: p.fill ?? p.stroke ?? COLORS[p.name] ?? '#555', marginBottom: 2 }}>
          {p.name ?? p.dataKey}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong> {unit}
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, note, height = 280, children }) {
  return (
    <div className="fc-chart-wrap" style={{ marginBottom: 16 }}>
      {title && <div className="fc-chart-title">{title}</div>}
      {note  && <div className="fc-chart-note">{note}</div>}
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

function HBar({ data, unit, fmt, barHeight = 32 }) {
  const h = data.length * (barHeight + 8) + 30
  return (
    <ChartCard height={h}>
      <BarChart layout="vertical" data={data} margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={fmt ?? (v => v.toLocaleString())} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <Tooltip content={<BenchTip unit={unit} />} />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={barHeight}>
          {data.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  )
}

// ── Sub-components (all receive `d` with derived data) ────────────

function PerformanceHeatmap({ d }) {
  const { NORM, COMPOSITE, LEADERS, CELL_STATS, RAW } = d
  const [hovTip, setHovTip] = useState(null)
  const ranked = [...PROVIDERS].sort((a, b) => COMPOSITE[b] - COMPOSITE[a])

  return (
    <div className="fc-chart-wrap" style={{ marginBottom: 16, marginTop: 20, overflowX: 'auto' }}>
      <div className="fc-chart-title">Normalized performance — 8 metrics (raw values, colour = normalized score)</div>
      <div className="fc-chart-note">Each cell shows the average (large centre), with min ↓ / max ↑ range and run count n above/below. Cell colour reflects the normalized 0–100 score (green = best, red = weakest in that column). Boot and setup: lower seconds = better (colour inverted). Gold outline = column leader. Hover a column header for methodology.</div>

      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, marginTop: 12, fontSize: '0.78rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', borderRadius: '6px 0 0 0', minWidth: 130 }}>Provider</th>
            {METRICS.map(m => (
              <th
                key={m.key}
                onMouseEnter={() => setHovTip(m.key)}
                onMouseLeave={() => setHovTip(null)}
                style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 600, color: '#374151', background: hovTip === m.key ? '#eff6ff' : '#f9fafb', borderBottom: '2px solid #e5e7eb', borderLeft: '1px solid #e5e7eb', lineHeight: 1.35, minWidth: 126, cursor: 'help', position: 'relative', transition: 'background 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {m.label}
                  <span style={{ fontSize: '0.6rem', color: '#93c5fd', fontWeight: 400 }}>ⓘ</span>
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 400, color: '#9ca3af', marginTop: 1 }}>{m.sub}</div>
                <div style={{ fontSize: '0.56rem', fontWeight: 400, color: '#374151', marginTop: 2, fontFamily: 'monospace' }}>{m.profile}</div>

                {hovTip === m.key && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 50, width: 280, background: '#1e293b', color: '#e2e8f0',
                    borderRadius: 8, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    textAlign: 'left', pointerEvents: 'none',
                  }}>
                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid #1e293b' }} />
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd', marginBottom: 5 }}>{m.desc}</div>
                    <div style={{ fontSize: '0.66rem', lineHeight: 1.65, color: '#cbd5e1', fontWeight: 400 }}>{m.how}</div>
                  </div>
                )}
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 600, color: '#374151', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', borderLeft: '1px solid #e5e7eb', borderRadius: '0 6px 0 0', minWidth: 80 }}>
              <div>Composite</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 400, color: '#9ca3af', marginTop: 1 }}>avg of 8</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((p, pi) => {
            const isLast = pi === ranked.length - 1
            return (
              <tr key={p} style={{ background: pi % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                <td style={{ padding: '9px 12px', borderBottom: isLast ? 'none' : '1px solid #f0f0f0', fontWeight: 600, color: '#111827' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS[p], display: 'inline-block', flexShrink: 0 }} />
                    {p}
                  </div>
                </td>
                {METRICS.map(m => {
                  const score = NORM[m.key][p]
                  const isBest = LEADERS[m.key] === p
                  const st = CELL_STATS[m.key][p]
                  const fmt = CELL_FMT[m.key]
                  const tc = scoreText(score)
                  return (
                    <td
                      key={m.key}
                      title={`${p} · ${m.label}: avg ${RAW[m.key](p)}, min ${fmt(st.min)}, max ${fmt(st.max)}, n=${st.n} → score ${score}`}
                      style={{
                        textAlign: 'center',
                        padding: '7px 6px',
                        borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
                        borderLeft: '1px solid rgba(0,0,0,0.07)',
                        background: scoreColor(score),
                        outline: isBest ? '2px solid #ca8a04' : 'none',
                        outlineOffset: '-2px',
                        position: 'relative',
                        cursor: 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ fontSize: '0.55rem', color: tc, opacity: 0.68, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>↑ {fmt(st.max)}</span>
                          <span style={{ fontSize: '0.55rem', color: tc, opacity: 0.68, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>↓ {fmt(st.min)}</span>
                        </div>
                        <div style={{ width: 1, height: 26, background: tc, opacity: 0.18, flexShrink: 0 }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: isBest ? 700 : 600, color: tc, fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(st.avg)}
                        </div>
                      </div>
                      <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: '0.5rem', color: tc, opacity: 0.38 }}>n={st.n}</span>
                      {isBest && (
                        <span style={{ position: 'absolute', top: 3, right: 4, fontSize: '0.6rem', color: '#b45309' }}>★</span>
                      )}
                    </td>
                  )
                })}
                <td style={{ textAlign: 'center', padding: '9px 8px', borderBottom: isLast ? 'none' : '1px solid #f0f0f0', borderLeft: '1px solid rgba(0,0,0,0.07)', background: scoreColor(COMPOSITE[p]), fontWeight: 700, color: scoreText(COMPOSITE[p]), fontVariantNumeric: 'tabular-nums' }}>
                  {COMPOSITE[p]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 10, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.62rem', color: '#6b7280' }}>
          <span>Low</span>
          {[0, 20, 40, 60, 80, 100].map(s => (
            <span key={s} style={{ width: 20, height: 12, background: scoreColor(s), display: 'inline-block', borderRadius: 2 }} />
          ))}
          <span>High</span>
        </div>
        <div style={{ fontSize: '0.62rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: '#b45309', fontWeight: 700 }}>★</span>
          <span>Column leader (score = 100)</span>
        </div>
        <div style={{ fontSize: '0.62rem', color: '#6b7280' }}>
          Hover any cell to see the raw measurement.
        </div>
      </div>
      <p style={{ padding: 15, marginTop: 4, fontSize: '0.6rem', color: '#6b7280', lineHeight: 1.65 }}>
        EU providers show lower iperf network bandwidth numbers here because it is possible that they may simply enforce a flat, non-bursting bandwidth cap on this instance tier (many European providers do fixed-rate networking rather than AWS-style credit-based bursting)
      </p>
    </div>
  )
}

function InstanceTable({ d }) {
  const { COMPOSITE, PRICE, INSTANCE, STORAGE } = d
  const ranked = [...PROVIDERS].sort((a, b) => COMPOSITE[b] - COMPOSITE[a])
  return (
    <div className="table-wrap" style={{ marginTop: 16 }}>
      <table className="grid" style={{ fontSize: '0.78rem' }}>
        <thead>
          <tr>
            {['#', 'Provider', 'Instance', 'vCPU', 'RAM', 'Storage', '€/hr', 'Composite'].map(h => (
              <th key={h} style={{ background: '#f0f2f6', padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranked.map((p, i) => {
            const struck = STRUCK.has(p)
            const sd = struck ? 'line-through' : 'none'
            return (
              <tr key={p} style={{ borderTop: '1px solid #e5e7eb', opacity: struck ? 0.5 : 1 }}>
                <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#9ca3af', fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums', textDecoration: sd }}>{i + 1}</td>
                <td style={{ padding: '6px 10px', fontWeight: 600, textDecoration: sd }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: COLORS[p], marginRight: 6 }} />
                  {p}
                </td>
                <td style={{ padding: '6px 10px', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem', textDecoration: sd }}>{INSTANCE[p]}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', textDecoration: sd }}>2</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', textDecoration: sd }}>8 GB</td>
                <td style={{ padding: '6px 10px', color: '#6b7280', fontSize: '0.73rem', textDecoration: sd }}>
                  {STORAGE[p] || (p === 'OVHcloud' ? 'Local NVMe' : 'Network block')}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', textDecoration: sd }}>€{PRICE[p].toFixed(3)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#111827', textDecoration: sd }}>{COMPOSITE[p]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p style={{ padding: 15, marginTop: 10, fontSize: '0.6rem', color: '#6b7280', lineHeight: 1.65 }}>
        <strong style={{ color: '#374151' }}>Note — Storage types: </strong>
        <strong>Local NVMe</strong> — the SSD is physically inside the same server as the VM, and data travels over the internal PCIe bus, making it significantly faster.{' '}
        <strong>Network block</strong> (e.g. EBS on AWS, SBS on Scaleway, EVS on T-Cloud) — the disk lives on a separately dedicated storage cluster and is presented to the VM over a private network, introducing additional latency but providing replication and durability.
      </p>
    </div>
  )
}

function OverviewTab({ d }) {
  const { PRICE, COMPOSITE } = d
  const priceData = PROVIDERS.map(p => ({ provider: p, value: PRICE[p] }))
  const compData  = PROVIDERS.map(p => ({ provider: p, value: COMPOSITE[p] }))
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Datacenter locations — 2 vCPU / 8 GB tier instances
        </div>
        <GlobeView />
      </div>

      <InstanceTable d={d} />
      <PerformanceHeatmap d={d} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div className="fc-chart-wrap">
            <div className="fc-chart-title">Composite performance score (avg of 8 normalized metrics)</div>
            <div className="fc-chart-note">Higher = better overall benchmark profile</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={compData} margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <Tooltip content={<BenchTip unit="/ 100" />} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={28}>
                  {compData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="fc-chart-wrap">
            <div className="fc-chart-title">Hourly list price (€/hr, 2 vCPU / 8 GB RAM)</div>
            <div className="fc-chart-note">Lower = cheaper. Same instance tier across all providers.</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart layout="vertical" data={priceData} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
                <XAxis type="number" tickFormatter={v => `€${v.toFixed(3)}`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <Tooltip content={<BenchTip unit="€/hr" />} />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={28}>
                  {priceData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

function MemoryTab({ d }) {
  const { STREAM } = d
  const ops = ['COPY', 'SCALE', 'ADD', 'TRIAD']
  const desc = {
    COPY:  'C = A  — raw transfer rate, no arithmetic',
    SCALE: 'B = scalar × C  — adds one multiplication',
    ADD:   'C = A + B  — reads two arrays, writes one',
    TRIAD: 'A = B + scalar × C  — most demanding, best overall indicator',
  }
  return (
    <div>
      <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
        <strong>pts/stream</strong> — Memory bandwidth benchmark (Gillam: Memory IO). Four operations measure how fast the CPU can interact with RAM. Higher MB/s indicates less memory bottleneck.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {ops.map(op => {
          const data = PROVIDERS.map(p => ({ provider: p, value: STREAM[p][op] }))
          return (
            <div key={op} className="fc-chart-wrap">
              <div className="fc-chart-title">{op}  —  {desc[op]}</div>
              <div className="fc-chart-note">Unit: MB/s. Higher = better.</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart layout="vertical" data={data} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
                  <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 11, fill: '#374151' }} />
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <Tooltip content={<BenchTip unit="MB/s" />} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={24}>
                    {data.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CpuTab({ d }) {
  const { HINT, COMPRESS } = d
  const hintData     = hbar(HINT)
  const compressData = PROVIDERS.map(p => ({ provider: p, comp: COMPRESS[p].comp, decomp: COMPRESS[p].decomp }))
  return (
    <div>
      <div className="fc-chart-wrap" style={{ marginBottom: 16 }}>
        <div className="fc-chart-title">pts/hint — CPU single-core throughput (Gillam: CPU)</div>
        <div className="fc-chart-note">HINT = Hierarchical Integration benchmark. Reports millions of MIPS. Higher = better.</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart layout="vertical" data={hintData} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => `${v.toFixed(0)}M`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <Tooltip content={<BenchTip unit="M MIPS" />} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={28}>
              {hintData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="fc-chart-wrap">
        <div className="fc-chart-title">pts/compress-7zip — CPU multi-core throughput (Gillam: CPU)</div>
        <div className="fc-chart-note">7-zip compression benchmark. Both compression and decompression reported in MIPS. Higher = better.</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart layout="vertical" data={compressData} margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <Tooltip content={<BenchTip unit="MIPS" />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="comp"   name="Compression"   fill="#2563eb" radius={[0, 2, 2, 0]} maxBarSize={20} />
            <Bar dataKey="decomp" name="Decompression" fill="#93c5fd" radius={[0, 2, 2, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function DiskWebTab({ d }) {
  const { POSTMARK, APACHE } = d
  const postData   = hbar(POSTMARK)
  const apacheData = hbar(APACHE)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="fc-chart-wrap">
        <div className="fc-chart-title">pts/postmark — Disk IO (Gillam: Disk IO)</div>
        <div className="fc-chart-note">
          Simulates a mail server workload — many small file creates, reads, and deletes. Unit: Transactions Per Second. Higher = better.<br/>
          <span style={{ color: '#d97706', fontSize: '0.67rem' }}>Note: OVHcloud b3-8 uses local NVMe; all others use network-attached block storage.</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart layout="vertical" data={postData} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <Tooltip content={<BenchTip unit="TPS" />} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={28}>
              {postData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="fc-chart-wrap">
        <div className="fc-chart-title">pts/apache — Web server throughput (Gillam: Application)</div>
        <div className="fc-chart-note">Apache ab benchmark — sustained HTTP request rate on localhost. Unit: requests/second. Higher = better.</div>
        <p style={{ fontSize: '0.7rem', color: 'red' }}>
          (This already tells us the maximum requests the server can handle during deployment before it starts falling apart/slowing down - MOST IMPORTANT IN MY OPINION)
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart layout="vertical" data={apacheData} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <Tooltip content={<BenchTip unit="req/s" />} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={28}>
              {apacheData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function NetworkTab({ d }) {
  const { IPERF } = d
  const iperfData = PROVIDERS.map(p => ({ provider: p, upload: IPERF[p].up, download: IPERF[p].down }))
  return (
    <div>
      <div className="fc-chart-wrap">
        <div className="fc-chart-title">iperf3 — Network bandwidth (Gillam: Network)</div>
        <div className="fc-chart-note">
          Two same-zone instances, private network. iperf3 multi-thread. Unit: Mbit/s. Higher = better.<br/>
          <span style={{ color: '#d97706', fontSize: '0.67rem' }}>AWS note: Cloud Mercato tested 1–4 thread counts producing multimodal clusters. The ~4,728 Mbit/s 2-thread cluster is the fair comparison; the 4,607 Mbit/s avg mixes all thread counts.</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart layout="vertical" data={iperfData} margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}G` : `${v}`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <Tooltip content={<BenchTip unit="Mbit/s" />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="upload"   name="Upload"   fill="#2563eb" radius={[0, 2, 2, 0]} maxBarSize={20} />
            <Bar dataKey="download" name="Download" fill="#93c5fd" radius={[0, 2, 2, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LifecycleTab({ d }) {
  const { LIFECYCLE } = d
  const lcData = PROVIDERS.map(p => ({
    provider: p,
    boot: LIFECYCLE[p].boot,
    setup: LIFECYCLE[p].setup,
    total: Math.round((LIFECYCLE[p].boot + LIFECYCLE[p].setup) * 10) / 10,
  }))
  return (
    <div>
      <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
        Gillam et al.'s lifecycle model measures the time between requesting a VM and it being ready to serve workloads. <strong>Boot time</strong> = VM reaches SSH. <strong>Setup time</strong> = OS-level initialization completes. Lower is better.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="fc-chart-wrap">
          <div className="fc-chart-title">Boot time — VM reaches SSH</div>
          <div className="fc-chart-note">Unit: seconds. Lower = better.</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={lcData} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
              <XAxis type="number" tickFormatter={v => `${v}s`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <Tooltip content={<BenchTip unit="s" />} />
              <Bar dataKey="boot" radius={[0, 3, 3, 0]} maxBarSize={28}>
                {lcData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="fc-chart-wrap">
          <div className="fc-chart-title">Setup time — OS initialization</div>
          <div className="fc-chart-note">Unit: seconds. Lower = better.</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={lcData} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
              <XAxis type="number" tickFormatter={v => `${v}s`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <Tooltip content={<BenchTip unit="s" />} />
              <Bar dataKey="setup" radius={[0, 3, 3, 0]} maxBarSize={28}>
                {lcData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="fc-chart-wrap" style={{ marginTop: 16 }}>
        <div className="fc-chart-title">Total provisioning time (boot + setup)</div>
        <div className="fc-chart-note">Combined time from VM request to workload-ready state. Unit: seconds. Lower = better.</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart layout="vertical" data={lcData} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => `${v}s`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <Tooltip content={<BenchTip unit="s" />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="boot"  name="Boot"  fill="#1e3a5f" radius={[0, 0, 0, 0]} maxBarSize={28} stackId="lc" />
            <Bar dataKey="setup" name="Setup" fill="#93c5fd" radius={[0, 3, 3, 0]} maxBarSize={28} stackId="lc" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ValueTab({ d }) {
  const { COMPOSITE, PRICE, NORM } = d
  const valueData = PROVIDERS.map(p => ({
    provider: p,
    score: COMPOSITE[p],
    value: Math.round(COMPOSITE[p] / PRICE[p]),
  })).sort((a, b) => b.value - a.value)

  const perMetric = [
    { label: 'Memory IO / €',  key: 'mem',    data: PROVIDERS.map(p => ({ provider: p, value: Math.round(NORM.mem[p]    / PRICE[p]) })) },
    { label: 'CPU single / €', key: 'single', data: PROVIDERS.map(p => ({ provider: p, value: Math.round(NORM.single[p] / PRICE[p]) })) },
    { label: 'CPU multi / €',  key: 'multi',  data: PROVIDERS.map(p => ({ provider: p, value: Math.round(NORM.multi[p]  / PRICE[p]) })) },
    { label: 'Disk IO / €',    key: 'disk',   data: PROVIDERS.map(p => ({ provider: p, value: Math.round(NORM.disk[p]   / PRICE[p]) })) },
    { label: 'Web/App / €',    key: 'app',    data: PROVIDERS.map(p => ({ provider: p, value: Math.round(NORM.app[p]    / PRICE[p]) })) },
    { label: 'Network / €',    key: 'net',    data: PROVIDERS.map(p => ({ provider: p, value: Math.round(NORM.net[p]    / PRICE[p]) })) },
  ]

  return (
    <div>
      <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
        Performance per euro — each metric's normalized score (0–100) divided by the hourly list price. Higher = more performance per €. Useful for workloads with flexible provider choice.
      </p>

      <div className="fc-chart-wrap" style={{ marginBottom: 16 }}>
        <div className="fc-chart-title">Composite performance per €/hr (avg of all 8 normalized metrics ÷ price)</div>
        <div className="fc-chart-note">Higher = better value. Sorted by efficiency.</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart layout="vertical" data={valueData} margin={{ left: 4, right: 60, top: 4, bottom: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <Tooltip content={<BenchTip unit="score/€" />} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={28}>
              {valueData.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {perMetric.map(({ label, key, data }) => (
          <div key={key} className="fc-chart-wrap" style={{ padding: '10px 8px 8px' }}>
            <div className="fc-chart-title" style={{ fontSize: '0.75rem' }}>{label}</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={data} margin={{ left: 4, right: 36, top: 2, bottom: 2 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="provider" width={120} tick={{ fontSize: 10, fill: '#374151' }} />
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <Tooltip content={<BenchTip unit="score/€" />} />
                <Bar dataKey="value" radius={[0, 2, 2, 0]} maxBarSize={22}>
                  {data.map(d => <Cell key={d.provider} fill={COLORS[d.provider]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'memory',    label: 'Memory IO' },
  { id: 'cpu',       label: 'CPU' },
  { id: 'disk',      label: 'Disk & Web' },
  { id: 'network',   label: 'Network' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'value',     label: 'Value / €' },
]

export default function Benchmarking() {
  const [tab, setTab] = useState('overview')
  const [legendOpen, setLegendOpen] = useState(true)
  const [rawData, setRawData]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [fetchErr, setFetchErr] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/api/benchmarks')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setRawData(data); setLoading(false) })
      .catch(e  => { setFetchErr(e.message); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="content">
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
          Loading benchmark data…
        </div>
      </div>
    )
  }

  if (fetchErr) {
    return (
      <div className="content">
        <div style={{ padding: 24, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, color: '#991b1b', fontSize: '0.82rem' }}>
          <strong>Could not load benchmark data:</strong> {fetchErr}<br/>
          Make sure the backend is running on port 8000.
        </div>
      </div>
    )
  }

  // ── Derive structured data from API response ──────────────────────
  const PRICE   = Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.price_eur_per_hr ?? 0]))
  const INSTANCE = Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.instance ?? '—']))
  const STORAGE  = Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.storage  ?? '']))

  const STREAM = Object.fromEntries(PROVIDERS.map(p => [p, {
    COPY:  rawData[p]?.stream?.COPY?.avg  ?? 0,
    SCALE: rawData[p]?.stream?.SCALE?.avg ?? 0,
    ADD:   rawData[p]?.stream?.ADD?.avg   ?? 0,
    TRIAD: rawData[p]?.stream?.TRIAD?.avg ?? 0,
  }]))

  const HINT = Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.hint?.avg ?? 0]))

  const COMPRESS = Object.fromEntries(PROVIDERS.map(p => [p, {
    comp:  rawData[p]?.compress?.comp?.avg   ?? 0,
    decomp: rawData[p]?.compress?.decomp?.avg ?? 0,
  }]))

  const POSTMARK  = Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.postmark?.avg     ?? 0]))
  const APACHE    = Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.apache?.avg       ?? 0]))

  const IPERF = Object.fromEntries(PROVIDERS.map(p => [p, {
    up:   rawData[p]?.iperf?.upload?.avg   ?? 0,
    down: rawData[p]?.iperf?.download?.avg ?? 0,
  }]))

  const LIFECYCLE = Object.fromEntries(PROVIDERS.map(p => [p, {
    boot:  rawData[p]?.boot_time?.avg  ?? 0,
    setup: rawData[p]?.setup_time?.avg ?? 0,
  }]))

  // Per-metric cell stats: { avg, min, max, n } sourced from the JSON via the API
  const CELL_STATS = {
    mem:    Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.stream?.TRIAD        ?? { avg: 0, min: 0, max: 0, n: 0 }])),
    single: Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.hint                ?? { avg: 0, min: 0, max: 0, n: 0 }])),
    multi:  Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.compress?.comp       ?? { avg: 0, min: 0, max: 0, n: 0 }])),
    disk:   Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.postmark             ?? { avg: 0, min: 0, max: 0, n: 0 }])),
    app:    Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.apache               ?? { avg: 0, min: 0, max: 0, n: 0 }])),
    net:    Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.iperf?.upload        ?? { avg: 0, min: 0, max: 0, n: 0 }])),
    boot:   Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.boot_time            ?? { avg: 0, min: 0, max: 0, n: 0 }])),
    setup:  Object.fromEntries(PROVIDERS.map(p => [p, rawData[p]?.setup_time           ?? { avg: 0, min: 0, max: 0, n: 0 }])),
  }

  // ── Derived scoring ───────────────────────────────────────────────
  const NORM = {
    mem:    norm(Object.fromEntries(PROVIDERS.map(p => [p, STREAM[p].TRIAD]))),
    single: norm(HINT),
    multi:  norm(Object.fromEntries(PROVIDERS.map(p => [p, COMPRESS[p].comp]))),
    disk:   norm(POSTMARK),
    app:    norm(APACHE),
    net:    norm(Object.fromEntries(PROVIDERS.map(p => [p, IPERF[p].up]))),
    boot:   norm(Object.fromEntries(PROVIDERS.map(p => [p, LIFECYCLE[p].boot])),  true),
    setup:  norm(Object.fromEntries(PROVIDERS.map(p => [p, LIFECYCLE[p].setup])), true),
  }

  const COMPOSITE = Object.fromEntries(PROVIDERS.map(p => {
    const avg = (NORM.mem[p] + NORM.single[p] + NORM.multi[p] + NORM.disk[p] + NORM.app[p] + NORM.net[p] + NORM.boot[p] + NORM.setup[p]) / 8
    return [p, Math.round(avg * 10) / 10]
  }))

  const LEADERS = {
    mem:    PROVIDERS.reduce((a, b) => STREAM[a].TRIAD    >= STREAM[b].TRIAD    ? a : b),
    single: PROVIDERS.reduce((a, b) => HINT[a]            >= HINT[b]            ? a : b),
    multi:  PROVIDERS.reduce((a, b) => COMPRESS[a].comp   >= COMPRESS[b].comp   ? a : b),
    disk:   PROVIDERS.reduce((a, b) => POSTMARK[a]        >= POSTMARK[b]        ? a : b),
    app:    PROVIDERS.reduce((a, b) => APACHE[a]          >= APACHE[b]          ? a : b),
    net:    PROVIDERS.reduce((a, b) => IPERF[a].up        >= IPERF[b].up        ? a : b),
    boot:   PROVIDERS.reduce((a, b) => LIFECYCLE[a].boot  <= LIFECYCLE[b].boot  ? a : b),
    setup:  PROVIDERS.reduce((a, b) => LIFECYCLE[a].setup <= LIFECYCLE[b].setup ? a : b),
  }

  const RAW = {
    mem:    p => `${Math.round(CELL_STATS.mem[p].avg).toLocaleString()} MB/s`,
    single: p => `${Number(CELL_STATS.single[p].avg).toFixed(1)} M MIPS`,
    multi:  p => `${Math.round(CELL_STATS.multi[p].avg).toLocaleString()} MIPS`,
    disk:   p => `${Math.round(CELL_STATS.disk[p].avg).toLocaleString()} TPS`,
    app:    p => `${Math.round(CELL_STATS.app[p].avg).toLocaleString()} req/s`,
    net:    p => `${Math.round(CELL_STATS.net[p].avg).toLocaleString()} Mbit/s`,
    boot:   p => `${CELL_STATS.boot[p].avg}s`,
    setup:  p => `${CELL_STATS.setup[p].avg}s`,
  }

  // Bundle for prop passing
  const d = {
    PRICE, INSTANCE, STORAGE,
    STREAM, HINT, COMPRESS, POSTMARK, APACHE, IPERF, LIFECYCLE,
    CELL_STATS, NORM, COMPOSITE, LEADERS, RAW,
  }

  return (
    <div className="content">
      <div style={{ marginBottom: 20 }}>
        <div className="ss-title">Technical Benchmarking and Price Consideration</div>
        <div className="ss-sub">6 EU cloud providers · 2 vCPU / 8 GB RAM · 8 benchmark profiles · Gillam et al. Fair_Benchmarking_for_Cloud_Computing_systems (2013) </div>
      </div>

      {/* Data quality notice */}
      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: '8px 14px', fontSize: '0.73rem', color: '#92400e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1rem' }}>⚠</span>
        <span><strong>NOTE:</strong> — Stackit & some other providers data were sourced online from the internet, and was not done by me. Network data (iperf3) for Scaleway, T-Cloud, and AWS is from Cloud Mercato. I will return here to replace with real measurements.</span>
      </div>

      {/* Tab nav */}
      <div className="ra-dim-nav" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ra-dim-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab  d={d} />}
      {tab === 'memory'    && <MemoryTab    d={d} />}
      {tab === 'cpu'       && <CpuTab       d={d} />}
      {tab === 'disk'      && <DiskWebTab   d={d} />}
      {tab === 'network'   && <NetworkTab   d={d} />}
      {tab === 'lifecycle' && <LifecycleTab d={d} />}
      {tab === 'value'     && <ValueTab     d={d} />}

      {/* Legend */}
      <div className="legend" style={{ marginTop: 28 }}>
        <div
          className={`legend-title${legendOpen ? '' : ' collapsed'}`}
          onClick={() => setLegendOpen(o => !o)}
        >
          Legend — Composite Score Methodology
        </div>
        <div className={`legend-body${legendOpen ? '' : ' hidden'}`}>
          <div className="legend-grid">

            <div className="legend-section">
              <p className="legend-heading">Composite formula</p>
              <p className="legend-desc">
                Each raw benchmark value is first normalized to a 0–100 score (100 = best in that column). The composite is then the unweighted average of all 8 normalized scores:
              </p>
              <p className="legend-desc" style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.68rem', background: '#f9fafb', padding: '6px 8px', borderRadius: 4, lineHeight: 1.7 }}>
                Composite = (<br />
                &nbsp;&nbsp;norm(mem) + norm(single) + norm(multi) +<br />
                &nbsp;&nbsp;norm(disk) + norm(app) + norm(net) +<br />
                &nbsp;&nbsp;norm(boot) + norm(setup)<br />
                ) ÷ 8
              </p>
              <p className="legend-desc" style={{ marginTop: '0.4rem' }}>
                Every metric contributes equally (12.5%). Result is on a 0–100 scale.
              </p>

              <p className="legend-heading" style={{ marginTop: '1.2rem' }}>Normalization — higher is better</p>
              <p className="legend-desc" style={{ fontFamily: 'monospace', fontSize: '0.68rem', background: '#f9fafb', padding: '6px 8px', borderRadius: 4, lineHeight: 1.9 }}>
                norm(mem)    = (TRIAD MB/s   ÷ best TRIAD MB/s)  × 100<br />
                norm(single) = (HINT MIPS    ÷ best HINT MIPS)   × 100<br />
                norm(multi)  = (7-zip MIPS   ÷ best 7-zip MIPS)  × 100<br />
                norm(disk)   = (PostMark TPS ÷ best TPS)         × 100<br />
                norm(app)    = (Apache req/s ÷ best req/s)       × 100<br />
                norm(net)    = (iperf3 Mbit/s ÷ best Mbit/s)    × 100
              </p>
              <p className="legend-heading" style={{ marginTop: '1rem' }}>Normalization — lower is better (inverted)</p>
              <p className="legend-desc" style={{ fontFamily: 'monospace', fontSize: '0.68rem', background: '#f9fafb', padding: '6px 8px', borderRadius: 4, lineHeight: 1.9 }}>
                norm(boot)   = (best boot time  ÷ provider boot time)  × 100<br />
                norm(setup)  = (best setup time ÷ provider setup time) × 100
              </p>
              <p className="legend-desc" style={{ marginTop: '0.4rem' }}>
                The column leader always scores exactly 100. All others score proportionally lower.
              </p>
            </div>

            <div className="legend-section">
              <p className="legend-heading">The 8 metrics (equal weight)</p>
              {METRICS.map(m => (
                <div key={m.key} className="legend-row">
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#0891b2', background: '#f0f9ff', padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>{m.profile}</span>
                  <span className="legend-desc">{m.label} — {m.sub}</span>
                </div>
              ))}

              <p className="legend-heading" style={{ marginTop: '1.2rem' }}>Cell colour scale</p>
              <div className="legend-row">
                <span style={{ display: 'flex', gap: 2 }}>
                  {[0, 20, 40, 60, 80, 100].map(s => (
                    <span key={s} style={{ width: 18, height: 14, background: scoreColor(s), display: 'inline-block', borderRadius: 2 }} />
                  ))}
                </span>
                <span className="legend-desc">Red (score 0) → Yellow (50) → Green (100, best in column)</span>
              </div>
            </div>

          </div>
          <p className="legend-source">
            Framework: Gillam, L., Li, B., O'Loughlin, J. (2013). Fair benchmarking for cloud computing systems. <em>Journal of Cloud Computing</em>, 2(1), 6.
            &nbsp;·&nbsp; Benchmark profiles via Phoronix Test Suite (openbenchmarking.org).
            &nbsp;·&nbsp; Network data (iperf3) via Cloud Mercato (pcr.cloud-mercato.com).
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb', fontSize: '0.68rem', color: '#9ca3af', lineHeight: 1.6 }}>
        <strong style={{ color: '#6b7280' }}>Sources:</strong> Phoronix Test Suite (pts/stream, pts/hint, pts/compress-7zip, pts/postmark, pts/apache) — self-measured or third-party.
        Network bandwidth (iperf3) — Cloud Mercato (pcr.cloud-mercato.com) for Scaleway, T-Cloud Public, AWS; placeholder for OVHcloud, IONOS, STACKIT.
        Lifecycle times — Cloud Mercato where available.
        Framework: Gillam, L., Li, B., O'Loughlin, J. (2013). Fair benchmarking for cloud computing systems. <em>Journal of Cloud Computing</em>, 2(1), 6.
      </div>
    </div>
  )
}
