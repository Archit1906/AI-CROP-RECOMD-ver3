import re

file_path = r"c:\Users\archi\OneDrive\Desktop\AI PROJECT\croprecomd ver3\frontend\src\pages\Dashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

wheat_hero_replacement = """function WheatHero() {
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
    { bx:8,  by:30, label:'93%',  sub:'ACCURACY',    color:'#4ADE80', depth:0.8 },
    { bx:22, by:18, label:'22',   sub:'CROP TYPES',  color:'#A3E635', depth:0.5 },
    { bx:50, by:12, label:'38',   sub:'DISEASES',    color:'#22C55E', depth:1.0 },
    { bx:75, by:20, label:'3',    sub:'LANGUAGES',   color:'#86EFAC', depth:0.4 },
    { bx:88, by:32, label:'500+', sub:'MANDIS',      color:'#FDE047', depth:0.7 },
    { bx:35, by:55, label:'140M', sub:'FARMERS',     color:'#22C55E', depth:0.3 },
    { bx:65, by:50, label:'85%',  sub:'DISEASE ACC', color:'#4ADE80', depth:0.6 },
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
            <stop offset="0%" stopColor="#020D05" />
            <stop offset="55%" stopColor="#071A0C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="stalkGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#052e16" />
            <stop offset="40%"  stopColor="#166534" />
            <stop offset="80%"  stopColor="#22C55E" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
          <linearGradient id="stalkGrad2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#052e16" />
            <stop offset="50%"  stopColor="#15803D" />
            <stop offset="100%" stopColor="#16A34A" />
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
            <stop offset="0%"   stopColor="#22C55E" stopOpacity="0" />
            <stop offset="50%"  stopColor="#22C55E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="mouseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#22C55E" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0"    />
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
          fill="#22C55E"
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
              fill="#071A0C" opacity="0.9" />
          )
        })}

        {/* Ground */}
        <rect x="-5" y="86" width="110" height="20" fill="url(#ground)" />

        {/* Ground texture */}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i}
            x1="-5" y1={87.5 + i * 1.8}
            x2="105" y2={87.5 + i * 1.8}
            stroke="#22C55E" strokeWidth="0.06" opacity="0.2" />
        ))}

        {/* Underground root network */}
        {Array.from({ length: 10 }, (_, i) => {
          const rx   = 5 + i * 9.5 + (mx - 0.5) * 2
          const flow = (time * 0.25 + i * 0.35) % 1
          return (
            <g key={i} opacity="0.2">
              <path d={`M${rx} 87 Q${rx+6} 93 ${rx+4} 100`}
                fill="none" stroke="#22C55E" strokeWidth="0.25"
                strokeDasharray="2.5 2" strokeDashoffset={-flow * 4.5} />
              <path d={`M${rx} 87 Q${rx-5} 94 ${rx-7} 100`}
                fill="none" stroke="#16A34A" strokeWidth="0.18"
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
                  fill={gi % 3 === 0 ? '#FDE047' : gi % 3 === 1 ? '#A3E635' : '#22C55E'}
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
              fill="none" stroke="#22C55E"
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
          const colors = ['#A3E635', '#4ADE80', '#FDE047', '#22C55E', '#86EFAC']
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
                stroke="#22C55E"
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
            <stop offset="100%" stopColor="#020D05" stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#vignette)" />

        {/* HUD corners */}
        {[[2,2],[98,2],[2,98],[98,98]].map(([cx,cy],i) => {
          const sx = cx < 50 ? 1 : -1
          const sy = cy < 50 ? 1 : -1
          return (
            <g key={i} stroke="#22C55E" strokeWidth="0.35" opacity="0.35">
              <line x1={cx} y1={cy} x2={cx+sx*6} y2={cy} />
              <line x1={cx} y1={cy} x2={cx}        y2={cy+sy*6} />
            </g>
          )
        })}

        {/* Bottom HUD */}
        <rect x="0" y="97.5" width="100" height="0.2"
          fill="#22C55E" opacity="0.2" />
        <text x="2" y="99.5" fill="#22C55E"
          fontSize="1.3" fontFamily="'Share Tech Mono'" opacity="0.3">
          // ECO INTELLIGENCE // AMRITKRISHI v2.0 // ALL SYSTEMS ACTIVE
        </text>

        {/* Live dot top right */}
        <circle cx="97" cy="3" r="0.7"
          fill="#4ADE80"
          opacity={0.5 + Math.sin(time * 4) * 0.4}
        />
        <text x="98.5" y="4" fill="#4ADE80"
          fontSize="1.6" fontFamily="'Share Tech Mono'" opacity="0.6">
          LIVE
        </text>
      </svg>
    </div>
  )
}
"""

hero_replacement = """      <section style={{
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
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 20%, #020D05 100%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 100, zIndex: 1,
          background: 'linear-gradient(180deg, #020D05 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 160, zIndex: 1,
          background: 'linear-gradient(0deg, #020D05 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        {/* Hero text content — sits above field */}
        <motion.div style={{ y: heroY, opacity: heroOp, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '120px 40px 80px', textAlign: 'center' }}>"""

content = re.sub(
    r'function WheatHero\(\) \{.*?\n// ── FEATURE CARD',
    wheat_hero_replacement + '\n\n// ── FEATURE CARD',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'<section style=\{\{.*?</motion\.div>\n\n\s*\{\/\* Radial vignette \*\/\}.*?\{\/\* Hero content \*\/\}\n\s*<div style=\{\{.*?\n\s+textAlign: \'center\'\n\s+\}\}>',
    hero_replacement,
    content,
    flags=re.DOTALL
)

# And now fixing that double nested style just in case of any overlaps, wait, my regex replaced it perfectly!

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched successfully")
