import { useState } from 'react'
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

// ── Raw benchmark data ────────────────────────────────────────────
const PRICE = {
  OVHcloud: 0.060, Scaleway: 0.074, IONOS: 0.041,
  STACKIT: 0.098, 'T-Cloud Public': 0.114, AWS: 0.106,
}
const INSTANCE = {
  OVHcloud: 'b3-8', Scaleway: 'POP2-2C-8G', IONOS: '2 vCPU / 8 GB',
  STACKIT: 'g1a.2d', 'T-Cloud Public': 's3.large.4', AWS: 'm6i.large',
}
const STREAM = {
  OVHcloud:         { COPY: 30313, SCALE: 14675, ADD: 16809, TRIAD: 16944 },
  Scaleway:         { COPY: 28584, SCALE: 16904, ADD: 19237, TRIAD: 19384 },
  IONOS:            { COPY: 23987, SCALE: 18347, ADD: 20244, TRIAD: 20394 },
  STACKIT:          { COPY: 27984, SCALE: 16547, ADD: 18844, TRIAD: 18994 },
  'T-Cloud Public': { COPY: 29984, SCALE: 17647, ADD: 19960, TRIAD: 20100 },
  AWS:              { COPY: 25247, SCALE: 19234, ADD: 21344, TRIAD: 21477 },
}
const HINT = {
  OVHcloud: 445.3, Scaleway: 437.5, IONOS: 415.6,
  STACKIT: 424.3, 'T-Cloud Public': 418.5, AWS: 443.6,
} // millions of MIPS
const COMPRESS = {
  OVHcloud:         { comp: 11977, decomp: 9203 },
  Scaleway:         { comp: 10917, decomp: 8470 },
  IONOS:            { comp: 9470,  decomp: 7687 },
  STACKIT:          { comp: 10483, decomp: 8193 },
  'T-Cloud Public': { comp: 11363, decomp: 9003 },
  AWS:              { comp: 10296, decomp: 8152 },
}
const POSTMARK = {
  OVHcloud: 8363, Scaleway: 6513, IONOS: 5893,
  STACKIT: 6203, 'T-Cloud Public': 6063, AWS: 4470,
}
const APACHE = {
  OVHcloud: 32477, Scaleway: 29424, IONOS: 27790,
  STACKIT: 28790, 'T-Cloud Public': 31184, AWS: 30127,
}
const IPERF = {
  OVHcloud:         { up: 940,  down: 941  },
  Scaleway:         { up: 401,  down: 402  },
  IONOS:            { up: 2465, down: 2474 },
  STACKIT:          { up: 2872, down: 2881 },
  'T-Cloud Public': { up: 1548, down: 1549 },
  AWS:              { up: 4607, down: 4607 },
}
const LIFECYCLE = {
  OVHcloud:         { boot: 10.63, setup: 22.27 },
  Scaleway:         { boot: 14.1,  setup: 34.43 },
  IONOS:            { boot: 15.27, setup: 28.8  },
  STACKIT:          { boot: 13.13, setup: 26.23 },
  'T-Cloud Public': { boot: 15.8,  setup: 39.8  },
  AWS:              { boot: 13.3,  setup: 23.4  },
}

// ── Normalise to 0–100 (higher = better unless invert=true) ───────
function norm(obj, invert = false) {
  const vals = PROVIDERS.map(p => obj[p])
  const best = invert ? Math.min(...vals) : Math.max(...vals)
  return Object.fromEntries(PROVIDERS.map(p => [p, Math.round((invert ? best / obj[p] : obj[p] / best) * 100)]))
}

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

// ── Recharts data helpers ─────────────────────────────────────────
const hbar = obj => PROVIDERS.map(p => ({ provider: p, value: obj[p] }))

// ── Chart sub-components ──────────────────────────────────────────
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

// Grouped horizontal bar (2 keys)
function HBarGrouped({ data, keys, unit, fmt, barHeight = 20 }) {
  const h = data.length * (barHeight * 2 + 16) + 40
  return (
    <ChartCard height={h}>
      <BarChart layout="vertical" data={data} margin={{ left: 4, right: 40, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={fmt ?? (v => v.toLocaleString())} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="provider" width={130} tick={{ fontSize: 12, fill: '#374151' }} />
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <Tooltip content={<BenchTip unit={unit} />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 4 }} />
        {keys.map(k => (
          <Bar key={k.key} dataKey={k.key} name={k.label} fill={k.color} radius={[0, 2, 2, 0]} maxBarSize={barHeight} />
        ))}
      </BarChart>
    </ChartCard>
  )
}

// ── Tab content sections ──────────────────────────────────────────
function OverviewTab() {
  const priceData = PROVIDERS.map(p => ({ provider: p, value: PRICE[p] }))
  const compData  = PROVIDERS.map(p => ({ provider: p, value: COMPOSITE[p] }))
  return (
    <div>
      {/* Globe */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Datacenter locations — 2 vCPU / 8 GB tier instances
        </div>
        <GlobeView />
      </div>

      {/* Instance table — immediately below globe */}
      <InstanceTable />

      <PerformanceHeatmap />

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

// ── Heatmap colour helpers ────────────────────────────────────────
function scoreColor(s) {
  // 0 → red-100, 50 → yellow-100, 100 → green-100
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

const METRICS = [
  {
    key: 'mem', label: 'Memory IO', sub: 'STREAM TRIAD', unit: 'MB/s',
    desc: 'pts/stream — STREAM Benchmark',
    how: 'Measures sustainable memory bandwidth by streaming large arrays through the CPU cache hierarchy. The TRIAD operation (A = B + scalar × C) reads two arrays and writes one simultaneously — the most demanding of the four STREAM kernels and the best single indicator of memory subsystem throughput. Higher MB/s = less memory bottleneck under data-intensive workloads.',
  },
  {
    key: 'single', label: 'CPU single', sub: 'HINT (MIPS)', unit: 'M MIPS',
    desc: 'pts/hint — Hierarchical Integration Benchmark',
    how: 'Evaluates single-core integer and floating-point throughput by computing increasingly fine numerical integrals in a hierarchical fashion. The score grows as long as additional computation fits in cache, making it sensitive to core speed, IPC, and cache latency. Reported in millions of MIPS — higher is better.',
  },
  {
    key: 'multi', label: 'CPU multi', sub: '7-zip MIPS', unit: 'MIPS',
    desc: 'pts/compress-7zip — 7-Zip Internal Benchmark',
    how: 'Uses the LZMA compression algorithm built into 7-zip to stress all available vCPU cores simultaneously. The compression sub-score (reported here) reflects multi-threaded integer performance, branch prediction, and memory access patterns. Reported in MIPS — higher is better.',
  },
  {
    key: 'disk', label: 'Disk IO', sub: 'PostMark TPS', unit: 'TPS',
    desc: 'pts/postmark — PostMark File-System Benchmark',
    how: 'Simulates a busy mail-server workload: creates thousands of small files (4 KB–512 KB), performs random reads and appends, then deletes them. This pattern stresses metadata operations and random small-block I/O rather than sequential throughput. Reported in Transactions Per Second — higher is better. Note: OVHcloud b3-8 uses local NVMe; all others use network-attached block storage, which disadvantages them.',
  },
  {
    key: 'app', label: 'Web / App', sub: 'Apache req/s', unit: 'req/s',
    desc: 'pts/apache — Apache HTTP Server Benchmark',
    how: 'Runs Apache Bench (ab) against a local Apache instance serving a static page, measuring sustained HTTP requests per second. Reflects the combined performance of the CPU scheduler, network stack (loopback), and web-server process management. Reported in requests/second — higher is better.',
  },
  {
    key: 'net', label: 'Network', sub: 'iperf3 Mbit/s', unit: 'Mbit/s',
    desc: 'iperf3 — Inter-instance Network Bandwidth',
    how: 'Two same-tier instances in the same availability zone exchange data over the private network using iperf3 with multiple parallel threads. Measures the maximum achievable bandwidth between co-located VMs — relevant to distributed workloads, replication, and data pipelines. Reported in Mbit/s — higher is better. Data sourced from Cloud Mercato (pcr.cloud-mercato.com) where available.',
  },
  {
    key: 'boot', label: 'Boot speed', sub: 'seconds · ↓ better', unit: 's',
    desc: 'Lifecycle — Boot Time (Gillam et al., 2013)',
    how: 'Measures the elapsed time in seconds from submitting the VM create request to SSH becoming reachable on the instance. Part of the Gillam et al. IaaS lifecycle model (Request → Boot → Setup → Run → Release). Inverted for scoring: the provider with the lowest boot time receives 100; others score proportionally lower.',
  },
  {
    key: 'setup', label: 'Setup speed', sub: 'seconds · ↓ better', unit: 's',
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

// Min / avg / max / n sourced from per-provider JSON benchmark files
const CELL_STATS = {
  mem: {
    OVHcloud: { avg: 16944,  min: 16900,  max: 16988,  n: 3  },
    IONOS:    { avg: 20394,  min: 20251,  max: 20510,  n: 3  },
    STACKIT:  { avg: 18994,  min: 18851,  max: 19110,  n: 3  },
    'T-Cloud Public': { avg: 20100,  min: 19951,  max: 20250,  n: 3  },
    AWS:      { avg: 21477,  min: 21351,  max: 21590,  n: 3  },
    Scaleway: { avg: 19384,  min: 19281,  max: 19490,  n: 3  },
  },
  single: {
    OVHcloud: { avg: 445.3,  min: 442.1,  max: 448.5,  n: 3  },
    IONOS:    { avg: 415.6,  min: 412.4,  max: 418.9,  n: 3  },
    STACKIT:  { avg: 424.3,  min: 421.4,  max: 426.8,  n: 3  },
    'T-Cloud Public': { avg: 418.5,  min: 415.2,  max: 421.8,  n: 3  },
    AWS:      { avg: 443.6,  min: 441.3,  max: 445.9,  n: 3  },
    Scaleway: { avg: 437.5,  min: 435.1,  max: 439.9,  n: 3  },
  },
  multi: {
    OVHcloud: { avg: 11977,  min: 11850,  max: 12100,  n: 3  },
    IONOS:    { avg: 9470,   min: 9420,   max: 9510,   n: 3  },
    STACKIT:  { avg: 10483,  min: 10420,  max: 10550,  n: 3  },
    'T-Cloud Public': { avg: 11363,  min: 11250,  max: 11480,  n: 3  },
    AWS:      { avg: 10296,  min: 10275,  max: 10319,  n: 3  },
    Scaleway: { avg: 10917,  min: 10850,  max: 10980,  n: 3  },
  },
  disk: {
    OVHcloud: { avg: 8363,   min: 8250,   max: 8480,   n: 3  },
    IONOS:    { avg: 5893,   min: 5820,   max: 5950,   n: 3  },
    STACKIT:  { avg: 6203,   min: 6120,   max: 6280,   n: 3  },
    'T-Cloud Public': { avg: 6063,   min: 5980,   max: 6150,   n: 3  },
    AWS:      { avg: 4470,   min: 4420,   max: 4510,   n: 3  },
    Scaleway: { avg: 6513,   min: 6450,   max: 6580,   n: 3  },
  },
  app: {
    OVHcloud: { avg: 32477,  min: 32101,  max: 32850,  n: 3  },
    IONOS:    { avg: 27790,  min: 27451,  max: 28100,  n: 3  },
    STACKIT:  { avg: 28790,  min: 28451,  max: 29100,  n: 3  },
    'T-Cloud Public': { avg: 31184,  min: 30850,  max: 31521,  n: 3  },
    AWS:      { avg: 30127,  min: 29850,  max: 30421,  n: 3  },
    Scaleway: { avg: 29424,  min: 29100,  max: 29751,  n: 3  },
  },
  net: {
    OVHcloud: { avg: 940,    min: 938,    max: 943,    n: 3  },
    IONOS:    { avg: 2465,   min: 2450,   max: 2481,   n: 3  },
    STACKIT:  { avg: 2872,   min: 2850,   max: 2891,   n: 3  },
    'T-Cloud Public': { avg: 1548,   min: 1538,   max: 1578,   n: 50 },
    AWS:      { avg: 4607,   min: 758,    max: 11271,  n: 80 },
    Scaleway: { avg: 401,    min: 390,    max: 462,    n: 20 },
  },
  boot: {
    OVHcloud: { avg: 10.63,  min: 10.2,   max: 11.1,   n: 3  },
    IONOS:    { avg: 15.27,  min: 14.9,   max: 15.8,   n: 3  },
    STACKIT:  { avg: 13.13,  min: 12.8,   max: 13.5,   n: 3  },
    'T-Cloud Public': { avg: 15.8,   min: 15.2,   max: 16.4,   n: 3  },
    AWS:      { avg: 13.3,   min: 12.9,   max: 13.8,   n: 3  },
    Scaleway: { avg: 14.1,   min: 13.8,   max: 14.5,   n: 3  },
  },
  setup: {
    OVHcloud: { avg: 22.27,  min: 21.5,   max: 23.2,   n: 3  },
    IONOS:    { avg: 28.8,   min: 27.9,   max: 30.1,   n: 3  },
    STACKIT:  { avg: 26.23,  min: 25.4,   max: 27.1,   n: 3  },
    'T-Cloud Public': { avg: 39.8,   min: 38.5,   max: 41.2,   n: 3  },
    AWS:      { avg: 23.4,   min: 22.1,   max: 24.8,   n: 3  },
    Scaleway: { avg: 34.43,  min: 33.2,   max: 36.1,   n: 3  },
  },
}

// Hover title (avg with unit)
const RAW = {
  mem:    p => `${CELL_STATS.mem[p].avg.toLocaleString()} MB/s`,
  single: p => `${CELL_STATS.single[p].avg.toFixed(1)} M MIPS`,
  multi:  p => `${CELL_STATS.multi[p].avg.toLocaleString()} MIPS`,
  disk:   p => `${CELL_STATS.disk[p].avg.toLocaleString()} TPS`,
  app:    p => `${CELL_STATS.app[p].avg.toLocaleString()} req/s`,
  net:    p => `${CELL_STATS.net[p].avg.toLocaleString()} Mbit/s`,
  boot:   p => `${CELL_STATS.boot[p].avg}s`,
  setup:  p => `${CELL_STATS.setup[p].avg}s`,
}

// True leader per metric — determined from raw values, not rounded scores,
// so rounding ties never produce two stars in the same column.
const LEADERS = {
  mem:    PROVIDERS.reduce((a, b) => STREAM[a].TRIAD   >= STREAM[b].TRIAD   ? a : b),
  single: PROVIDERS.reduce((a, b) => HINT[a]           >= HINT[b]           ? a : b),
  multi:  PROVIDERS.reduce((a, b) => COMPRESS[a].comp  >= COMPRESS[b].comp  ? a : b),
  disk:   PROVIDERS.reduce((a, b) => POSTMARK[a]       >= POSTMARK[b]       ? a : b),
  app:    PROVIDERS.reduce((a, b) => APACHE[a]         >= APACHE[b]         ? a : b),
  net:    PROVIDERS.reduce((a, b) => IPERF[a].up       >= IPERF[b].up       ? a : b),
  boot:   PROVIDERS.reduce((a, b) => LIFECYCLE[a].boot  <= LIFECYCLE[b].boot  ? a : b),
  setup:  PROVIDERS.reduce((a, b) => LIFECYCLE[a].setup <= LIFECYCLE[b].setup ? a : b),
}

function PerformanceHeatmap() {
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
                style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 600, color: '#374151', background: hovTip === m.key ? '#eff6ff' : '#f9fafb', borderBottom: '2px solid #e5e7eb', lineHeight: 1.35, minWidth: 126, cursor: 'help', position: 'relative', transition: 'background 0.15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  {m.label}
                  <span style={{ fontSize: '0.6rem', color: '#93c5fd', fontWeight: 400 }}>ⓘ</span>
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 400, color: '#9ca3af', marginTop: 1 }}>{m.sub}</div>

                {hovTip === m.key && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 50, width: 280, background: '#1e293b', color: '#e2e8f0',
                    borderRadius: 8, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    textAlign: 'left', pointerEvents: 'none',
                  }}>
                    {/* Arrow pointing up toward the header */}
                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid #1e293b' }} />
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd', marginBottom: 5 }}>{m.desc}</div>
                    <div style={{ fontSize: '0.66rem', lineHeight: 1.65, color: '#cbd5e1', fontWeight: 400 }}>{m.how}</div>
                  </div>
                )}
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 600, color: '#374151', background: '#f9fafb', borderBottom: '2px solid #e5e7eb', borderRadius: '0 6px 0 0', minWidth: 80 }}>
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
                {/* Provider name */}
                <td style={{ padding: '9px 12px', borderBottom: isLast ? 'none' : '1px solid #f0f0f0', fontWeight: 600, color: '#111827' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: COLORS[p], display: 'inline-block', flexShrink: 0 }} />
                    {p}
                  </div>
                </td>
                {/* Metric cells */}
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
                        background: scoreColor(score),
                        outline: isBest ? '2px solid #ca8a04' : 'none',
                        outlineOffset: '-2px',
                        position: 'relative',
                        cursor: 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        {/* Left column: max on top, min on bottom */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <span style={{ fontSize: '0.55rem', color: tc, opacity: 0.68, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>↑ {fmt(st.max)}</span>
                          <span style={{ fontSize: '0.55rem', color: tc, opacity: 0.68, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>↓ {fmt(st.min)}</span>
                        </div>
                        {/* Separator */}
                        <div style={{ width: 1, height: 26, background: tc, opacity: 0.18, flexShrink: 0 }} />
                        {/* Right column: average */}
                        <div style={{ fontSize: '0.9rem', fontWeight: isBest ? 700 : 600, color: tc, fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(st.avg)}
                        </div>
                      </div>
                      {/* n badge bottom-right */}
                      <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: '0.5rem', color: tc, opacity: 0.38 }}>n={st.n}</span>
                      {isBest && (
                        <span style={{ position: 'absolute', top: 3, right: 4, fontSize: '0.6rem', color: '#b45309' }}>★</span>
                      )}
                    </td>
                  )
                })}
                {/* Composite */}
                <td style={{ textAlign: 'center', padding: '9px 8px', borderBottom: isLast ? 'none' : '1px solid #f0f0f0', background: scoreColor(COMPOSITE[p]), fontWeight: 700, color: scoreText(COMPOSITE[p]), fontVariantNumeric: 'tabular-nums' }}>
                  {COMPOSITE[p]}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 10, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Colour scale legend */}
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
    </div>
  )
}

function InstanceTable() {
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
                  {p === 'OVHcloud' ? 'Local NVMe' : 'Network block'}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', textDecoration: sd }}>€{PRICE[p].toFixed(3)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#111827', textDecoration: sd }}>{COMPOSITE[p]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p style={{padding: 15, marginTop: 10, fontSize: '0.6rem', color: '#6b7280', lineHeight: 1.65 }}>
        <strong style={{ color: '#374151' }}>Note — Storage types: </strong>
        <strong>Local NVMe</strong> — the SSD is physically inside the same server as the VM, and data travels over the internal PCIe bus, making it significantly faster.{' '}
        <strong>Network block</strong> (e.g. EBS on AWS, SBS on Scaleway, EVS on T-Cloud) — the disk lives on a separately dedicated storage cluster and is presented to the VM over a private network, introducing additional latency but providing replication and durability.
      </p>
    </div>
  )
}

function MemoryTab() {
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

function CpuTab() {
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

function DiskWebTab() {
  const postData  = hbar(POSTMARK)
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

function NetworkTab() {
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

function LifecycleTab() {
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

function ValueTab() {
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
        <div className="fc-chart-title">Composite performance per €/hr (avg of all 7 normalized metrics ÷ price)</div>
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

  return (
    <div className="content">
      <div style={{ marginBottom: 20 }}>
        <div className="ss-title">Technical Benchmarking and Price Consideration</div>
        <div className="ss-sub">6 EU cloud providers · 2 vCPU / 8 GB RAM · 8 benchmark profiles · Gillam et al. Fair_Benchmarking_for_Cloud_Computing_systems (2013) </div>
      </div>

      {/* Data quality notice */}
      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: '8px 14px', fontSize: '0.73rem', color: '#92400e', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1rem' }}>⚠</span>
        <span><strong>Placeholder data</strong> — Phoronix profile figures and some lifecycle values are not yet verified. Network data (iperf3) for Scaleway, T-Cloud, and AWS is from Cloud Mercato. Return here to replace with real measurements.</span>
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
      {tab === 'overview'  && <OverviewTab />}
      {tab === 'memory'    && <MemoryTab />}
      {tab === 'cpu'       && <CpuTab />}
      {tab === 'disk'      && <DiskWebTab />}
      {tab === 'network'   && <NetworkTab />}
      {tab === 'lifecycle' && <LifecycleTab />}
      {tab === 'value'     && <ValueTab />}

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', fontSize: '0.68rem', color: '#9ca3af', lineHeight: 1.6 }}>
        <strong style={{ color: '#6b7280' }}>Sources:</strong> Phoronix Test Suite (pts/stream, pts/hint, pts/compress-7zip, pts/postmark, pts/apache) — self-measured or third-party.
        Network bandwidth (iperf3) — Cloud Mercato (pcr.cloud-mercato.com) for Scaleway, T-Cloud Public, AWS; placeholder for OVHcloud, IONOS, STACKIT.
        Lifecycle times — Cloud Mercato where available.
        Framework: Gillam, L., Li, B., O'Loughlin, J. (2013). Fair benchmarking for cloud computing systems. <em>Journal of Cloud Computing</em>, 2(1), 6.
      </div>
    </div>
  )
}
