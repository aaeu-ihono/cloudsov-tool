import { useRef, useEffect, useMemo, useState } from 'react'

const DEG = Math.PI / 180

// Providers spread ~60 ° apart in longitude so each is visible at a different
// point in the rotation. Labels still name the real datacenter.
export const GLOBE_PROVIDERS = [
  { id: 'OVHcloud', name: 'OVHcloud',      lon:  -8, lat: 48,  color: '#60a5fa', price: 0.060, instance: 'b3-8',         region: 'GRA · Gravelines, France',     vcpu: 2, ram: 8, eu: true  },
  { id: 'IONOS',    name: 'IONOS',          lon:  52, lat: 14,  color: '#c084fc', price: 0.041, instance: '2 vCPU / 8 GB',region: 'DE1 · Frankfurt, Germany',     vcpu: 2, ram: 8, eu: true  },
  { id: 'STACKIT',  name: 'STACKIT',        lon: 118, lat: -28, color: '#4ade80', price: 0.098, instance: 'g1a.2d',       region: 'EU01 · Heilbronn, Germany',    vcpu: 2, ram: 8, eu: true  },
  { id: 'TCloud',   name: 'T-Cloud Public', lon: 178, lat: 32,  color: '#22d3ee', price: 0.114, instance: 's3.large.4',   region: 'EU-DE · Frankfurt, Germany',   vcpu: 2, ram: 8, eu: true  },
  { id: 'AWS',      name: 'AWS',            lon:-118, lat: -16, color: '#f87171', price: 0.106, instance: 'm6i.large',    region: 'eu-central-1 · Frankfurt, DE', vcpu: 2, ram: 8, eu: false },
  { id: 'Scaleway', name: 'Scaleway',       lon: -62, lat: 43,  color: '#fbbf24', price: 0.074, instance: 'POP2-2C-8G',   region: 'PAR · Paris, France',          vcpu: 2, ram: 8, eu: true  },
]

// ── Land polygons ────────────────────────────────────────────────
const POLYS = [
  [[-170,72],[-138,70],[-100,68],[-80,70],[-65,62],[-55,48],[-66,44],[-80,42],[-80,25],[-90,18],[-100,18],[-110,22],[-120,30],[-124,48],[-140,60],[-155,60],[-170,72]],
  [[-44,83],[-15,83],[-17,75],[-25,65],[-44,60],[-44,83]],
  [[-80,12],[-63,12],[-50,5],[-37,-5],[-35,-10],[-39,-18],[-42,-23],[-48,-28],[-53,-33],[-65,-55],[-68,-55],[-74,-50],[-62,-40],[-53,-33],[-45,-22],[-35,-5],[-50,5],[-63,12],[-80,12]],
  [[-12,36],[-5,36],[0,38],[8,36],[16,38],[28,38],[35,45],[30,60],[25,68],[15,72],[10,69],[5,60],[0,50],[-5,48],[-10,44],[-12,36]],
  [[5,58],[8,56],[12,57],[16,58],[22,60],[28,68],[30,72],[22,72],[14,68],[10,65],[5,58]],
  [[-5,50],[2,51],[2,58],[-4,58],[-6,56],[-5,50]],
  [[-24,63],[-13,63],[-13,66],[-24,66],[-24,63]],
  [[-17,16],[50,12],[44,8],[40,-2],[34,-18],[26,-34],[20,-35],[10,-22],[8,-2],[0,6],[-10,0],[-17,16]],
  [[26,38],[42,38],[55,45],[70,42],[80,70],[110,70],[138,65],[142,50],[132,35],[120,20],[105,10],[100,5],[100,-2],[110,-8],[125,2],[120,15],[90,25],[78,28],[60,24],[45,42],[42,38],[26,38]],
  [[130,31],[135,34],[142,38],[145,43],[141,44],[138,40],[130,34],[130,31]],
  [[116,-30],[136,-15],[150,-22],[155,-28],[155,-38],[148,-42],[140,-38],[130,-35],[118,-34],[116,-30]],
  [[170,-35],[178,-37],[176,-41],[168,-44],[170,-35]],
]

function pip(lon, lat, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function isEU(lon, lat) {
  return lon > -12 && lon < 32 && lat > 34 && lat < 71
}

function project(lon, lat, rotY, R, cx, cy) {
  const phi = lat * DEG
  const lam = (lon - rotY) * DEG
  const depth = Math.cos(phi) * Math.cos(lam)
  if (depth < -0.04) return null
  return { x: cx + R * Math.cos(phi) * Math.sin(lam), y: cy - R * Math.sin(phi), depth }
}

// Great-circle interpolation (SLERP)
function slerp(lon1, lat1, lon2, lat2, t) {
  const p1 = lat1 * DEG, l1 = lon1 * DEG
  const p2 = lat2 * DEG, l2 = lon2 * DEG
  const x1 = Math.cos(p1)*Math.cos(l1), y1 = Math.cos(p1)*Math.sin(l1), z1 = Math.sin(p1)
  const x2 = Math.cos(p2)*Math.cos(l2), y2 = Math.cos(p2)*Math.sin(l2), z2 = Math.sin(p2)
  const dot = Math.max(-1, Math.min(1, x1*x2 + y1*y2 + z1*z2))
  const om = Math.acos(dot)
  if (om < 0.001) return { lon: lon1, lat: lat1 }
  const s = Math.sin(om)
  const f1 = Math.sin((1-t)*om)/s, f2 = Math.sin(t*om)/s
  const x = f1*x1+f2*x2, y = f1*y1+f2*y2, z = f1*z1+f2*z2
  return { lon: Math.atan2(y,x)/DEG, lat: Math.asin(Math.max(-1,Math.min(1,z)))/DEG }
}

function hexRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

function seededRand(seed) {
  let v = seed
  return () => { v = (v * 1664525 + 1013904223) & 0xffffffff; return (v >>> 0) / 0xffffffff }
}

// ── Main component ────────────────────────────────────────────────
export default function GlobeView() {
  const canvasRef = useRef(null)
  const st = useRef({ rot: 0, t: 0, pins: [], hovId: null, shots: [], flashes: [], nextShot: 1.5 })
  const [hovered, setHovered] = useState(null)

  const dots = useMemo(() => {
    const res = []
    for (let lat = -84; lat <= 84; lat += 4)
      for (let lon = -180; lon <= 180; lon += 4)
        if (POLYS.some(p => pip(lon, lat, p)))
          res.push({ lon, lat, eu: isEU(lon, lat) })
    return res
  }, [])

  const stars = useMemo(() => {
    const rand = seededRand(137)
    return Array.from({ length: 360 }, () => ({
      x: rand(), y: rand(),
      r: 0.3 + rand() * 1.2,
      baseA: 0.1 + rand() * 0.75,
      phase: rand() * Math.PI * 2,
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const R = 185, CX = W/2, CY = H/2 + 6

    let active = true, frameId

    function spawnShot() {
      const ai = Math.floor(Math.random() * GLOBE_PROVIDERS.length)
      let bi = Math.floor(Math.random() * (GLOBE_PROVIDERS.length - 1))
      if (bi >= ai) bi++
      const a = GLOBE_PROVIDERS[ai], b = GLOBE_PROVIDERS[bi]
      st.current.shots.push({
        srcLon: a.lon, srcLat: a.lat,
        dstLon: b.lon, dstLat: b.lat,
        color: a.color, dstColor: b.color,
        progress: 0,
        speed: 0.22 + Math.random() * 0.16,
        flashed: false,
      })
    }

    function draw() {
      if (!active) return
      const s = st.current
      const dt = 0.016
      s.t += dt
      s.rot += 0.0028
      const rotY = s.rot * (180 / Math.PI)

      // ── Deep space background ────────────────────────────────
      ctx.fillStyle = '#030812'
      ctx.fillRect(0, 0, W, H)

      // ── Stars ─────────────────────────────────────────────────
      stars.forEach(st2 => {
        const tw = 0.55 + 0.45 * Math.sin(s.t * 1.4 + st2.phase)
        ctx.globalAlpha = st2.baseA * (0.5 + 0.5*tw)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.arc(st2.x*W, st2.y*H, st2.r, 0, Math.PI*2); ctx.fill()
      })
      ctx.globalAlpha = 1

      // ── Atmosphere corona ─────────────────────────────────────
      const corona = ctx.createRadialGradient(CX, CY, R+1, CX, CY, R+44)
      corona.addColorStop(0,   'rgba(30,90,255,0.32)')
      corona.addColorStop(0.45,'rgba(20,60,200,0.13)')
      corona.addColorStop(1,   'rgba(0,20,100,0)')
      ctx.fillStyle = corona
      ctx.beginPath(); ctx.arc(CX, CY, R+44, 0, Math.PI*2); ctx.fill()

      // ── Globe body ────────────────────────────────────────────
      const sphere = ctx.createRadialGradient(CX-R*0.28, CY-R*0.28, R*0.06, CX+R*0.1, CY+R*0.1, R*1.08)
      sphere.addColorStop(0,   '#1e4282')
      sphere.addColorStop(0.3, '#102050')
      sphere.addColorStop(0.65,'#070f2a')
      sphere.addColorStop(1,   '#030810')
      ctx.fillStyle = sphere
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.fill()

      // ── Clip to sphere for interior elements ─────────────────
      ctx.save()
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.clip()

      // Graticule
      ctx.strokeStyle = 'rgba(50,100,210,0.18)'; ctx.lineWidth = 0.5
      for (let lat = -75; lat <= 75; lat += 30) {
        ctx.beginPath(); let fp = true
        for (let lon = -180; lon <= 181; lon += 2) {
          const p = project(lon, lat, rotY, R, CX, CY)
          if (!p) { fp=true; continue }
          fp ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y); fp=false
        }
        ctx.stroke()
      }
      for (let lon = -165; lon <= 180; lon += 30) {
        ctx.beginPath(); let fp = true
        for (let lat = -85; lat <= 85; lat += 2) {
          const p = project(lon, lat, rotY, R, CX, CY)
          if (!p) { fp=true; continue }
          fp ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y); fp=false
        }
        ctx.stroke()
      }

      // Land dots
      dots.forEach(({ lon, lat, eu }) => {
        const p = project(lon, lat, rotY, R, CX, CY)
        if (!p) return
        const b = 0.45 + 0.55 * p.depth
        if (eu) {
          ctx.fillStyle = `rgba(80,160,255,${(b*0.72).toFixed(2)})`
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2); ctx.fill()
        } else {
          ctx.fillStyle = `rgba(38,88,160,${(b*0.58).toFixed(2)})`
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.0, 0, Math.PI*2); ctx.fill()
        }
      })

      // Always-on faint mesh arcs (great-circle paths clipped to globe)
      GLOBE_PROVIDERS.forEach((a, ai) => {
        GLOBE_PROVIDERS.forEach((b, bi) => {
          if (bi <= ai) return
          ctx.globalAlpha = 0.06; ctx.strokeStyle = '#5090ff'; ctx.lineWidth = 0.7
          ctx.beginPath(); let fp = true
          for (let k = 0; k <= 30; k++) {
            const gp = slerp(a.lon, a.lat, b.lon, b.lat, k/30)
            const pp = project(gp.lon, gp.lat, rotY, R, CX, CY)
            if (!pp) { fp=true; continue }
            fp ? ctx.moveTo(pp.x,pp.y) : ctx.lineTo(pp.x,pp.y); fp=false
          }
          ctx.stroke(); ctx.globalAlpha = 1
        })
      })

      ctx.restore() // end clip

      // ── Rim glow ──────────────────────────────────────────────
      ctx.shadowColor = '#2255ee'; ctx.shadowBlur = 20
      ctx.strokeStyle = 'rgba(70,140,255,0.38)'; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.stroke()
      ctx.shadowBlur = 0

      // ── Specular highlight ────────────────────────────────────
      const spec = ctx.createRadialGradient(CX-R*0.32, CY-R*0.32, 0, CX-R*0.25, CY-R*0.25, R*0.55)
      spec.addColorStop(0, 'rgba(255,255,255,0.12)')
      spec.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = spec
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI*2); ctx.fill()

      // ── Shooting arcs (comets) ────────────────────────────────
      s.shots = s.shots.filter(sh => sh.progress <= 1.08)
      s.shots.forEach(sh => {
        sh.progress += sh.speed * dt
        const prog = Math.min(sh.progress, 1)
        const TRAIL = 34

        for (let i = TRAIL; i >= 0; i--) {
          const tp = prog - (i/TRAIL) * 0.22
          if (tp < 0) continue
          const gp = slerp(sh.srcLon, sh.srcLat, sh.dstLon, sh.dstLat, Math.min(tp, 1))
          const pp = project(gp.lon, gp.lat, rotY, R, CX, CY)
          if (!pp) continue

          const frac = 1 - i/TRAIL        // 0 = tail, 1 = head
          const r    = 0.4 + frac * 3.5
          const a    = frac * frac * 0.92

          ctx.globalAlpha  = a
          ctx.shadowColor  = sh.color
          ctx.shadowBlur   = frac * 16
          ctx.fillStyle    = frac > 0.82 ? '#ffffff' : sh.color
          ctx.beginPath(); ctx.arc(pp.x, pp.y, r, 0, Math.PI*2); ctx.fill()
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0

        if (sh.progress >= 1 && !sh.flashed) {
          sh.flashed = true
          s.flashes.push({ lon: sh.dstLon, lat: sh.dstLat, color: sh.dstColor, age: 0 })
        }
      })

      // ── Impact flash rings ─────────────────────────────────────
      s.flashes = s.flashes.filter(f => f.age < 0.75)
      s.flashes.forEach(f => {
        f.age += dt
        const frac = f.age / 0.75
        const pp = project(f.lon, f.lat, rotY, R, CX, CY)
        if (!pp) return
        ctx.globalAlpha = (1-frac) * 0.9
        ctx.shadowColor = f.color; ctx.shadowBlur = 14
        ctx.strokeStyle = f.color
        ctx.lineWidth = (1-frac) * 2.5 + 0.4
        ctx.beginPath(); ctx.arc(pp.x, pp.y, frac*34, 0, Math.PI*2); ctx.stroke()
        ctx.globalAlpha = (1-frac)*0.35
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.arc(pp.x, pp.y, frac*54, 0, Math.PI*2); ctx.stroke()
        ctx.globalAlpha = 1; ctx.shadowBlur = 0
      })

      // ── Provider pins ─────────────────────────────────────────
      const pins = []
      GLOBE_PROVIDERS.forEach(prov => {
        const proj = project(prov.lon, prov.lat, rotY, R, CX, CY)
        if (!proj || proj.depth < 0.02) return
        const { x, y, depth } = proj
        const isHov = s.hovId === prov.id
        const pulse  = 1 + 0.28 * Math.sin(s.t * 2.6 + prov.lon * 0.08)
        pins.push({ ...prov, x, y })

        // Outer halo rings
        ctx.shadowColor = prov.color; ctx.shadowBlur = isHov ? 24 : 14
        ctx.globalAlpha = isHov ? 0.8 : (0.20 + 0.18 * Math.sin(s.t*2.6 + prov.lon*0.08))
        ctx.strokeStyle = prov.color; ctx.lineWidth = isHov ? 1.5 : 1
        ctx.beginPath(); ctx.arc(x, y, (isHov?19:13)*pulse, 0, Math.PI*2); ctx.stroke()
        ctx.globalAlpha = isHov ? 0.45 : 0.12
        ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.arc(x, y, (isHov?11:7.5)*pulse, 0, Math.PI*2); ctx.stroke()
        ctx.globalAlpha = 1

        // Pin body
        ctx.shadowBlur = isHov ? 22 : 14
        ctx.fillStyle = prov.color
        ctx.beginPath(); ctx.arc(x, y, isHov ? 7 : 5, 0, Math.PI*2); ctx.fill()
        ctx.shadowBlur = 0
        // White-hot core
        ctx.fillStyle = isHov ? '#ffffff' : 'rgba(255,255,255,0.88)'
        ctx.beginPath(); ctx.arc(x, y, isHov ? 3 : 1.8, 0, Math.PI*2); ctx.fill()

        // Label
        if (depth > 0.1) {
          const right = x >= CX
          const lx = right ? x + 14 : x - 14
          ctx.textAlign = right ? 'left' : 'right'
          ctx.shadowColor = '#000000'; ctx.shadowBlur = 6
          ctx.font = '700 11px Inter,system-ui,sans-serif'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(prov.name, lx, y + 1)
          ctx.font = '500 9px Inter,system-ui,sans-serif'
          ctx.fillStyle = hexRgba(prov.color, 0.92)
          ctx.fillText(`€${prov.price.toFixed(3)}/h`, lx, y + 13)
          ctx.shadowBlur = 0
        }
      })
      s.pins = pins

      // ── Shot spawn ────────────────────────────────────────────
      s.nextShot -= dt
      if (s.nextShot <= 0) {
        spawnShot()
        s.nextShot = 1.0 + Math.random() * 2.2
      }

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
    return () => { active = false; cancelAnimationFrame(frameId) }
  }, [dots, stars])

  function handleMouseMove(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const sx = canvasRef.current.width / rect.width
    const sy = canvasRef.current.height / rect.height
    const mx = (e.clientX - rect.left) * sx
    const my = (e.clientY - rect.top) * sy
    let found = null
    for (const pin of st.current.pins)
      if ((mx-pin.x)**2 + (my-pin.y)**2 < 625) { found = pin; break }
    st.current.hovId = found?.id ?? null
    setHovered(found || null)
  }
  function handleMouseLeave() { st.current.hovId = null; setHovered(null) }

  return (
    <div style={{ display:'flex', gap:24, background:'#060916', borderRadius:14, padding:'22px 26px', border:'1px solid #141e38', boxShadow:'0 8px 48px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)', alignItems:'flex-start' }}>
      <div style={{ position:'relative', flexShrink:0 }}>
        <canvas
          ref={canvasRef} width={460} height={440}
          style={{ borderRadius:10, display:'block', cursor: hovered ? 'crosshair' : 'default' }}
          onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        />
        <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:14, alignItems:'center', background:'rgba(3,8,18,0.78)', backdropFilter:'blur(8px)', borderRadius:20, padding:'4px 16px', border:'1px solid rgba(60,120,255,0.18)', whiteSpace:'nowrap' }}>
          <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.82)', letterSpacing:'0.10em' }}>EU CLOUD PROVIDERS</span>
          <span style={{ width:1, height:10, background:'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.82)', letterSpacing:'0.10em' }}>HOVER PIN FOR SPECS</span>
        </div>
      </div>
      <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
        {hovered ? <PinCard prov={hovered} /> : <PinLegend />}
      </div>
    </div>
  )
}

function PinCard({ prov }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${hexRgba(prov.color,0.22)}` }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:prov.color, boxShadow:`0 0 12px ${prov.color}`, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'1rem', fontWeight:700, color:'#eef5ff' }}>{prov.name}</div>
          <div style={{ fontSize:'0.65rem', color:'#6a96b8', marginTop:2 }}>{prov.region}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'1.3rem', fontWeight:800, color:prov.color }}>{`€${prov.price.toFixed(3)}`}</div>
          <div style={{ fontSize:'0.58rem', color:'#5a7ea0' }}>per hour</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 22px', marginBottom:18 }}>
        {[
          ['Instance',    prov.instance],
          ['vCPU',        `${prov.vcpu} virtual cores`],
          ['Memory',      `${prov.ram} GB RAM`],
          ['Sovereignty', prov.eu ? 'EU / GAIA-X aligned' : 'Non-EU (reference)'],
          ['Monthly est.',`€${(prov.price*730).toFixed(0)} / month`],
          ['OS',          'Ubuntu 22.04 LTS'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize:'0.58rem', color:'#2d4460', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:3 }}>{k}</div>
            <div style={{ fontSize:'0.8rem', fontWeight:600, color: k==='Sovereignty' && !prov.eu ? '#f87171' : '#c4dcff' }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:'rgba(20,40,100,0.3)', borderRadius:8, padding:'10px 14px', border:'1px solid rgba(60,120,255,0.18)' }}>
        <div style={{ fontSize:'0.58rem', color:'#2d4460', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:8 }}>Benchmark profiles</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['pts/stream','pts/hint','pts/compress-7zip','pts/postmark','pts/apache','iperf3'].map(tag => (
            <span key={tag} style={{ fontSize:'0.66rem', background:'rgba(60,120,255,0.12)', color:prov.color, padding:'2px 8px', borderRadius:4, border:`1px solid ${hexRgba(prov.color,0.22)}`, fontFamily:'monospace' }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PinLegend() {
  return (
    <div>
      <div style={{ marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#c4dcff', marginBottom:5 }}>6 Providers · 2 vCPU / 8 GB tier</div>
        <div style={{ fontSize:'0.65rem', color:'#7eadd4', lineHeight:1.75 }}>
          Providers distributed across the globe for visual clarity. All datacenters are in Western Europe. Shooting arcs represent inter-provider signal paths — hover a pin for full instance specs.
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {GLOBE_PROVIDERS.map(p => (
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 13px', background:'rgba(255,255,255,0.025)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:p.color, boxShadow:`0 0 8px ${p.color}88`, flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'0.77rem', fontWeight:600, color:'#deeeff' }}>{p.name}</div>
              <div style={{ fontSize:'0.62rem', color:'#6a96b8', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.instance} · {p.region}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'0.77rem', fontWeight:700, color:p.color }}>{`€${p.price.toFixed(3)}`}</div>
              <div style={{ fontSize:'0.54rem', color:'#5a7ea0' }}>/hr</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
