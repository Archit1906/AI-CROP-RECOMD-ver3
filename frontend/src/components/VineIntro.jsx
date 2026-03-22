import { useEffect, useState, useRef } from 'react'

export default function VineIntro({ onComplete }) {
  const [phase,       setPhase]       = useState('vine')
  const [lettersDone, setLettersDone] = useState(0)
  const [showTagline, setShowTagline] = useState(false)
  const [showSkip,    setShowSkip]    = useState(false)
  const [fadeOut,     setFadeOut]     = useState(false)
  const doneRef = useRef(false)

  const LETTERS   = 'AMRITKRISHI'.split('')
  const TAGLINE   = 'ECO INTELLIGENCE SYSTEM // v2.0'

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setFadeOut(true)
    setTimeout(onComplete, 700)
  }

  useEffect(() => {
    // Show skip after 1s
    const t0 = setTimeout(() => setShowSkip(true), 1000)

    // Phase: vine draws (0 → 2.2s)
    // Phase: leaves pop   (CSS handles via delay)
    // Phase: letters appear one by one starting at 2.4s
    const t1 = setTimeout(() => setPhase('letters'), 2200)

    // Stagger letters
    LETTERS.forEach((_, i) => {
      setTimeout(() => {
        setLettersDone(i + 1)
      }, 2400 + i * 160)
    })

    // Tagline after all letters
    const t2 = setTimeout(() => {
      setPhase('tagline')
      setShowTagline(true)
    }, 2400 + LETTERS.length * 160 + 200)

    // Auto finish
    const t3 = setTimeout(() => finish(),
      2400 + LETTERS.length * 160 + 2000)

    return () => [t0,t1,t2,t3].forEach(clearTimeout)
  }, [])

  // Vine SVG path — winds across full screen
  const VINE_PATH = `
    M -20 300
    C 80 280, 120 200, 200 220
    C 280 240, 300 160, 380 150
    C 460 140, 480 200, 560 180
    C 640 160, 660 100, 740 120
    C 820 140, 840 200, 920 180
    C 1000 160, 1020 120, 1100 140
    C 1180 160, 1200 200, 1280 190
    C 1360 180, 1400 140, 1480 160
    C 1540 175, 1560 200, 1600 200
  `

  // Leaf positions along the vine path
  const LEAVES = [
    { x: 195, y: 218, rot: -40,  size: 1.0, delay: 0.4  },
    { x: 375, y: 148, rot:  20,  size: 1.2, delay: 0.7  },
    { x: 555, y: 178, rot: -30,  size: 0.9, delay: 1.0  },
    { x: 735, y: 118, rot:  45,  size: 1.1, delay: 1.2  },
    { x: 915, y: 178, rot: -20,  size: 1.0, delay: 1.4  },
    { x: 1095,y: 138, rot:  35,  size: 0.85,delay: 1.6  },
    { x: 1275,y: 188, rot: -45,  size: 1.1, delay: 1.8  },
    { x: 250, y: 235, rot:  60,  size: 0.8, delay: 0.55 },
    { x: 460, y: 195, rot: -55,  size: 0.9, delay: 0.85 },
    { x: 660, y: 155, rot:  30,  size: 0.75,delay: 1.1  },
    { x: 840, y: 195, rot: -40,  size: 1.0, delay: 1.35 },
    { x: 1020,y: 155, rot:  50,  size: 0.9, delay: 1.55 },
    { x: 1200,y: 185, rot: -30,  size: 1.0, delay: 1.75 },
    { x: 1400,y: 158, rot:  25,  size: 0.85,delay: 1.95 },
  ]

  // Flower positions — one per letter approx
  const FLOWERS = LETTERS.map((_, i) => ({
    x:     120 + i * 115,
    delay: 2.4 + i * 0.16
  }))

  // Leaf SVG shape
  const leafPath = (x, y, rot, size) => {
    const s = size * 14
    return (
      <g key={`${x}-${y}`}
        transform={`translate(${x},${y}) rotate(${rot})`}
        style={{
          transformOrigin: `${x}px ${y}px`,
          animation: `leafPop 0.4s ease-out both`,
          animationDelay: `${LEAVES.find(l=>l.x===x&&l.y===y)?.delay||0}s`
        }}>
        {/* Leaf body */}
        <path
          d={`M0,0 C${s*0.6},-${s} ${s*1.2},-${s*0.3} ${s*1.4},0
              C${s*1.2},${s*0.3} ${s*0.6},${s} 0,0`}
          fill="#16A34A"
          stroke="#22C55E"
          strokeWidth="0.8"
          opacity="0.9"
        />
        {/* Leaf vein */}
        <line
          x1="0" y1="0" x2={s*1.4} y2="0"
          stroke="#4ADE80" strokeWidth="0.5" opacity="0.6"
        />
      </g>
    )
  }

  // Flower SVG
  const flower = (x, delay, i) => (
    <g key={i}
      transform={`translate(${x}, 88)`}
      style={{
        animation: `flowerBloom 0.5s ease-out both`,
        animationDelay: `${delay + 0.1}s`
      }}>
      {/* Petals */}
      {Array.from({length:6},(_,pi)=>{
        const angle = (pi/6)*Math.PI*2
        return (
          <ellipse key={pi}
            cx={Math.cos(angle)*7}
            cy={Math.sin(angle)*7}
            rx="4" ry="2.5"
            fill={pi%2===0?'#4ADE80':'#A3E635'}
            opacity="0.85"
            transform={`rotate(${(pi/6)*360},${Math.cos(angle)*7},${Math.sin(angle)*7})`}
          />
        )
      })}
      {/* Center */}
      <circle cx="0" cy="0" r="3.5" fill="#FDE047" opacity="0.9"/>
      <circle cx="0" cy="0" r="1.5" fill="#F59E0B"/>
    </g>
  )

  return (
    <div style={{
      position:   'fixed', inset: 0,
      zIndex:     9999,
      background: '#010804',
      display:    'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow:   'hidden',
      opacity:    fadeOut ? 0 : 1,
      transition: 'opacity 0.7s ease'
    }}>

      {/* ── SCANLINES ──────────────────────────────────── */}
      <div style={{
        position:      'absolute', inset: 0,
        background:    'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)',
        pointerEvents: 'none', zIndex: 1
      }} />

      {/* ── BACKGROUND GLOW ────────────────────────────── */}
      <div style={{
        position:     'absolute',
        top: '50%', left: '50%',
        transform:    'translate(-50%,-50%)',
        width:        '70vw', height: '60vh',
        background:   'radial-gradient(ellipse,rgba(34,197,94,0.06),transparent 70%)',
        pointerEvents:'none'
      }} />

      {/* ── VINE SVG ────────────────────────────────────── */}
      <svg
        viewBox="0 0 1600 400"
        style={{
          position:   'absolute',
          top: '50%', left: 0,
          transform:  'translateY(-60%)',
          width:      '100vw',
          height:     'auto',
          overflow:   'visible'
        }}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Vine gradient */}
          <linearGradient id="vineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#052e16" />
            <stop offset="30%"  stopColor="#16A34A" />
            <stop offset="70%"  stopColor="#22C55E" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="vineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Leaf filter */}
          <filter id="leafGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Vine glow layer */}
        <path
          d={VINE_PATH}
          fill="none"
          stroke="#22C55E"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#vineGlow)"
          opacity="0.4"
          style={{
            strokeDasharray:  3000,
            strokeDashoffset: 3000,
            animation: 'vineDraw 2.2s cubic-bezier(0.4,0,0.2,1) forwards'
          }}
        />

        {/* Main vine */}
        <path
          d={VINE_PATH}
          fill="none"
          stroke="url(#vineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            strokeDasharray:  3000,
            strokeDashoffset: 3000,
            animation: 'vineDraw 2.2s cubic-bezier(0.4,0,0.2,1) forwards'
          }}
        />

        {/* Leaves */}
        <g filter="url(#leafGlow)">
          {LEAVES.map(({ x, y, rot, size, delay }) =>
            leafPath(x, y, rot, size)
          )}
        </g>

        {/* Small branch offshoots */}
        {[
          { x1:200,y1:220, x2:185,y2:200, delay:0.5  },
          { x1:380,y1:150, x2:395,y2:130, delay:0.8  },
          { x1:560,y1:180, x2:545,y2:160, delay:1.05 },
          { x1:740,y1:120, x2:755,y2:100, delay:1.25 },
          { x1:920,y1:180, x2:905,y2:162, delay:1.45 },
          { x1:1100,y1:140,x2:1115,y2:120,delay:1.62 },
          { x1:1280,y1:190,x2:1265,y2:170,delay:1.82 },
        ].map((b,i)=>(
          <line key={i}
            x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
            stroke="#22C55E" strokeWidth="1.5"
            strokeLinecap="round" opacity="0.7"
            style={{
              strokeDasharray:  30,
              strokeDashoffset: 30,
              animation: `branchDraw 0.3s ease-out ${b.delay}s forwards`
            }}
          />
        ))}
      </svg>

      {/* ── LOGO TEXT ───────────────────────────────────── */}
      <div style={{
        position:   'relative', zIndex: 2,
        textAlign:  'center',
        marginTop:  '8vh'
      }}>

        {/* Letters row */}
        <div style={{
          display:    'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap:        '2px',
          position:   'relative',
          marginBottom: 8
        }}>
          {LETTERS.map((letter, i) => (
            <div key={i} style={{ position: 'relative', textAlign: 'center' }}>

              {/* Flower above letter */}
              {lettersDone > i && (
                <svg
                  width="32" height="32"
                  viewBox="-16 -16 32 32"
                  style={{
                    display: 'block',
                    margin: '0 auto 2px',
                    animation: 'flowerBloom 0.5s ease-out both',
                    animationDelay: `${(i * 0.16) + 0.1}s`
                  }}>
                  {Array.from({length:6},(_,pi)=>{
                    const angle = (pi/6)*Math.PI*2
                    return (
                      <ellipse key={pi}
                        cx={Math.cos(angle)*8}
                        cy={Math.sin(angle)*8}
                        rx="4.5" ry="2.5"
                        fill={pi%2===0?'#4ADE80':'#A3E635'}
                        opacity="0.9"
                      />
                    )
                  })}
                  <circle cx="0" cy="0" r="4" fill="#FDE047"/>
                  <circle cx="0" cy="0" r="2" fill="#F59E0B"/>
                </svg>
              )}

              {/* Letter */}
              <span style={{
                fontFamily:    "'Cabinet Grotesk', sans-serif",
                fontSize:      'clamp(48px, 8vw, 96px)',
                fontWeight:    900,
                letterSpacing: '-1px',
                display:       'inline-block',
                color:         '#4ADE80',
                textShadow:    lettersDone > i
                  ? '0 0 20px rgba(74,222,128,0.8), 0 0 40px rgba(34,197,94,0.4)'
                  : 'none',
                opacity:       lettersDone > i ? 1 : 0,
                transform:     lettersDone > i
                  ? 'translateY(0) scale(1)'
                  : 'translateY(20px) scale(0.8)',
                transition:    'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                WebkitTextFillColor: lettersDone > i ? undefined : 'transparent',
              }}>
                {letter}
              </span>

              {/* Letter underline — vine segment */}
              {lettersDone > i && (
                <div style={{
                  position:   'absolute',
                  bottom:     -4,
                  left:       '10%', right: '10%',
                  height:     2,
                  background: 'linear-gradient(90deg,transparent,#22C55E,transparent)',
                  borderRadius: 1,
                  animation:  'underlineGrow 0.4s ease-out both'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div style={{
          overflow: 'hidden',
          height:   showTagline ? 28 : 0,
          transition:'height 0.5s ease',
          marginTop: 12
        }}>
          <p style={{
            fontFamily:  "'Share Tech Mono', monospace",
            fontSize:    'clamp(10px,1.2vw,13px)',
            letterSpacing: 5,
            color:       'rgba(134,239,172,0.65)',
            margin:      0,
            animation:   showTagline ? 'fadeSlideUp 0.6s ease forwards' : 'none'
          }}>
            {TAGLINE}
          </p>
        </div>

        {/* CTA hint */}
        {showTagline && (
          <p style={{
            fontFamily:  "'Share Tech Mono'",
            fontSize:    10, letterSpacing: 4,
            color:       'rgba(34,197,94,0.3)',
            margin:      '16px 0 0',
            animation:   'blink 1.2s step-end infinite'
          }}>
            ▶ ENTERING ECOSYSTEM...
          </p>
        )}
      </div>

      {/* ── CORNER DECORATIONS ──────────────────────────── */}
      {[[0,0,'0 0 0 0'],[1,0,'0 0 0 0'],[0,1,'0 0 0 0'],[1,1,'0 0 0 0']].map((_,i)=>{
        const left  = i%2===0 ? 20 : 'auto'
        const right = i%2===1 ? 20 : 'auto'
        const top   = i<2     ? 20 : 'auto'
        const bot   = i>=2    ? 20 : 'auto'
        const bTop  = i<2     ? '2px solid rgba(34,197,94,0.4)' : 'none'
        const bBot  = i>=2    ? '2px solid rgba(34,197,94,0.4)' : 'none'
        const bLeft = i%2===0 ? '2px solid rgba(34,197,94,0.4)' : 'none'
        const bRight= i%2===1 ? '2px solid rgba(34,197,94,0.4)' : 'none'
        return (
          <div key={i} style={{
            position: 'absolute',
            left, right, top, bottom: bot,
            width: 24, height: 24,
            borderTop: bTop, borderBottom: bBot,
            borderLeft: bLeft, borderRight: bRight,
            zIndex: 2, opacity: 0.6
          }} />
        )
      })}

      {/* ── FLOATING PARTICLES ──────────────────────────── */}
      {Array.from({length:18},(_,i)=>(
        <div key={i} style={{
          position:   'absolute',
          left:       `${5+Math.random()*90}%`,
          top:        `${10+Math.random()*80}%`,
          width:      2+Math.random()*3,
          height:     2+Math.random()*3,
          borderRadius:'50%',
          background: i%3===0?'#4ADE80':i%3===1?'#A3E635':'#FDE047',
          opacity:    0.2+Math.random()*0.3,
          animation:  `float ${3+Math.random()*4}s ${Math.random()*3}s ease-in-out infinite`,
          pointerEvents:'none', zIndex:1
        }}/>
      ))}

      {/* ── PROGRESS BAR ────────────────────────────────── */}
      <div style={{
        position:   'absolute', bottom: 0,
        left: 0, right: 0, height: 3,
        background: 'rgba(34,197,94,0.08)', zIndex: 3
      }}>
        <div style={{
          height:     '100%',
          background: 'linear-gradient(90deg,#16A34A,#22C55E,#4ADE80)',
          boxShadow:  '0 0 10px rgba(74,222,128,0.6)',
          transition: 'width 0.4s ease',
          width:
            phase==='vine'    ? `${Math.min(65, (Date.now()%2200)/2200*65)}%` :
            phase==='letters' ? `${65+lettersDone/LETTERS.length*25}%` :
            phase==='tagline' ? '100%' : '100%'
        }}/>
      </div>

      {/* ── SKIP ────────────────────────────────────────── */}
      {showSkip && (
        <button onClick={finish} style={{
          position:   'absolute', top: 20, right: 20,
          zIndex:     4,
          background: 'rgba(34,197,94,0.08)',
          border:     '1px solid rgba(34,197,94,0.25)',
          borderRadius: 8,
          color:      'rgba(74,222,128,0.55)',
          fontFamily: "'Share Tech Mono',monospace",
          fontSize:   10, letterSpacing: 3,
          padding:    '7px 16px', cursor: 'pointer',
          transition: 'all 0.2s'
        }}
          onMouseEnter={e=>{
            e.currentTarget.style.background='rgba(34,197,94,0.15)'
            e.currentTarget.style.color='#4ADE80'
          }}
          onMouseLeave={e=>{
            e.currentTarget.style.background='rgba(34,197,94,0.08)'
            e.currentTarget.style.color='rgba(74,222,128,0.55)'
          }}>
          SKIP ►
        </button>
      )}

      {/* ── ALL CSS ANIMATIONS ──────────────────────────── */}
      <style>{`
        @keyframes vineDraw {
          from { stroke-dashoffset: 3000; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes branchDraw {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes leafPop {
          0%   { transform: scale(0) rotate(0deg); opacity:0; }
          60%  { transform: scale(1.3) rotate(5deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:0.9; }
        }
        @keyframes flowerBloom {
          0%   { transform: scale(0) rotate(-30deg); opacity:0; }
          60%  { transform: scale(1.2) rotate(5deg); opacity:1; }
          100% { transform: scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes underlineGrow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%     { transform: translateY(-14px) rotate(8deg); }
        }
        @keyframes blink {
          0%,100% { opacity:1; }
          50%     { opacity:0; }
        }
      `}</style>
    </div>
  )
}
