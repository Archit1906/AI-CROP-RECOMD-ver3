import { useEffect, useState, useRef } from 'react'

export default function VineIntro({ onComplete }) {
  const canvasRef = useRef(null)
  const [phase, setPhase] = useState('vine')
  const [lettersDone, setLettersDone] = useState(0)
  const [showTagline, setShowTagline] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [showLogo, setShowLogo] = useState(false)
  const doneRef = useRef(false)

  const LETTERS = 'AMRITKRISHI'.split('')

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setFadeOut(true)
    setTimeout(onComplete, 800)
  }

  // ── CANVAS PARTICLE SYSTEM ───────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    let frame

    // Particles
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.6 + 0.1),
      size: 0.5 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.4,
      color: Math.random() > 0.6 ? '#4ADE80' :
        Math.random() > 0.3 ? '#A3E635' : '#FDE047',
      life: Math.random()
    }))

    // Fireflies — larger glowing dots
    const fireflies = Array.from({ length: 18 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 1.5 + Math.random() * 2.5,
      alpha: 0,
      targetAlpha: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2
    }))

    const loop = () => {
      frame = requestAnimationFrame(loop)
      ctx.clearRect(0, 0, W, H)

      // Rising particles
      particles.forEach(p => {
        p.x += p.vx + Math.sin(p.life * 3) * 0.2
        p.y += p.vy
        p.life += 0.005
        if (p.y < -10) {
          p.y = H + 10
          p.x = Math.random() * W
          p.life = 0
          p.alpha = 0.1 + Math.random() * 0.4
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha * (1 - p.life * 0.3)
        ctx.fill()
      })

      // Fireflies with glow
      const t = Date.now() / 1000
      fireflies.forEach((f, i) => {
        f.x += f.vx + Math.sin(t * 0.5 + i) * 0.1
        f.y += f.vy + Math.cos(t * 0.4 + i) * 0.1
        f.alpha = f.targetAlpha * (0.5 + Math.sin(t * 2 + f.phase) * 0.5)
        if (f.x < 0 || f.x > W) f.vx *= -1
        if (f.y < 0 || f.y > H) f.vy *= -1

        // Glow
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4)
        grad.addColorStop(0, `rgba(74,222,128,${f.alpha})`)
        grad.addColorStop(0.4, `rgba(34,197,94,${f.alpha * 0.4})`)
        grad.addColorStop(1, 'rgba(34,197,94,0)')
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.globalAlpha = 1
        ctx.fill()

        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fillStyle = '#86EFAC'
        ctx.globalAlpha = f.alpha
        ctx.fill()
      })

      ctx.globalAlpha = 1
    }
    loop()

    const onResize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // ── TIMELINE ─────────────────────────────────────────────────
  useEffect(() => {
    const timers = []
    const T = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t }

    T(() => setShowSkip(true), 800)
    T(() => setShowLogo(true), 2000)
    T(() => setPhase('letters'), 2200)

    LETTERS.forEach((_, i) => {
      T(() => setLettersDone(i + 1), 2400 + i * 140)
    })

    const afterLetters = 2400 + LETTERS.length * 140
    T(() => setShowTagline(true), afterLetters + 300)
    T(() => finish(), afterLetters + 2200)

    return () => timers.forEach(clearTimeout)
  }, [])

  // Letter color cycle
  const letterColors = [
    '#4ADE80', '#22C55E', '#A3E635',
    '#86EFAC', '#4ADE80', '#FDE047',
    '#A3E635', '#4ADE80', '#22C55E',
    '#86EFAC', '#4ADE80'
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#010804', overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease'
    }}>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0,
        width: '100vw', height: '100vh',
        zIndex: 0
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)',
        pointerEvents: 'none', zIndex: 1
      }} />

      {/* Big radial glow center */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '80vw', height: '80vh',
        background: 'radial-gradient(ellipse,rgba(34,197,94,0.07) 0%,rgba(34,197,94,0.03) 40%,transparent 70%)',
        pointerEvents: 'none', zIndex: 1,
        animation: 'glowPulse 4s ease infinite'
      }} />

      {/* ── VINE SVG ──────────────────────────────────────── */}
      {showLogo && (
        <svg viewBox="0 0 1600 500"
          preserveAspectRatio="xMidYMid meet"
          style={{
            position: 'absolute',
            top: '50%', left: 0,
            transform: 'translateY(-75%)',
            width: '100vw', height: 'auto',
            zIndex: 2, overflow: 'visible'
          }}>
          <defs>
            <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#052e16" />
              <stop offset="20%" stopColor="#166534" />
              <stop offset="50%" stopColor="#22C55E" />
              <stop offset="80%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#86EFAC" />
            </linearGradient>
            <filter id="vglow">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="lglow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Thick glow shadow */}
          <path
            d="M-20,280 C100,230 180,160 320,180 C460,200 520,130 680,120 C840,110 880,170 1040,155 C1200,140 1260,100 1420,130 C1520,148 1580,180 1620,175"
            fill="none" stroke="#22C55E" strokeWidth="14"
            strokeLinecap="round" opacity="0.12"
            filter="url(#vglow)"
            style={{
              strokeDasharray: 3200,
              strokeDashoffset: 3200,
              animation: 'vd 2s cubic-bezier(0.4,0,0.2,1) forwards'
            }}
          />
          {/* Main vine */}
          <path
            d="M-20,280 C100,230 180,160 320,180 C460,200 520,130 680,120 C840,110 880,170 1040,155 C1200,140 1260,100 1420,130 C1520,148 1580,180 1620,175"
            fill="none" stroke="url(#vg)" strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#vglow)"
            style={{
              strokeDasharray: 3200,
              strokeDashoffset: 3200,
              animation: 'vd 2s cubic-bezier(0.4,0,0.2,1) forwards'
            }}
          />

          {/* Leaves — bigger and more dramatic */}
          {[
            { x: 318, y: 180, r: -50, s: 1.3, d: 0.5 },
            { x: 318, y: 180, r: 130, s: 1.0, d: 0.55 },
            { x: 678, y: 120, r: -40, s: 1.5, d: 0.85 },
            { x: 678, y: 120, r: 140, s: 1.1, d: 0.9 },
            { x: 1038, y: 155, r: -55, s: 1.3, d: 1.2 },
            { x: 1038, y: 155, r: 125, s: 1.0, d: 1.25 },
            { x: 1418, y: 130, r: -45, s: 1.2, d: 1.6 },
            { x: 1418, y: 130, r: 135, s: 0.9, d: 1.65 },
            { x: 500, y: 160, r: -30, s: 0.9, d: 0.7 },
            { x: 860, y: 138, r: 155, s: 0.8, d: 1.05 },
            { x: 1230, y: 120, r: -35, s: 1.0, d: 1.45 },
          ].map(({ x, y, r, s, d }, i) => {
            const L = s * 18
            return (
              <g key={i} transform={`translate(${x},${y}) rotate(${r})`}
                filter="url(#lglow)"
                style={{
                  animation: `lp 0.5s cubic-bezier(0.34,1.56,0.64,1) ${d}s both`
                }}>
                <path
                  d={`M0,0 C${L * 0.7},-${L * 1.1} ${L * 1.4},-${L * 0.4} ${L * 1.6},0 C${L * 1.4},${L * 0.4} ${L * 0.7},${L * 1.1} 0,0`}
                  fill="#16A34A" stroke="#4ADE80" strokeWidth="0.8" opacity="0.95"
                />
                <line x1="0" y1="0" x2={L * 1.6} y2="0"
                  stroke="#86EFAC" strokeWidth="0.6" opacity="0.7" />
                <line x1={L * 0.5} y1={-L * 0.6} x2={L * 1.1} y2="0"
                  stroke="#86EFAC" strokeWidth="0.4" opacity="0.4" />
                <line x1={L * 0.5} y1={L * 0.6} x2={L * 1.1} y2="0"
                  stroke="#86EFAC" strokeWidth="0.4" opacity="0.4" />
              </g>
            )
          })}

          {/* Branch tendrils */}
          {[
            { x: 320, y: 180, dx: 20, dy: -35, d: 0.6 },
            { x: 680, y: 120, dx: -25, dy: -40, d: 0.95 },
            { x: 1040, y: 155, dx: 22, dy: -38, d: 1.3 },
            { x: 1420, y: 130, dx: -18, dy: -35, d: 1.7 },
          ].map(({ x, y, dx, dy, d }, i) => (
            <path key={i}
              d={`M${x},${y} Q${x + dx * 0.5},${y + dy * 1.2} ${x + dx},${y + dy}`}
              fill="none" stroke="#22C55E" strokeWidth="1.5"
              strokeLinecap="round" opacity="0.6"
              style={{
                strokeDasharray: 60,
                strokeDashoffset: 60,
                animation: `bd 0.4s ease-out ${d}s forwards`
              }}
            />
          ))}
        </svg>
      )}

      {/* ── LOGO ────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 3,
        textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100vh'
      }}>

        {/* Pre-logo icon */}
        {showLogo && (
          <div style={{
            fontSize: 48, marginBottom: 8,
            animation: 'iconDrop 0.6s cubic-bezier(0.34,1.56,0.64,1) 2.0s both'
          }}>
            🌿
          </div>
        )}

        {/* Letters */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', gap: 0,
          position: 'relative'
        }}>
          {LETTERS.map((letter, i) => (
            <div key={i} style={{ position: 'relative', textAlign: 'center' }}>

              {/* Flower */}
              {lettersDone > i && (
                <div style={{
                  position: 'absolute',
                  top: -44, left: '50%',
                  transform: 'translateX(-50%)',
                  animation: 'flowerIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both'
                }}>
                  <svg width="28" height="28" viewBox="-14 -14 28 28">
                    {Array.from({ length: 6 }, (_, pi) => {
                      const a = (pi / 6) * Math.PI * 2
                      return <ellipse key={pi}
                        cx={Math.cos(a) * 7} cy={Math.sin(a) * 7}
                        rx="4" ry="2.2"
                        fill={pi % 2 === 0 ? '#4ADE80' : '#A3E635'} opacity="0.9" />
                    })}
                    <circle cx="0" cy="0" r="3.5" fill="#FDE047" />
                    <circle cx="0" cy="0" r="1.8" fill="#F59E0B" />
                  </svg>
                </div>
              )}

              {/* Letter */}
              <span style={{
                fontFamily: "'Cabinet Grotesk',sans-serif",
                fontSize: 'clamp(56px,9vw,108px)',
                fontWeight: 900,
                display: 'inline-block',
                color: lettersDone > i ? letterColors[i] : 'transparent',
                textShadow: lettersDone > i
                  ? `0 0 30px ${letterColors[i]}cc, 0 0 60px ${letterColors[i]}66, 0 0 90px ${letterColors[i]}33`
                  : 'none',
                opacity: lettersDone > i ? 1 : 0,
                transform: lettersDone > i
                  ? 'translateY(0) scale(1) rotateX(0deg)'
                  : 'translateY(40px) scale(0.5) rotateX(90deg)',
                transition: `all 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.04}s`,
                letterSpacing: '-1px',
                lineHeight: 1,
                padding: '0 2px',
                WebkitTextFillColor: lettersDone > i ? letterColors[i] : 'transparent'
              }}>
                {letter}
              </span>

              {/* Letter glow floor */}
              {lettersDone > i && (
                <div style={{
                  position: 'absolute',
                  bottom: -8, left: '0%', right: '0%',
                  height: 2,
                  background: `linear-gradient(90deg,transparent,${letterColors[i]},transparent)`,
                  borderRadius: 1,
                  animation: 'glowLine 0.4s ease both',
                  boxShadow: `0 0 8px ${letterColors[i]}`
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div style={{
          marginTop: 20,
          overflow: 'hidden',
          height: showTagline ? 32 : 0,
          transition: 'height 0.5s ease'
        }}>
          <p style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 'clamp(10px,1.3vw,14px)',
            letterSpacing: 6,
            color: 'rgba(134,239,172,0.7)',
            margin: 0,
            animation: showTagline ? 'slideUp 0.5s ease forwards' : 'none'
          }}>
            ECO INTELLIGENCE SYSTEM // v2.0
          </p>
        </div>

        {/* Tagline 2 */}
        {showTagline && (
          <p style={{
            fontFamily: "'Share Tech Mono'",
            fontSize: 10, letterSpacing: 4,
            color: 'rgba(34,197,94,0.35)',
            margin: '12px 0 0',
            animation: 'blink 1.2s step-end infinite'
          }}>
            ▶ ENTERING ECOSYSTEM...
          </p>
        )}
      </div>

      {/* ── CORNER HUD ──────────────────────────────────── */}
      {['tl', 'tr', 'bl', 'br'].map((pos, i) => (
        <div key={pos} style={{
          position: 'absolute', zIndex: 4,
          top: pos.startsWith('t') ? 16 : 'auto',
          bottom: pos.startsWith('b') ? 16 : 'auto',
          left: pos.endsWith('l') ? 16 : 'auto',
          right: pos.endsWith('r') ? 16 : 'auto',
          width: 28, height: 28,
          borderTop: pos.startsWith('t') ? '2px solid rgba(34,197,94,0.5)' : 'none',
          borderBottom: pos.startsWith('b') ? '2px solid rgba(34,197,94,0.5)' : 'none',
          borderLeft: pos.endsWith('l') ? '2px solid rgba(34,197,94,0.5)' : 'none',
          borderRight: pos.endsWith('r') ? '2px solid rgba(34,197,94,0.5)' : 'none',
          animation: `cornerFade 0.5s ease ${i * 0.1}s both`
        }} />
      ))}

      {/* ── TOP STATUS ──────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 24, left: 32,
        zIndex: 4, display: 'flex',
        alignItems: 'center', gap: 8
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#4ADE80',
          boxShadow: '0 0 8px #4ADE80',
          animation: 'pulse 1.5s ease infinite'
        }} />
        <p style={{
          fontFamily: "'Share Tech Mono'",
          fontSize: 9, letterSpacing: 4,
          color: 'rgba(74,222,128,0.5)', margin: 0
        }}>
          {phase === 'vine' && '// ECOSYSTEM INITIALIZING...'}
          {phase === 'letters' && '// BIOME NETWORK ACTIVE...'}
          {phase === 'tagline' && '// ALL SYSTEMS NOMINAL'}
        </p>
      </div>

      {/* ── PROGRESS ────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0,
        left: 0, right: 0, height: 3,
        background: 'rgba(34,197,94,0.08)', zIndex: 4
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg,#166534,#22C55E,#4ADE80)',
          boxShadow: '0 0 12px rgba(74,222,128,0.7)',
          transition: 'width 0.5s ease',
          width:
            phase === 'vine' ? '40%' :
              phase === 'letters' ? `${40 + lettersDone / LETTERS.length * 45}%` :
                '100%'
        }} />
      </div>

      {/* ── SKIP ────────────────────────────────────────── */}
      {showSkip && (
        <button onClick={finish} style={{
          position: 'absolute', top: 20, right: 20,
          zIndex: 5,
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 8,
          color: 'rgba(74,222,128,0.6)',
          fontFamily: "'Share Tech Mono'",
          fontSize: 10, letterSpacing: 3,
          padding: '7px 18px', cursor: 'pointer',
          transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.18)'; e.currentTarget.style.color = '#4ADE80' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; e.currentTarget.style.color = 'rgba(74,222,128,0.6)' }}>
          SKIP ►
        </button>
      )}

      <style>{`
        @keyframes vd {
          from { stroke-dashoffset:3200 }
          to   { stroke-dashoffset:0 }
        }
        @keyframes lp {
          0%  { transform:scale(0) rotate(-20deg); opacity:0 }
          60% { transform:scale(1.4) rotate(8deg); opacity:1 }
          100%{ transform:scale(1) rotate(0deg);  opacity:0.95 }
        }
        @keyframes bd {
          from { stroke-dashoffset:60 }
          to   { stroke-dashoffset:0 }
        }
        @keyframes flowerIn {
          0%  { transform:translateX(-50%) scale(0) rotate(-40deg); opacity:0 }
          60% { transform:translateX(-50%) scale(1.3) rotate(5deg); opacity:1 }
          100%{ transform:translateX(-50%) scale(1) rotate(0deg);  opacity:1 }
        }
        @keyframes glowLine {
          from { transform:scaleX(0); opacity:0 }
          to   { transform:scaleX(1); opacity:1 }
        }
        @keyframes iconDrop {
          0%  { transform:translateY(-30px) scale(0); opacity:0 }
          70% { transform:translateY(4px) scale(1.2);  opacity:1 }
          100%{ transform:translateY(0) scale(1);      opacity:1 }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(12px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes cornerFade {
          from { opacity:0; transform:scale(0.5) }
          to   { opacity:1; transform:scale(1) }
        }
        @keyframes glowPulse {
          0%,100%{ opacity:0.8 }
          50%    { opacity:1.4 }
        }
        @keyframes pulse {
          0%,100%{ opacity:1; transform:scale(1) }
          50%    { opacity:0.4; transform:scale(1.4) }
        }
        @keyframes blink {
          0%,100%{ opacity:1 }
          50%    { opacity:0 }
        }
      `}</style>
    </div>
  )
}
