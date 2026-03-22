import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'

const ECO_SYSTEMS = [
  { name: 'ECO-01', subtitle: 'SEEDLING', color: 'var(--primary)', status: 'CROP ANALYSIS SYSTEM' },
  { name: 'ECO-02', subtitle: 'ROOTS',    color: 'var(--tertiary)', status: 'THREAT DETECTION SYSTEM' },
  { name: 'ECO-03', subtitle: 'CANOPY',   color: 'var(--secondary)', status: 'WEATHER INTEL SYSTEM'   },
]

const BOOT_LOGS = [
  '> INITIALIZING ECO INTELLIGENCE SYSTEM...',
  '> LOADING BIOME NETWORK CORES...',
  '> CONNECTING TO AMRITKRISHI DB...',
  '> CALIBRATING SOIL SENSOR ARRAY...',
  '> ESTABLISHING PHOTOSYNTHESIS UPLINK...',
  '> CROSS-REFERENCING PATHOGEN DATABASE...',
  '> LOADING MARKET INTELLIGENCE MODULE...',
  '> MULTILINGUAL PROTOCOL: TAMIL // HINDI // ENGLISH',
  '> BIOME CONSENSUS ACHIEVED...',
  '> ALL SYSTEMS GROWING.',
  '> ECOSYSTEM 2.0 ONLINE.',
]

export default function MagiIntro({ onComplete }) {
  const canvasRef   = useRef(null)
  const overlayRef  = useRef(null)
  const [logs,      setLogs]      = useState([])
  const [magiState, setMagiState] = useState([false, false, false])
  const [showLogo,  setShowLogo]  = useState(false)
  const [showSkip,  setShowSkip]  = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [phase,     setPhase]     = useState('booting')
  const doneRef     = useRef(false)

  const handleComplete = () => {
    if (doneRef.current) return
    doneRef.current = true
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.8, ease: 'power2.in',
      onComplete: onComplete
    })
  }

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 1000)

    const canvas = canvasRef.current
    const W = canvas.clientWidth  || window.innerWidth
    const H = canvas.clientHeight || window.innerHeight

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100)
    camera.position.set(0, 0, 5)

    // Make circle cell geometry instead of hex
    const makeCell = (radius, color) => {
      const geo = new THREE.CircleGeometry(radius, 64)
      const matLine = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 })
      const matFill = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide })
      
      const edges = new THREE.EdgesGeometry(geo)
      const cellLine = new THREE.LineSegments(edges, matLine)
      const cellFill = new THREE.Mesh(geo, matFill)
      
      return { hexLine: cellLine, hexFill: cellFill, matLine, matFill }
    }

    const cells = ECO_SYSTEMS.map((sys, i) => {
      const cell = makeCell(0.9, sys.color)
      const xPos = (i - 1) * 2.4
      cell.hexLine.position.set(xPos, 0, 0)
      cell.hexFill.position.set(xPos, 0, -0.1)
      cell.hexLine.scale.set(0, 0, 0)
      cell.hexFill.scale.set(0, 0, 0)
      scene.add(cell.hexLine)
      scene.add(cell.hexFill)
      return cell
    })

    const particleCount = 800
    const positions     = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2
    }
    const pGeo  = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pMat  = new THREE.PointsMaterial({ color: 'var(--secondary)', size: 0.04, transparent: true, opacity: 0.4 })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    const gridHelper = new THREE.GridHelper(20, 30, 'var(--primary-glow)', 'var(--primary-glow)')
    gridHelper.position.y = -2
    gridHelper.material.transparent = true
    gridHelper.material.opacity     = 0
    scene.add(gridHelper)

    let frameId
    const clock = new THREE.Clock()
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      cells.forEach((cell, i) => {
        cell.hexFill.scale.x = 1 + Math.sin(t * 2 + i) * 0.05
        cell.hexFill.scale.y = 1 + Math.sin(t * 2 + i) * 0.05
      })

      particles.rotation.y = t * 0.02
      particles.rotation.x = t * 0.01

      gridHelper.material.opacity = 0.3 + Math.sin(t * 2) * 0.1

      renderer.render(scene, camera)
    }
    animate()

    const tl = gsap.timeline()
    tl.to(gridHelper.material, { opacity: 0.4, duration: 0.8 }, 0.3)

    ECO_SYSTEMS.forEach((sys, i) => {
      const delay  = 0.5 + i * 1.2
      const cell   = cells[i]

      tl.to(cell.hexLine.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.7)' }, delay)
      tl.to(cell.hexFill.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out(1.7)' }, delay)
      tl.to(cell.matLine, { opacity: 1, duration: 0.4 }, delay)
      tl.to(cell.matFill, { opacity: 0.12, duration: 0.4 }, delay + 0.2)
      tl.call(() => {
        setMagiState(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
        setProgress((i + 1) / 3 * 60)
      }, null, delay + 0.5)
    })

    tl.to(camera.position, { z: 7, duration: 1.5, ease: 'power2.inOut' }, 3.5)
    tl.call(() => setPhase('logging'), null, 4.2)

    BOOT_LOGS.forEach((log, i) => {
      tl.call(() => {
        setLogs(prev => [...prev, log])
        setProgress(60 + (i / BOOT_LOGS.length) * 35)
      }, null, 4.5 + i * 0.22)
    })

    tl.call(() => {
      setShowLogo(true)
      setProgress(100)
      setPhase('complete')
    }, null, 4.5 + BOOT_LOGS.length * 0.22 + 0.3)

    tl.to(camera.position, { z: 4, duration: 1, ease: 'power2.in' }, 4.5 + BOOT_LOGS.length * 0.22 + 0.3)
    tl.call(() => handleComplete(), null, 4.5 + BOOT_LOGS.length * 0.22 + 2.5)

    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(skipTimer)
      cancelAnimationFrame(frameId)
      renderer.dispose()
      window.removeEventListener('resize', onResize)
      tl.kill()
    }
  }, [])

  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)', overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.07) 2px, rgba(34,197,94,0.07) 4px)'
      }} />

      <div style={{
        position: 'absolute', top: '12%', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 32,
        pointerEvents: 'none'
      }}>
        {ECO_SYSTEMS.map((sys, i) => (
          <div key={i} style={{
            textAlign: 'center', opacity: magiState[i] ? 1 : 0.15,
            transition: 'opacity 0.5s', width: 140
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: magiState[i] ? sys.color : 'var(--border)',
              boxShadow: magiState[i] ? `0 0 12px ${sys.color}` : 'none',
              margin: '0 auto 6px',
              animation: magiState[i] ? 'pulse 1.5s infinite' : 'none'
            }} />
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11, color: sys.color, fontWeight:700, letterSpacing:3, margin:'0 0 2px' }}>
              {sys.name}
            </p>
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8, color:'rgba(134,239,172,0.5)', letterSpacing:2, margin:'0 0 4px' }}>
              {sys.subtitle}
            </p>
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8, color: magiState[i] ? 'var(--secondary)' : 'var(--border)', letterSpacing:1, margin:0 }}>
              {magiState[i] ? '● GROWING' : '○ DORMANT'}
            </p>
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:7, color:'var(--primary-dim)', letterSpacing:1, margin:'4px 0 0' }}>
              {sys.status}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 180, left: '50%', transform: 'translateX(-50%)',
        width: '60%', maxHeight: 160, overflow: 'hidden', pointerEvents: 'none'
      }}>
        {logs.map((log, i) => (
          <p key={i} style={{
            fontFamily: "'Share Tech Mono'", fontSize: 11,
            color: i === logs.length - 1 ? 'var(--secondary)' : 'var(--primary-dim)',
            letterSpacing: 1, margin: '2px 0',
            animation: i === logs.length - 1 ? 'flicker 0.3s' : 'none'
          }}>
            {log}
          </p>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 140, left: '50%', transform: 'translateX(-50%)', width: '60%' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'var(--primary-dim)', letterSpacing:2 }}>
            // SEED GERMINATION PHASE
          </span>
          <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'var(--primary)', letterSpacing:2 }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div style={{ height:3, background:'rgba(34,197,94,0.1)', borderRadius:1 }}>
          <div style={{
            height:'100%', borderRadius:1, width:`${progress}%`,
            background:'linear-gradient(90deg, var(--text-muted), var(--primary))',
            boxShadow:'0 0 8px rgba(34,197,94,0.5)', transition:'width 0.3s ease'
          }} />
        </div>
      </div>

      {showLogo && (
        <div style={{
          position:'absolute', bottom:60, left:0, right:0, textAlign:'center',
          animation:'logoIn 0.8s ease forwards'
        }}>
          <p className="logo-glitch-in" style={{
            fontFamily:"'Exo 2'", fontSize:32, fontWeight:900,
            color:'var(--secondary)', letterSpacing:12, margin:'0 0 4px',
            textShadow:'0 0 30px rgba(34,197,94,0.5), 0 0 60px var(--border-hover)'
          }}>
            AMRITKRISHI
          </p>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11, color:'rgba(134,239,172,0.5)', letterSpacing:6, margin:0 }}>
            ECOSYSTEM INTELLIGENCE v2.0
          </p>
        </div>
      )}

      {showSkip && (
        <button onClick={handleComplete} style={{
          position:'absolute', top:20, right:20, background:'transparent', border:'1px solid var(--border-hover)',
          color:'rgba(34,197,94,0.6)', fontFamily:"'Share Tech Mono'", fontSize:10, letterSpacing:3, padding:'6px 14px',
          cursor:'pointer', borderRadius:2, transition:'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-hover)'; e.currentTarget.style.color='rgba(34,197,94,0.6)' }}>
          SKIP ►
        </button>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes flicker { 0%{opacity:0}25%{opacity:1}50%{opacity:0.5}75%{opacity:1}100%{opacity:1} }
        @keyframes logoIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
