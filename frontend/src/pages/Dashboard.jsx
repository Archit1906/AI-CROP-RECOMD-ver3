import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ── FONTS ────────────────────────────────────────────────────
// Add to index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Satoshi:wght@400;500;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">

// ── TYPED HOOK ───────────────────────────────────────────────
function useTyped(texts, speed = 50) {
  const [idx,       setIdx]       = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    const current = texts[idx]
    if (!deleting && displayed === current) {
      const t = setTimeout(() => setDeleting(true), 2500)
      return () => clearTimeout(t)
    }
    if (deleting && displayed === '') {
      setDeleting(false)
      setIdx(i => (i + 1) % texts.length)
      return
    }
    const t = setTimeout(() => {
      setDisplayed(deleting
        ? current.slice(0, displayed.length - 1)
        : current.slice(0, displayed.length + 1)
      )
    }, deleting ? speed / 2 : speed)
    return () => clearTimeout(t)
  }, [displayed, deleting, idx, texts, speed])

  return displayed
}

// ── COUNTER ──────────────────────────────────────────────────
function Counter({ target, suffix = '', prefix = '', duration = 2000, active }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start   = 0
    const step  = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])
  return <>{prefix}{count.toLocaleString()}{suffix}</>
}

// ── WHEAT FIELD SVG HERO ─────────────────────────────────────
function WheatHero() {
  const [time,     setTime]     = useState(0)
  const [mouse,    setMouse]    = useState({ x: 0.5, y: 0.5 })
  const [smoothMouse, setSmoothMouse] = useState({ x: 0.5, y: 0.5 })
  const mouseRef   = useRef({ x: 0.5, y: 0.5 })
  const smoothRef  = useRef({ x: 0.5, y: 0.5 })
  const frameRef   = useRef(null)

  // Track mouse position normalized 0-1
  useEffect(() => {
    const handleMove = (e) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  // Animation loop — time + smooth mouse interpolation
  useEffect(() => {
    let t = 0
    const loop = () => {
      t += 0.012
      setTime(t)

      // Smooth mouse lerp — 4% per frame = silky lag
      smoothRef.current = {
        x: smoothRef.current.x + (mouseRef.current.x - smoothRef.current.x) * 0.04,
        y: smoothRef.current.y + (mouseRef.current.y - smoothRef.current.y) * 0.04,
      }
      setSmoothMouse({ ...smoothRef.current })

      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const mx = smoothMouse.x  // 0 = left, 1 = right
  const my = smoothMouse.y  // 0 = top,  1 = bottom

  // More stalks — 48 instead of 32 to fill full width
  const stalks = Array.from({ length: 48 }, (_, i) => {
    const x        = (i / 47) * 100        // spans full 0–100
    const delay    = i * 0.1
    const height   = 52 + Math.sin(i * 1.7) * 18 + Math.cos(i * 0.9) * 8

    // Base wind sway
    const windSway = Math.sin(time + delay) * 3.5 + Math.sin(time * 0.6 + delay * 0.5) * 1.5

    // Mouse parallax — stalks near mouse lean toward it
    // Depth layers: every 3rd stalk is "closer" = more parallax
    const depth    = i % 3 === 0 ? 1.0 : i % 2 === 0 ? 0.6 : 0.35
    const mousePush = (mx - 0.5) * 12 * depth   // -6 to +6 range
    const mouseY    = (my - 0.5) * 4  * depth   // slight vertical

    const totalSway = windSway + mousePush
    const baseY     = 90 + mouseY
    const tipX      = x + totalSway
    const tipY      = baseY - height

    const ctrl1X  = x  + totalSway * 0.25
    const ctrl1Y  = baseY - height * 0.35
    const ctrl2X  = x  + totalSway * 0.65
    const ctrl2Y  = baseY - height * 0.72

    const thick   = i % 3 === 0 ? 1.6 : i % 2 === 0 ? 1.2 : 0.9
    const opacity = 0.5 + depth * 0.35 + Math.sin(time + i) * 0.1

    return { x, tipX, tipY, ctrl1X, ctrl1Y, ctrl2X, ctrl2Y,
             baseY, thick, height, totalSway, delay, depth, opacity }
  })

  // Data nodes — also shift with mouse for 3D effect
  const dataNodes = [
    { bx:8,  by:30, label:'93%',  sub:'ACCURACY',    color:'var(--secondary)', depth:0.8 },
    { bx:22, by:18, label:'22',   sub:'CROP TYPES',  color:'#A3E635', depth:0.5 },
    { bx:50, by:12, label:'38',   sub:'DISEASES',    color:'var(--primary)', depth:1.0 },
    { bx:75, by:20, label:'3',    sub:'LANGUAGES',   color:'var(--tertiary)', depth:0.4 },
    { bx:88, by:32, label:'500+', sub:'MANDIS',      color:'#FDE047', depth:0.7 },
    { bx:35, by:55, label:'140M', sub:'FARMERS',     color:'var(--primary)', depth:0.3 },
    { bx:65, by:50, label:'85%',  sub:'DISEASE ACC', color:'var(--secondary)', depth:0.6 },
  ].map(n => ({
    ...n,
    x: n.bx + (mx - 0.5) * 8 * n.depth,
    y: n.by + (my - 0.5) * 5 * n.depth,
  }))

  return (
    <div style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%'
    }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"  // ← SLICE fills entire container
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15803D" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#052e16" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor='var(--bg)' />
            <stop offset="55%" stopColor='var(--bg-card)' stopOpacity="0.5" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="stalkGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#052e16" />
            <stop offset="40%"  stopColor="#166534" />
            <stop offset="80%"  stopColor='var(--primary)' />
            <stop offset="100%" stopColor='var(--secondary)' />
          </linearGradient>
          <linearGradient id="stalkGrad2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#052e16" />
            <stop offset="50%"  stopColor="#15803D" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor='var(--primary)' stopOpacity="0" />
            <stop offset="50%"  stopColor='var(--primary)' stopOpacity="0.15" />
            <stop offset="100%" stopColor='var(--primary)' stopOpacity="0" />
          </linearGradient>
          <radialGradient id="mouseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor='var(--primary)' stopOpacity="0.12" />
            <stop offset="100%" stopColor='var(--primary)' stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="100" height="100" fill="url(#sky)" />

        {/* Mouse-following atmospheric glow */}
        <ellipse
          cx={mx * 100}
          cy={my * 100}
          rx="35" ry="25"
          fill="url(#mouseGlow)"
          opacity="0.8"
        />

        {/* Horizon atmospheric glow */}
        <ellipse cx="50" cy="92"
          rx={60 + mx * 10}
          ry={18 + Math.sin(time * 0.5) * 3}
          fill='var(--primary)'
          opacity={0.05 + Math.sin(time * 0.4) * 0.02}
        />

        {/* Distant mountains / treeline — parallax layer 1 (slow) */}
        {Array.from({ length: 24 }, (_, i) => {
          const tx = i * 4.5 + (mx - 0.5) * 3   // subtle shift
          const th = 6 + Math.sin(i * 1.9) * 3
          return (
            <ellipse key={i}
              cx={tx} cy={88 - th / 2}
              rx={3} ry={th / 2}
              fill="#052e16" opacity="0.7" />
          )
        })}

        {/* Mid treeline — parallax layer 2 */}
        {Array.from({ length: 18 }, (_, i) => {
          const tx = i * 6 + 2 + (mx - 0.5) * 6
          const th = 10 + Math.sin(i * 2.3) * 4
          return (
            <ellipse key={i}
              cx={tx} cy={88 - th / 2}
              rx={2} ry={th / 2}
              fill='var(--bg-card)' opacity="0.9" />
          )
        })}

        {/* Ground */}
        <rect x="-5" y="86" width="110" height="20" fill="url(#ground)" />

        {/* Ground texture */}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i}
            x1="-5" y1={87.5 + i * 1.8}
            x2="105" y2={87.5 + i * 1.8}
            stroke='var(--primary)' strokeWidth="0.06" opacity="0.2" />
        ))}

        {/* Underground root network */}
        {Array.from({ length: 10 }, (_, i) => {
          const rx   = 5 + i * 9.5 + (mx - 0.5) * 2
          const flow = (time * 0.25 + i * 0.35) % 1
          return (
            <g key={i} opacity="0.2">
              <path d={`M${rx} 87 Q${rx+6} 93 ${rx+4} 100`}
                fill="none" stroke='var(--primary)' strokeWidth="0.25"
                strokeDasharray="2.5 2" strokeDashoffset={-flow * 4.5} />
              <path d={`M${rx} 87 Q${rx-5} 94 ${rx-7} 100`}
                fill="none" stroke="var(--primary)" strokeWidth="0.18"
                strokeDasharray="2 2.5" strokeDashoffset={-flow * 3.5} />
              <path d={`M${rx} 88 Q${rx+2} 95 ${rx} 100`}
                fill="none" stroke="#15803D" strokeWidth="0.15"
                strokeDasharray="1.5 3" strokeDashoffset={-flow * 5} />
            </g>
          )
        })}

        {/* Back row stalks — furthest layer, least parallax */}
        {stalks.filter((_, i) => i % 3 === 2).map((s, i) => (
          <g key={`back-${i}`} opacity={s.opacity * 0.5}>
            <path
              d={`M${s.x - 1} ${s.baseY + 2}
                  C${s.ctrl1X - 1} ${s.ctrl1Y + 4}
                   ${s.ctrl2X - 1} ${s.ctrl2Y + 2}
                   ${s.tipX - 1} ${s.tipY + 4}`}
              fill="none" stroke="url(#stalkGrad2)"
              strokeWidth={s.thick * 0.7} strokeLinecap="round"
            />
          </g>
        ))}

        {/* Mid row stalks */}
        {stalks.filter((_, i) => i % 3 === 1).map((s, i) => (
          <g key={`mid-${i}`} filter="url(#softGlow)">
            <path
              d={`M${s.x} ${s.baseY}
                  C${s.ctrl1X} ${s.ctrl1Y}
                   ${s.ctrl2X} ${s.ctrl2Y}
                   ${s.tipX} ${s.tipY}`}
              fill="none" stroke="url(#stalkGrad)"
              strokeWidth={s.thick} strokeLinecap="round"
              opacity={s.opacity}
            />
            {/* Grain head */}
            {Array.from({ length: 5 }, (_, gi) => {
              const ga = (gi / 5) * Math.PI
              const gx = s.tipX + Math.cos(ga - Math.PI/2) * 1.0
              const gy = s.tipY + Math.sin(ga - Math.PI/2) * 1.5
              return (
                <ellipse key={gi} cx={gx} cy={gy}
                  rx={0.35} ry={0.7}
                  fill={gi % 2 === 0 ? '#FDE047' : '#A3E635'}
                  opacity={0.55 + Math.sin(time + i + gi) * 0.2}
                  transform={`rotate(${s.totalSway * 6 + gi * 36}, ${gx}, ${gy})`}
                />
              )
            })}
          </g>
        ))}

        {/* Front row stalks — closest, most parallax */}
        {stalks.filter((_, i) => i % 3 === 0).map((s, i) => (
          <g key={`front-${i}`} filter="url(#glow)">
            <path
              d={`M${s.x} ${s.baseY}
                  C${s.ctrl1X} ${s.ctrl1Y}
                   ${s.ctrl2X} ${s.ctrl2Y}
                   ${s.tipX} ${s.tipY}`}
              fill="none" stroke="url(#stalkGrad)"
              strokeWidth={s.thick * 1.2} strokeLinecap="round"
              opacity={s.opacity}
            />
            {/* Larger grain head on front stalks */}
            {Array.from({ length: 7 }, (_, gi) => {
              const ga = (gi / 7) * Math.PI
              const gx = s.tipX + Math.cos(ga - Math.PI/2) * 1.4
              const gy = s.tipY + Math.sin(ga - Math.PI/2) * 2.0
              return (
                <ellipse key={gi} cx={gx} cy={gy}
                  rx={0.45} ry={0.9}
                  fill={gi % 3 === 0 ? '#FDE047' : gi % 3 === 1 ? '#A3E635' : 'var(--primary)'}
                  opacity={0.65 + Math.sin(time + i + gi) * 0.2}
                  transform={`rotate(${s.totalSway * 8 + gi * 51}, ${gx}, ${gy})`}
                />
              )
            })}
            {/* Leaf blade */}
            <path
              d={`M${s.ctrl2X} ${s.ctrl2Y}
                  Q${s.ctrl2X + 5 * Math.cos(time * 0.8 + i) + (mx-0.5)*3}
                   ${s.ctrl2Y - 2.5}
                   ${s.ctrl2X + 7 * Math.cos(time * 0.8 + i) + (mx-0.5)*4}
                   ${s.ctrl2Y - 0.5}`}
              fill="none" stroke='var(--primary)'
              strokeWidth="0.7" opacity="0.45"
            />
          </g>
        ))}

        {/* Floating pollen — mouse-affected drift */}
        {Array.from({ length: 30 }, (_, i) => {
          const drift = (mx - 0.5) * 15
          const px = ((-5 + i * 7.2 + time * (4 + i % 3 * 2) + drift * (i % 4 * 0.5)) % 110 + 110) % 110 - 5
          const py = 10 + ((i * 11.3 + time * (2 + i % 3)) % 75)
          const ps = 0.12 + (i % 5) * 0.06
          const colors = ['#A3E635', 'var(--secondary)', '#FDE047', 'var(--primary)', 'var(--tertiary)']
          return (
            <circle key={i} cx={px} cy={py} r={ps}
              fill={colors[i % 5]}
              opacity={0.15 + Math.sin(time * 1.5 + i) * 0.12}
            />
          )
        })}

        {/* Scan line */}
        <rect
          x="-5"
          y={((time * 12) % 110) - 10}
          width="110" height="10"
          fill="url(#scan)" opacity="0.5"
        />

        {/* Data connection network */}
        {dataNodes.map((node, i) =>
          dataNodes.slice(i + 1).map((other, j) => {
            const dist = Math.hypot(node.x - other.x, node.y - other.y)
            if (dist > 45) return null
            const flow = (time * 0.4 + i * 0.3 + j * 0.2) % 1
            return (
              <line key={`conn-${i}-${j}`}
                x1={node.x} y1={node.y}
                x2={other.x} y2={other.y}
                stroke='var(--primary)'
                strokeWidth="0.15"
                opacity={0.15 + Math.sin(time * 0.8 + i) * 0.1}
                strokeDasharray="1.5 2.5"
                strokeDashoffset={-flow * 4}
              />
            )
          })
        )}

        {/* Data nodes with mouse parallax */}
        {dataNodes.map((node, i) => {
          const r = 2.5 + Math.sin(time * 1.8 + i * 0.7) * 0.8
          return (
            <g key={i} filter="url(#nodeGlow)">
              {/* Outer ring */}
              <circle cx={node.x} cy={node.y}
                r={r + 2 + Math.sin(time + i) * 0.5}
                fill="none" stroke={node.color}
                strokeWidth="0.15"
                opacity={0.25 + Math.sin(time * 1.2 + i) * 0.1}
              />
              {/* Mid ring */}
              <circle cx={node.x} cy={node.y} r={r}
                fill={node.color} opacity="0.1"
              />
              {/* Core */}
              <circle cx={node.x} cy={node.y} r="1"
                fill={node.color} opacity="0.9"
              />
              {/* Crosshair */}
              <line x1={node.x-3} y1={node.y} x2={node.x+3} y2={node.y}
                stroke={node.color} strokeWidth="0.12" opacity="0.4" />
              <line x1={node.x} y1={node.y-3} x2={node.x} y2={node.y+3}
                stroke={node.color} strokeWidth="0.12" opacity="0.4" />
              {/* Label */}
              <text x={node.x + 2.5} y={node.y - 0.8}
                fill={node.color} fontSize="2.6" fontWeight="700"
                fontFamily="'Share Tech Mono'" opacity="0.95">
                {node.label}
              </text>
              <text x={node.x + 2.5} y={node.y + 2.2}
                fill={node.color} fontSize="1.4"
                fontFamily="'Share Tech Mono'" opacity="0.55">
                {node.sub}
              </text>
            </g>
          )
        })}

        {/* Edge vignette — full coverage */}
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="100%" stopColor='var(--bg)' stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#vignette)" />

        {/* HUD corners */}
        {[[2,2],[98,2],[2,98],[98,98]].map(([cx,cy],i) => {
          const sx = cx < 50 ? 1 : -1
          const sy = cy < 50 ? 1 : -1
          return (
            <g key={i} stroke='var(--primary)' strokeWidth="0.35" opacity="0.35">
              <line x1={cx} y1={cy} x2={cx+sx*6} y2={cy} />
              <line x1={cx} y1={cy} x2={cx}        y2={cy+sy*6} />
            </g>
          )
        })}

        {/* Bottom HUD */}
        <rect x="0" y="97.5" width="100" height="0.2"
          fill='var(--primary)' opacity="0.2" />
        <text x="2" y="99.5" fill='var(--primary)'
          fontSize="1.3" fontFamily="'Share Tech Mono'" opacity="0.3">
          // ECO INTELLIGENCE // AMRITKRISHI v2.0 // ALL SYSTEMS ACTIVE
        </text>

        {/* Live dot top right */}
        <circle cx="97" cy="3" r="0.7"
          fill='var(--secondary)'
          opacity={0.5 + Math.sin(time * 4) * 0.4}
        />
        <text x="98.5" y="4" fill='var(--secondary)'
          fontSize="1.6" fontFamily="'Share Tech Mono'" opacity="0.6">
          LIVE
        </text>
      </svg>
    </div>
  )
}


// ── FEATURE CARD ─────────────────────────────────────────────
function FeatureCard({ icon, title, desc, stat, statLabel, color, path, index, navigate }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(path)}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        background:    'linear-gradient(145deg, var(--bg-card), #0A2010)',
        border:        `1px solid ${color}22`,
        borderTop:     `2px solid ${color}`,
        borderRadius:  16,
        padding:       28,
        cursor:        'pointer',
        position:      'relative',
        overflow:      'hidden',
      }}>

      {/* Background gradient blob */}
      <div style={{
        position:  'absolute', top: -20, right: -20,
        width:     120, height: 120,
        background: `radial-gradient(circle, ${color}08, transparent)`,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Icon */}
      <div style={{
        width: 52, height: 52,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, marginBottom: 16
      }}>
        {icon}
      </div>

      <h3 style={{
        fontFamily:    "'Cabinet Grotesk', sans-serif",
        fontSize:      18,
        fontWeight:    800,
        color:         'var(--text-primary)',
        margin:        '0 0 8px',
        letterSpacing: 0.5
      }}>
        {title}
      </h3>

      <p style={{
        fontFamily:  "'Satoshi', sans-serif",
        fontSize:    14,
        color:       'var(--text-second)',
        lineHeight:  1.7,
        margin:      '0 0 20px'
      }}>
        {desc}
      </p>

      {/* Stat */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily:    "'Cabinet Grotesk', sans-serif",
          fontSize:      28,
          fontWeight:    900,
          color:         color,
          textShadow:    `0 0 20px ${color}60`
        }}>
          {stat}
        </span>
        <span style={{
          fontFamily:  "'Share Tech Mono'",
          fontSize:    10,
          color:       `${color}80`,
          letterSpacing: 2,
          textTransform: 'uppercase'
        }}>
          {statLabel}
        </span>
      </div>

      {/* Arrow */}
      <motion.div
        style={{
          position:   'absolute', bottom: 20, right: 20,
          color:      `${color}60`,
          fontSize:   18,
          fontFamily: "'Share Tech Mono'"
        }}
        whileHover={{ x: 4, opacity: 1 }}>
        →
      </motion.div>
    </motion.div>
  )
}

// ── STAT BLOCK ───────────────────────────────────────────────
function StatBlock({ value, suffix, prefix, label, sublabel, color, index }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily:    "'Cabinet Grotesk', sans-serif",
        fontSize:      52,
        fontWeight:    900,
        color:         color,
        lineHeight:    1,
        textShadow:    `0 0 30px ${color}50`,
        marginBottom:  8
      }}>
        <Counter
          target={parseInt(value)}
          suffix={suffix}
          prefix={prefix}
          active={inView}
        />
      </div>
      <div style={{
        fontFamily:    "'Satoshi', sans-serif",
        fontSize:      14,
        fontWeight:    700,
        color:         'var(--text-primary)',
        marginBottom:  4,
        letterSpacing: 0.5
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Share Tech Mono'",
        fontSize:   10,
        color:      'rgba(110,231,183,0.4)',
        letterSpacing: 2
      }}>
        {sublabel}
      </div>
    </motion.div>
  )
}

// ── TESTIMONIAL ──────────────────────────────────────────────
function TestimonialCard({ quote, name, location, crop, index }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      style={{
        background:    'linear-gradient(145deg, var(--bg-card), var(--bg-deep))',
        border:        '1px solid var(--border)',
        borderRadius:  16,
        padding:       28,
        position:      'relative',
      }}>
      {/* Quote mark */}
      <div style={{
        position:   'absolute', top: 16, right: 20,
        fontFamily: "'Cabinet Grotesk'",
        fontSize:   80, fontWeight: 900,
        color:      'rgba(34,197,94,0.08)',
        lineHeight: 1
      }}>
        "
      </div>

      {/* Leaf accent */}
      <div style={{ fontSize: 20, marginBottom: 14 }}>🌿</div>

      <p style={{
        fontFamily: "'Satoshi', sans-serif",
        fontSize:   15, lineHeight: 1.8,
        color:      'rgba(134,239,172,0.85)',
        margin:     '0 0 20px',
        fontStyle:  'italic'
      }}>
        "{quote}"
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{
            fontFamily: "'Cabinet Grotesk'",
            fontSize:   15, fontWeight: 700,
            color:      'var(--secondary)'
          }}>
            {name}
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono'",
            fontSize:   10, color: 'rgba(74,222,128,0.5)',
            letterSpacing: 1
          }}>
            {location}
          </div>
        </div>
        <div style={{
          background:    'rgba(34,197,94,0.1)',
          border:        '1px solid var(--primary-glow)',
          borderRadius:  8, padding:       '4px 10px',
          fontFamily:    "'Share Tech Mono'",
          fontSize:      10, color:         'var(--secondary)',
          letterSpacing: 1
        }}>
          {crop}
        </div>
      </div>
    </motion.div>
  )
}

// ── MAIN DASHBOARD ───────────────────────────────────────────
export default function Dashboard() {
  const navigate     = useNavigate()
  const { scrollY }  = useScroll()
  const heroY        = useTransform(scrollY, [0, 700], [0, -160])
  const heroScale    = useTransform(scrollY, [0, 700], [1, 1.08])
  const heroOp       = useTransform(scrollY, [0, 500], [1, 0])

  const typedText = useTyped([
    'Know what to grow before the season starts.',
    'Detect disease in seconds, not days.',
    'Sell at peak price — every time.',
    'Get every government subsidy you deserve.',
    'Farm smarter. Earn more.',
  ], 45)

  const FEATURES = [
    {
      icon:'🌾', color:'var(--primary)', path:'/crop',
      title:'AI Crop Recommendation',
      desc:'Select your state and district. Our AI analyzes live soil and weather data to recommend the highest-yield crop with full farming guide.',
      stat:'93%', statLabel:'accuracy'
    },
    {
      icon:'🔬', color:'var(--secondary)', path:'/disease',
      title:'Plant Disease Scanner',
      desc:'Upload a leaf photo. Our MobileNetV2 neural network identifies 38 disease classes across 12 crops and delivers instant treatment protocol.',
      stat:'38', statLabel:'diseases detected'
    },
    {
      icon:'🌤️', color:'var(--tertiary)', path:'/weather',
      title:'Weather Intelligence',
      desc:'Live weather for every Indian city with farming-specific alerts — drought warnings, frost risk, fungal conditions, and optimal sowing windows.',
      stat:'7-day', statLabel:'forecast'
    },
    {
      icon:'📊', color:'#FDE047', path:'/market',
      title:'Live Mandi Prices',
      desc:'Real-time crop prices from 500+ mandis across India. Price trend analytics, best-time-to-sell signals, and AI price prediction.',
      stat:'500+', statLabel:'mandis covered'
    },
    {
      icon:'🤖', color:'#A3E635', path:'/chat',
      title:'AI Farming Assistant',
      desc:'Ask anything in Tamil, Hindi, or English. Powered by Google Gemini — context-aware responses tailored to Indian agriculture.',
      stat:'3', statLabel:'languages'
    },
    {
      icon:'🏛️', color:'#6EE7B7', path:'/schemes',
      title:'Government Schemes',
      desc:'Discover 15+ schemes including PM-KISAN, PMFBY, and state programs. Eligibility checker with real-time deadline countdown.',
      stat:'₹6000+', statLabel:'avg benefit/yr'
    },
  ]

  const STATS = [
    { value:'140', suffix:'M+', prefix:'',  label:'Indian Farmers',    sublabel:'TARGET USERS',      color:'var(--primary)'  },
    { value:'93',  suffix:'%',  prefix:'',  label:'Crop AI Accuracy',  sublabel:'RANDOM FOREST MODEL', color:'var(--secondary)' },
    { value:'85',  suffix:'%',  prefix:'',  label:'Disease Detection', sublabel:'MOBILENETV2 CNN',    color:'var(--tertiary)'  },
    { value:'500', suffix:'+',  prefix:'',  label:'Mandi Locations',   sublabel:'LIVE PRICE FEEDS',   color:'#FDE047'  },
  ]

  const TESTIMONIALS = [
    {
      quote: "AmritKrishi told me to plant Turmeric instead of Rice this season. My profit tripled. I had never heard of this crop before.",
      name:  "Murugan K.",
      location: "Dindigul, Tamil Nadu",
      crop: "🌿 Turmeric"
    },
    {
      quote: "My tomatoes were dying and I didn't know why. I took a photo, uploaded it, and within 10 seconds it told me it was Early Blight and exactly what to spray.",
      name:  "Priya Devi",
      location: "Nashik, Maharashtra",
      crop: "🍅 Tomato"
    },
    {
      quote: "I was selling my onions at ₹800 per quintal. AmritKrishi showed me the price was ₹1,400 in the next district. I drove there and made ₹40,000 more.",
      name:  "Ramesh Patel",
      location: "Ahmedabad, Gujarat",
      crop: "🧅 Onion"
    },
  ]

  return (
    <div style={{ background: 'var(--bg)', overflowX: 'hidden', fontFamily: "'Satoshi', sans-serif" }}>

      {/* ── HERO SECTION ─────────────────────────────────── */}
            <section style={{
        minHeight:  '100vh',
        position:   'relative',
        overflow:   'hidden',
        display:    'flex',
        flexDirection: 'column'
      }}>

        {/* Wheat field — fixed position, fills entire hero */}
        <div style={{
          position: 'absolute',
          inset: 0,          // ← covers 0,0 to 100%,100% exactly
          zIndex: 0
        }}>
          <WheatHero />
        </div>

        {/* Remove the motion.div with heroY/heroScale on the wheat field */}
        {/* Keep parallax only on the text content below */}

        {/* Vignette overlays */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, var(--bg) 100%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 100, zIndex: 1,
          background: 'linear-gradient(180deg, var(--bg) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 160, zIndex: 1,
          background: 'linear-gradient(0deg, var(--bg) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        {/* Hero text content — sits above field */}
        <motion.div style={{ y: heroY, opacity: heroOp, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '120px 40px 80px', textAlign: 'center' }}>

          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           8,
              background:    'rgba(34,197,94,0.1)',
              border:        '1px solid var(--border-hover)',
              borderRadius:  100,
              padding:       '6px 16px',
              marginBottom:  28
            }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--secondary)',
              boxShadow: '0 0 8px var(--secondary)',
              animation: 'pulse 2s ease infinite',
              display: 'block'
            }} />
            <span style={{
              fontFamily:    "'Share Tech Mono'",
              fontSize:      11,
              color:         'var(--secondary)',
              letterSpacing: 2
            }}>
              ECO INTELLIGENCE SYSTEM // ACTIVE
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily:    "'Cabinet Grotesk', sans-serif",
              fontSize:      'clamp(42px, 7vw, 88px)',
              fontWeight:    900,
              lineHeight:    1.05,
              letterSpacing: -2,
              margin:        '0 0 20px',
              maxWidth:      900
            }}>
            <span style={{
              background:    'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 40%, #A3E635 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              AI Farming
            </span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>
              for Every Indian
            </span>
            <br />
            <span style={{
              background:    'linear-gradient(135deg, #FDE047 0%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Farmer.
            </span>
          </motion.h1>

          {/* Typed subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ height: 32, marginBottom: 40 }}>
            <p style={{
              fontFamily:    "'Satoshi', sans-serif",
              fontSize:      'clamp(16px, 2vw, 20px)',
              color:         'rgba(134,239,172,0.8)',
              margin:        0, fontWeight: 500
            }}>
              {typedText}
              <span style={{
                display: 'inline-block', width: 2, height: '1em',
                background: 'var(--secondary)', marginLeft: 3,
                animation: 'blink 0.8s step-end infinite',
                verticalAlign: 'middle'
              }} />
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>

            <motion.button
              onClick={() => navigate('/crop')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding:       '16px 36px',
                background:    'linear-gradient(135deg, var(--primary), var(--primary))',
                border:        'none',
                borderRadius:  12,
                color:         'var(--bg)',
                fontFamily:    "'Cabinet Grotesk', sans-serif",
                fontSize:      16, fontWeight: 800,
                cursor:        'pointer',
                boxShadow:     '0 0 30px var(--text-muted), 0 8px 32px rgba(0,0,0,0.4)',
                letterSpacing: 0.5
              }}>
              🌱 Start Growing Smarter
            </motion.button>

            <motion.button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.03, borderColor: 'var(--primary)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding:       '16px 36px',
                background:    'rgba(34,197,94,0.08)',
                border:        '1px solid var(--border-hover)',
                borderRadius:  12,
                color:         'var(--secondary)',
                fontFamily:    "'Cabinet Grotesk', sans-serif",
                fontSize:      16, fontWeight: 700,
                cursor:        'pointer',
                letterSpacing: 0.5,
                transition:    'all 0.2s'
              }}>
              See How It Works ↓
            </motion.button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            style={{
              display:    'flex', gap: 24, marginTop: 48,
              flexWrap:   'wrap', justifyContent: 'center',
              alignItems: 'center'
            }}>
            {[
              '🌾 22 Crop Types',
              '🔬 38 Diseases Detected',
              '📍 All 28 Indian States',
              '🗣️ Tamil · Hindi · English'
            ].map((badge, i) => (
              <span key={i} style={{
                fontFamily:  "'Share Tech Mono'",
                fontSize:    11,
                color:       'rgba(74,222,128,0.6)',
                letterSpacing: 1
              }}>
                {badge}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position:      'absolute', bottom: 32,
            left:          '50%', transform: 'translateX(-50%)',
            color:         'rgba(74,222,128,0.4)',
            fontFamily:    "'Share Tech Mono'",
            fontSize:      11, letterSpacing: 3,
            zIndex:        2,
            display:       'flex', flexDirection: 'column',
            alignItems:    'center', gap: 6
          }}>
          <div style={{
            width: 1, height: 40,
            background: 'linear-gradient(180deg, transparent, rgba(74,222,128,0.4))'
          }} />
          SCROLL
        </motion.div>
      </section>

      {/* ── PROBLEM SECTION ──────────────────────────────── */}
      <section style={{
        padding:    '100px 40px',
        background: 'linear-gradient(180deg, var(--bg), var(--bg-deep))',
        position:   'relative'
      }}>
        {/* Decorative line */}
        <div style={{
          position:   'absolute', top: 0, left: '10%', right: '10%',
          height:     1,
          background: 'linear-gradient(90deg, transparent, var(--primary-dim), transparent)'
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <ProblemSection />
        </div>
      </section>

      {/* ── STATS SECTION ────────────────────────────────── */}
      <section style={{
        padding:    '80px 40px',
        background: 'var(--bg-deep)',
        position:   'relative', overflow: 'hidden'
      }}>
        {/* Background hex pattern */}
        <div style={{
          position:       'absolute', inset: 0,
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpath d='M30 4 L56 18 L56 46 L30 60 L4 46 L4 18Z' fill='none' stroke='%2322C55E' stroke-width='0.5' opacity='0.04'/%3E%3C/svg%3E")`,
          pointerEvents:  'none'
        }} />

        <div style={{
          maxWidth:             1100, margin: '0 auto',
          display:              'grid',
          gridTemplateColumns:  'repeat(4, 1fr)',
          gap:                  40,
          position:             'relative', zIndex: 1
        }}>
          {STATS.map((s, i) => (
            <StatBlock key={i} index={i} {...s} />
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────────── */}
      <section id="features" style={{
        padding:    '100px 40px',
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg))',
        position:   'relative'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Section header */}
          <SectionHeader
            eyebrow="// ECOSYSTEM CAPABILITIES"
            title="Everything a farmer needs."
            subtitle="Six AI-powered tools built specifically for Indian farming conditions — from seed selection to market selling."
          />

          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 20, marginTop: 48
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} index={i} navigate={navigate} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section style={{
        padding:    '100px 40px',
        background: 'var(--bg-deep)',
        position:   'relative'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="// PROCESS"
            title="From field to insight in seconds."
            subtitle="Three simple steps. No technical knowledge needed."
          />
          <HowItWorks />
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section style={{
        padding:    '100px 40px',
        background: 'linear-gradient(180deg, var(--bg-deep), var(--bg))',
        position:   'relative'
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <SectionHeader
            eyebrow="// FARMER STORIES"
            title="Real farmers. Real results."
            subtitle="Thousands of Indian farmers are already using AmritKrishi to grow more and earn more."
          />
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 20, marginTop: 48
          }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} index={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{
        padding:    '120px 40px',
        background: 'var(--bg)',
        position:   'relative',
        overflow:   'hidden'
      }}>
        {/* Large glowing orb */}
        <div style={{
          position:     'absolute',
          top: '50%', left: '50%',
          transform:    'translate(-50%, -50%)',
          width:        600, height: 600,
          background:   'radial-gradient(circle, rgba(34,197,94,0.06), transparent)',
          borderRadius: '50%',
          pointerEvents:'none'
        }} />

        <FinalCTA navigate={navigate} />
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{
        padding:      '32px 40px',
        borderTop:    '1px solid var(--border)',
        background:   'var(--bg)',
        display:      'flex',
        justifyContent: 'space-between',
        alignItems:   'center',
        flexWrap:     'wrap', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🌿</span>
          <span style={{
            fontFamily:    "'Cabinet Grotesk'",
            fontSize:      14, fontWeight: 800,
            color:         'var(--secondary)'
          }}>
            AMRITKRISHI
          </span>
          <span style={{
            fontFamily: "'Share Tech Mono'",
            fontSize:   10,
            color:      'var(--primary-dim)',
            letterSpacing: 2
          }}>
            // ECO INTELLIGENCE v2.0
          </span>
        </div>
        <p style={{
          fontFamily: "'Share Tech Mono'",
          fontSize:   10,
          color:      'var(--border-hover)',
          letterSpacing: 1
        }}>
          EMPOWERING FARMERS WITH AI // 2026
        </p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%,100%{ opacity:1; transform:scale(1) }
          50%    { opacity:0.6; transform:scale(1.2) }
        }
        @keyframes blink {
          0%,100%{ opacity:1 }
          50%    { opacity:0 }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}

// ── SECTION HEADER ───────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={{ textAlign: 'center' }}>
      <p style={{
        fontFamily:    "'Share Tech Mono'",
        fontSize:      10,
        color:         'rgba(34,197,94,0.5)',
        letterSpacing: 4,
        margin:        '0 0 16px',
        textTransform: 'uppercase'
      }}>
        {eyebrow}
      </p>
      <h2 style={{
        fontFamily:    "'Cabinet Grotesk', sans-serif",
        fontSize:      'clamp(28px, 4vw, 48px)',
        fontWeight:    900,
        color:         'var(--text-primary)',
        lineHeight:    1.15,
        letterSpacing: -1,
        margin:        '0 0 16px'
      }}>
        {title}
      </h2>
      <p style={{
        fontFamily: "'Satoshi', sans-serif",
        fontSize:   16,
        color:      'var(--text-second)',
        lineHeight: 1.7,
        maxWidth:   560,
        margin:     '0 auto'
      }}>
        {subtitle}
      </p>
    </motion.div>
  )
}

// ── PROBLEM SECTION ──────────────────────────────────────────
function ProblemSection() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const PROBLEMS = [
    { stat: '20-40%', label: 'of crop yield lost to disease every year — because farmers don\'t recognize symptoms early enough.' },
    { stat: '₹2L Cr', label: 'in government subsidies go unclaimed every year — because most farmers never hear about them.' },
    { stat: '70%',    label: 'of farmers are exploited by middlemen on price — because they don\'t know the real market rate.' },
  ]

  return (
    <div ref={ref}>
      <motion.p
        initial={{ opacity:0 }}
        animate={inView ? { opacity:1 } : {}}
        style={{ fontFamily:"'Share Tech Mono'", fontSize:10,
                  color:'rgba(34,197,94,0.5)', letterSpacing:4,
                  margin:'0 0 16px' }}>
        // THE PROBLEM
      </motion.p>

      <motion.h2
        initial={{ opacity:0, y:20 }}
        animate={inView ? { opacity:1, y:0 } : {}}
        transition={{ delay:0.1 }}
        style={{ fontFamily:"'Cabinet Grotesk'", fontSize:'clamp(28px,4vw,44px)',
                  fontWeight:900, color:'var(--text-primary)', lineHeight:1.2,
                  letterSpacing:-1, margin:'0 0 48px' }}>
        Indian farmers lose billions every year
        <span style={{ color:'var(--primary)' }}> to problems AI can solve.</span>
      </motion.h2>

      <div style={{ display:'flex', flexDirection:'column', gap:16, textAlign:'left' }}>
        {PROBLEMS.map((p, i) => (
          <motion.div key={i}
            initial={{ opacity:0, x:-30 }}
            animate={inView ? { opacity:1, x:0 } : {}}
            transition={{ delay:0.2 + i * 0.15 }}
            style={{ display:'flex', gap:20, alignItems:'flex-start',
                      padding:'20px 24px',
                      background:'rgba(34,197,94,0.04)',
                      border:'1px solid rgba(34,197,94,0.12)',
                      borderLeft:'3px solid var(--primary)',
                      borderRadius:12 }}>
            <span style={{ fontFamily:"'Cabinet Grotesk'", fontSize:36,
                            fontWeight:900, color:'var(--primary)',
                            textShadow:'0 0 20px var(--text-muted)',
                            flexShrink:0, minWidth:90 }}>
              {p.stat}
            </span>
            <p style={{ fontFamily:"'Satoshi'", fontSize:16,
                         color:'rgba(110,231,183,0.7)', lineHeight:1.7,
                         margin:'8px 0 0' }}>
              {p.label}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity:0 }}
        animate={inView ? { opacity:1 } : {}}
        transition={{ delay:0.7 }}
        style={{ fontFamily:"'Cabinet Grotesk'", fontSize:22,
                  fontWeight:800, color:'var(--secondary)',
                  textShadow:'0 0 20px rgba(74,222,128,0.3)',
                  margin:'40px 0 0' }}>
        AmritKrishi solves all three. Free. In any language.
      </motion.p>
    </div>
  )
}

// ── HOW IT WORKS ─────────────────────────────────────────────
function HowItWorks() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const STEPS = [
    {
      num: '01', icon: '📍',
      title: 'Choose Your Location',
      desc:  'Select your state and district on our interactive India map. The system automatically loads your region\'s soil profile and live weather data.',
      color: 'var(--primary)'
    },
    {
      num: '02', icon: '🧠',
      title: 'AI Analyzes Everything',
      desc:  'Our models process soil NPK levels, pH, temperature, humidity, and rainfall — cross-referencing against 109,000+ data points to find your best crop.',
      color: 'var(--secondary)'
    },
    {
      num: '03', icon: '🌾',
      title: 'Grow With Confidence',
      desc:  'Get your top 3 crop recommendations with confidence scores, estimated profit, water needs, season timing, and a complete farming guide.',
      color: '#A3E635'
    },
  ]

  return (
    <div ref={ref} style={{ marginTop: 60, position: 'relative' }}>
      {/* Connecting line */}
      <div style={{
        position:   'absolute',
        top:        48, left: '16.5%', right: '16.5%',
        height:     1,
        background: 'linear-gradient(90deg, var(--primary-dim), var(--secondary)66, #A3E63533)',
        zIndex:     0
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32, position: 'relative', zIndex: 1 }}>
        {STEPS.map((step, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: i * 0.2 }}
            style={{ textAlign: 'center' }}>

            {/* Step circle */}
            <div style={{
              width:         80, height: 80,
              borderRadius:  '50%',
              background:    `radial-gradient(circle, ${step.color}20, ${step.color}08)`,
              border:        `2px solid ${step.color}`,
              display:       'flex', alignItems: 'center',
              justifyContent:'center',
              margin:        '0 auto 24px',
              fontSize:      32,
              boxShadow:     `0 0 30px ${step.color}30`
            }}>
              {step.icon}
            </div>

            <div style={{
              fontFamily:    "'Share Tech Mono'",
              fontSize:      10,
              color:         `${step.color}80`,
              letterSpacing: 3,
              marginBottom:  8
            }}>
              STEP {step.num}
            </div>

            <h3 style={{
              fontFamily:    "'Cabinet Grotesk'",
              fontSize:      20, fontWeight: 800,
              color:         'var(--text-primary)',
              margin:        '0 0 12px', letterSpacing: 0.3
            }}>
              {step.title}
            </h3>

            <p style={{
              fontFamily: "'Satoshi'",
              fontSize:   14, lineHeight: 1.7,
              color:      'var(--text-second)',
              margin:     0
            }}>
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── FINAL CTA ────────────────────────────────────────────────
function FinalCTA({ navigate }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const QUICK = [
    { label:'Crop AI',     icon:'🌾', path:'/crop'    },
    { label:'Disease Scan',icon:'🔬', path:'/disease'  },
    { label:'Weather',     icon:'🌤️', path:'/weather'  },
    { label:'Market',      icon:'📊', path:'/market'   },
    { label:'AI Chat',     icon:'🤖', path:'/chat'     },
    { label:'Schemes',     icon:'🏛️', path:'/schemes'  },
  ]

  return (
    <div ref={ref} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }}>

        <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10,
                     color:'rgba(34,197,94,0.5)', letterSpacing:4,
                     margin:'0 0 16px' }}>
          // GET STARTED TODAY
        </p>

        <h2 style={{ fontFamily:"'Cabinet Grotesk'",
                      fontSize:'clamp(32px,5vw,64px)',
                      fontWeight:900, lineHeight:1.1,
                      letterSpacing:-1.5, margin:'0 0 20px' }}>
          <span style={{ color:'var(--text-primary)' }}>Your farm.</span>
          <br />
          <span style={{
            background:'linear-gradient(135deg, var(--secondary), var(--primary), #A3E635)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            backgroundClip: 'text',
          }}>
            Smarter than ever.
          </span>
        </h2>

        <p style={{ fontFamily:"'Satoshi'", fontSize:18,
                     color:'var(--text-second)', lineHeight:1.7,
                     maxWidth:480, margin:'0 auto 40px' }}>
          Join thousands of Indian farmers already using AI to grow more, earn more, and waste less.
        </p>

        <motion.button
          onClick={() => navigate('/crop')}
          whileHover={{ scale:1.04 }}
          whileTap={{ scale:0.97 }}
          style={{ padding:'18px 48px', marginBottom:48,
                   background:'linear-gradient(135deg, #15803D, var(--primary))',
                   border:'none', borderRadius:14,
                   color:'var(--bg)',
                   fontFamily:"'Cabinet Grotesk'",
                   fontSize:18, fontWeight:900,
                   cursor:'pointer', letterSpacing:0.3,
                   boxShadow:'0 0 40px var(--text-muted), 0 12px 40px rgba(0,0,0,0.5)' }}>
          🌱 Start Free — No Signup Needed
        </motion.button>

        {/* Quick links */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          {QUICK.map((q, i) => (
            <motion.button key={i}
              onClick={() => navigate(q.path)}
              whileHover={{ y:-3, borderColor:'var(--primary)' }}
              style={{ padding:'10px 18px',
                       background:'rgba(34,197,94,0.06)',
                       border:'1px solid var(--primary-glow)',
                       borderRadius:10, cursor:'pointer',
                       fontFamily:"'Satoshi'",
                       fontSize:13, fontWeight:600,
                       color:'rgba(74,222,128,0.8)',
                       transition:'all 0.2s', display:'flex',
                       alignItems:'center', gap:6 }}>
              <span>{q.icon}</span> {q.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
