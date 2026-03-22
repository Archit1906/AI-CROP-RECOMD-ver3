import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import ATFieldCrack from './ATFieldCrack'

export default function EvaLaunch({ onComplete }) {
  const canvasRef    = useRef(null)
  const overlayRef   = useRef(null)
  const flashRef     = useRef(null)
  const shakeRef     = useRef(null)
  const doneRef      = useRef(false)

  const [countdown,  setCountdown]  = useState(3)
  const [showCount,  setShowCount]  = useState(true)
  const [phase,      setPhase]      = useState('standby')
  const [warning,    setWarning]    = useState(false)
  const [logLines,   setLogLines]   = useState([])
  const [showLogo,   setShowLogo]   = useState(false)
  const [logoText,   setLogoText]   = useState('')
  const [showSkip,   setShowSkip]   = useState(false)
  const [redBorder,  setRedBorder]  = useState(false)
  const [showSub,    setShowSub]    = useState(false)
  const [showCrack,  setShowCrack]  = useState(false)
  const [crackDone,  setCrackDone]  = useState(false)

  const FULL_LOGO   = 'AMRITKRISHI'
  const LOGO_SUB    = 'ECOSYSTEM INTELLIGENCE // v2.0'

  const handleComplete = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.8, ease: 'power2.in',
      onComplete
    })
  }, [onComplete])

  const handleShatterComplete = useCallback(() => {
    setCrackDone(true)
    handleComplete()
  }, [handleComplete])

  const typeLogo = useCallback(() => {
    let i = 0
    const interval = setInterval(() => {
      setLogoText(FULL_LOGO.slice(0, i + 1))
      i++
      if (i >= FULL_LOGO.length) {
        clearInterval(interval)
        setTimeout(() => setShowSub(true), 200)
      }
    }, 60)
  }, [])

  useEffect(() => {
    setTimeout(() => setShowSkip(true), 1000)

    const canvas   = canvasRef.current
    const W        = window.innerWidth
    const H        = window.innerHeight
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x020D05, 1)

    const scene  = new THREE.Scene()
    scene.fog    = new THREE.Fog(0x020D05, 10, 80)

    const camera = new THREE.PerspectiveCamera(90, W / H, 0.1, 300)
    camera.position.set(0, 120, 0)
    camera.lookAt(0, 0, 0)

    const TUNNEL_RADIUS = 8
    const SHAFT_COUNT   = 32
    const shaftGroup    = new THREE.Group()

    for (let i = 0; i < SHAFT_COUNT; i++) {
      const angle  = (i / SHAFT_COUNT) * Math.PI * 2
      const x      = Math.cos(angle) * TUNNEL_RADIUS
      const z      = Math.sin(angle) * TUNNEL_RADIUS
      const points = [
        new THREE.Vector3(x, -300, z),
        new THREE.Vector3(x,  300, z),
      ]
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: i % 4 === 0 ? '#22C55E' : '#16A34A33',
        transparent: true,
        opacity: i % 4 === 0 ? 0.9 : 0.3
      })
      shaftGroup.add(new THREE.Line(geo, mat))
    }
    scene.add(shaftGroup)

    const RING_COUNT  = 120
    const ringMeshes  = []
    for (let r = 0; r < RING_COUNT; r++) {
      const ringPts = []
      const segs    = 48
      const yPos    = -300 + r * (600 / RING_COUNT)
      const isMajor = r % 8 === 0
      const rad     = isMajor ? TUNNEL_RADIUS + 0.3 : TUNNEL_RADIUS

      for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * Math.PI * 2
        ringPts.push(new THREE.Vector3(
          Math.cos(a) * rad, yPos, Math.sin(a) * rad
        ))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(ringPts)
      const mat = new THREE.LineBasicMaterial({
        color: isMajor ? '#4ADE80' : '#22C55E44',
        transparent: true,
        opacity: isMajor ? 1.0 : 0.4
      })
      const ring = new THREE.Line(geo, mat)
      ringMeshes.push({ mesh: ring, mat, isMajor })
      scene.add(ring)
    }

    const cylGeo = new THREE.CylinderGeometry(
      TUNNEL_RADIUS - 0.5, TUNNEL_RADIUS - 0.5, 600, 32, 1, true
    )
    const cylMat = new THREE.MeshBasicMaterial({
      color: '#22C55E', transparent: true, opacity: 0.03, side: THREE.BackSide
    })
    scene.add(new THREE.Mesh(cylGeo, cylMat))

    const SPARK_N  = 1500
    const sPos     = new Float32Array(SPARK_N * 3)
    const sVel     = new Float32Array(SPARK_N)
    const sColors  = new Float32Array(SPARK_N * 3)

    for (let i = 0; i < SPARK_N; i++) {
      const angle  = Math.random() * Math.PI * 2
      const r      = 1 + Math.random() * (TUNNEL_RADIUS - 2)
      sPos[i*3]    = Math.cos(angle) * r
      sPos[i*3+1]  = (Math.random() - 0.5) * 600
      sPos[i*3+2]  = Math.sin(angle) * r
      sVel[i]      = 1 + Math.random() * 3
      sColors[i*3]   = 0.3 + Math.random() * 0.5   
      sColors[i*3+1] = 0.8 + Math.random() * 0.2   
      sColors[i*3+2] = Math.random() * 0.3         
    }

    const sGeo = new THREE.BufferGeometry()
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
    sGeo.setAttribute('color',    new THREE.BufferAttribute(sColors, 3))
    const sMat = new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.9
    })
    const sparks = new THREE.Points(sGeo, sMat)
    scene.add(sparks)

    const makeShockRing = (radius, color) => {
      const pts = []
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
      }
      const geo  = new THREE.BufferGeometry().setFromPoints(pts)
      const mat  = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 })
      const ring = new THREE.Line(geo, mat)
      ring.position.y = 0.5
      scene.add(ring)
      return { ring, mat }
    }

    const shock1 = makeShockRing(0.1, '#4ADE80')
    const shock2 = makeShockRing(0.1, '#22C55E')
    const shock3 = makeShockRing(0.1, '#FFFFFF')

    const bottomLight = new THREE.PointLight('#4ADE80', 0, 40)
    bottomLight.position.set(0, 1, 0)
    scene.add(bottomLight)

    let camSpeed   = 0
    let sparkSpeed = 1
    let rotating   = false
    let frameId

    const clock = new THREE.Clock()

    const animLoop = () => {
      frameId = requestAnimationFrame(animLoop)
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      ringMeshes.forEach(({ mesh }) => {
        mesh.position.y -= camSpeed * delta * 80
        if (mesh.position.y < -300) mesh.position.y += 600
      })

      const pos = sparks.geometry.attributes.position.array
      for (let i = 0; i < SPARK_N; i++) {
        pos[i*3+1] += sVel[i] * sparkSpeed * delta * 25
        if (pos[i*3+1] > 300) pos[i*3+1] = -300
      }
      sparks.geometry.attributes.position.needsUpdate = true

      shaftGroup.rotation.y += delta * (rotating ? 0.8 : 0.15)
      bottomLight.intensity = Math.max(0, Math.sin(elapsed * 6) * 2)

      renderer.render(scene, camera)
    }
    animLoop()

    const shake = (intensity, duration) => {
      if (!shakeRef.current) return
      const el = shakeRef.current
      const start = performance.now()
      const shakeLoop = (now) => {
        const t = (now - start) / (duration * 1000)
        if (t >= 1) { el.style.transform = 'translate(0,0)'; return }
        const decay = 1 - t
        const x = (Math.random() - 0.5) * intensity * decay * 2
        const y = (Math.random() - 0.5) * intensity * decay * 2
        el.style.transform = `translate(${x}px, ${y}px)`
        requestAnimationFrame(shakeLoop)
      }
      requestAnimationFrame(shakeLoop)
    }

    const whiteFlash = (duration = 0.15) => {
      if (!flashRef.current) return
      gsap.to(flashRef.current, { opacity: 1, duration: 0.04 })
      gsap.to(flashRef.current, { opacity: 0, duration, delay: 0.04 })
    }

    const tl = gsap.timeline()

    tl.call(() => setCountdown(3), null, 0)
    tl.call(() => { setCountdown(2); setWarning(true) }, null, 1.0)
    tl.call(() => { setCountdown(1); setRedBorder(true) }, null, 2.0)
    tl.call(() => {
      setCountdown(0)
      setShowCount(false)
      setPhase('launch')
      setWarning(false)
      setRedBorder(false)
    }, null, 3.0)

    tl.call(() => {
      camSpeed   = 0.2
      sparkSpeed = 2
      setLogLines(['> GERMINATION SYSTEM PRIMED'])
    }, null, 3.0)

    tl.to({}, {
      duration: 0.8,
      onUpdate: function() {
        const p    = this.progress()
        camSpeed   = 0.2 + p * 3
        sparkSpeed = 2   + p * 15
        bottomLight.intensity = p * 5
      }
    }, 3.0)

    tl.call(() => setLogLines(p => [...p, '> NUTRIENT FLOW AT FULL CAPACITY']), null, 3.3)
    tl.call(() => setLogLines(p => [...p, '> SPROUTING IN 3..2..1..']), null, 3.6)

    tl.call(() => {
      setPhase('rush')
      rotating   = true
      camSpeed   = 8
      sparkSpeed = 30
      setRedBorder(true)
    }, null, 3.8)

    tl.call(() => setLogLines(p => [...p, '> /////////////// 100%']), null, 3.9)

    tl.to(camera.position, { y: 1, duration: 0.7, ease: 'power4.in' }, 3.8)

    tl.call(() => {
      setPhase('impact')
      camSpeed   = 0
      sparkSpeed = 0
      rotating   = false
      setRedBorder(false)

      whiteFlash(0.3)
      shake(25, 0.6)

      gsap.to(bottomLight, { intensity: 20, duration: 0.05 })
      gsap.to(bottomLight, { intensity: 0,  duration: 0.5, delay: 0.05 })

      const expandShock = (shock, delay, scale, color) => {
        gsap.to(shock.mat, { opacity: 0.9, duration: 0.05, delay })
        gsap.to(shock.ring.scale, { x: scale, z: scale, duration: 1.2, delay, ease: 'power2.out' })
        gsap.to(shock.mat, { opacity: 0, duration: 1.0, delay: delay + 0.1 })
      }
      expandShock(shock1, 0,    80, '#4ADE80')
      expandShock(shock2, 0.08, 60, '#22C55E')
      expandShock(shock3, 0.04, 40, '#FFFFFF')

      setLogLines(p => [...p, '> SURFACE BREACHED // PHOTOSYNTHESIS ONLINE'])
    }, null, 4.5)

    tl.to(camera.position, { y: 0.3, duration: 0.08, ease: 'power4.out' }, 4.5)
    tl.to(camera.position, { y: 4,   duration: 0.6,  ease: 'elastic.out(1,0.4)' }, 4.58)
    tl.to(camera.rotation, { x: -Math.PI / 2 + 0.15, duration: 0.8, ease: 'power2.out' }, 4.6)
    tl.call(() => shake(10, 0.3), null, 4.7)

    tl.call(() => {
      setRedBorder(true)
      setTimeout(() => setRedBorder(false), 200)
    }, null, 4.5)

    tl.call(() => {
      setPhase('reveal')
      setShowLogo(true)
      whiteFlash(0.05)
      shake(8, 0.2)
      typeLogo()
    }, null, 5.3)

    tl.call(() => {
      setShowCrack(true)
    }, null, 5.3 + FULL_LOGO.length * 0.06 + 0.8)

    tl.to(camera.rotation, { y: 0.08, duration: 4, ease: 'power1.inOut' }, 5.3)

    tl.call(() => handleComplete(), null, 12.0)

    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      renderer.dispose()
      window.removeEventListener('resize', onResize)
      tl.kill()
    }
  }, [handleComplete, typeLogo])

  return (
    <div ref={overlayRef} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'#020D05', overflow:'hidden'
    }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />

      <div ref={shakeRef} style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{
          position:'absolute', inset:0,
          background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.1) 2px, rgba(34,197,94,0.1) 4px)',
          pointerEvents:'none'
        }} />

        {redBorder && (
          <div style={{
            position:'absolute', inset:0, border:'4px solid #4ADE80',
            boxShadow:'inset 0 0 40px rgba(74,222,128,0.3), 0 0 40px rgba(74,222,128,0.3)',
            pointerEvents:'none', animation:'borderFlash 0.1s infinite'
          }} />
        )}

        {showCount && (
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'rgba(34,197,94,0.6)', letterSpacing:4, margin:'0 0 12px' }}>
              // GERMINATION PROTOCOL ACTIVE
            </p>
            <div style={{
              fontFamily:"'Share Tech Mono'", fontSize:120, fontWeight:900,
              color: countdown <= 1 ? '#4ADE80' : countdown <= 2 ? '#86EFAC' : '#22C55E',
              lineHeight:1, margin:'0 0 8px',
              textShadow:`0 0 40px ${countdown <= 1 ? '#4ADE80' : '#22C55E'}`,
              animation:'countPulse 0.9s ease infinite'
            }}>
              {countdown}
            </div>
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11, color:'rgba(34,197,94,0.4)', letterSpacing:6, margin:0 }}>
              {countdown === 3 && 'STANDBY'}
              {countdown === 2 && 'CHARGING'}
              {countdown === 1 && 'SPROUT IMMINENT'}
            </p>
          </div>
        )}

        {!showCount && (
          <div style={{ position:'absolute', top:24, left:24 }}>
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8, color:'rgba(34,197,94,0.4)', letterSpacing:4, margin:'0 0 4px' }}>
              // BIOME LAUNCH CONTROL
            </p>
            <p style={{
              fontFamily:"'Share Tech Mono'", fontSize:14, fontWeight:700,
              color:'#22C55E', letterSpacing:3, margin:0, textShadow:'0 0 10px rgba(34,197,94,0.5)',
              animation: phase === 'rush' ? 'glitchText 0.15s infinite' : 'none'
            }}>
              {phase === 'launch' && '▶ ROOTS EXPANDING'}
              {phase === 'rush'   && '▶▶▶ STEM GROWTH ERECTING'}
              {phase === 'impact' && '█ SURFACE BREACH'}
              {phase === 'reveal' && '● LEAVES SPROUTED'}
            </p>
          </div>
        )}

        <div style={{ position:'absolute', bottom:80, left:24, pointerEvents:'none' }}>
          {logLines.map((line, i) => (
            <p key={i} style={{
              fontFamily:"'Share Tech Mono'", fontSize:10,
              color: i === logLines.length - 1 ? '#4ADE80' : 'rgba(34,197,94,0.5)',
              letterSpacing:1, margin:'2px 0', fontWeight: i === logLines.length - 1 ? 700 : 400
            }}>
              {line}
            </p>
          ))}
        </div>

        {showLogo && (
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', width:'90%' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              <p style={{
                position:'absolute', top:0, left:0, fontFamily:"'Exo 2'", fontSize:'clamp(28px,5vw,60px)',
                fontWeight:900, color:'#4ADE80', letterSpacing:12, margin:0, transform:'translateX(-4px)',
                opacity:0.5, pointerEvents:'none', whiteSpace:'nowrap'
              }}>{logoText}</p>
              <p style={{
                position:'absolute', top:0, left:0, fontFamily:"'Exo 2'", fontSize:'clamp(28px,5vw,60px)',
                fontWeight:900, color:'#86EFAC', letterSpacing:12, margin:0, transform:'translateX(4px)',
                opacity:0.5, pointerEvents:'none', whiteSpace:'nowrap'
              }}>{logoText}</p>
              <p style={{
                fontFamily:"'Exo 2'", fontSize:'clamp(28px,5vw,60px)', fontWeight:900, color:'#22C55E',
                letterSpacing:12, margin:0, textShadow:'0 0 40px #22C55E, 0 0 80px rgba(34,197,94,0.5)',
                position:'relative', zIndex:1, whiteSpace:'nowrap'
              }}>
                {logoText}
                {logoText.length < FULL_LOGO.length && <span style={{ animation:'blink 0.4s infinite', color:'#22C55E' }}>█</span>}
              </p>
            </div>

            <div style={{ width:'80%', height:1, margin:'12px auto', background:'linear-gradient(90deg, transparent, #22C55E, transparent)', animation:'lineExpand 0.6s ease forwards' }} />

            {showSub && (
              <>
                <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:'rgba(134,239,172,0.6)', letterSpacing:4, margin:'0 0 20px', animation:'fadeUp 0.4s ease forwards' }}>
                  {LOGO_SUB}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxWidth:600, margin:'0 auto', animation:'fadeUp 0.5s ease 0.1s both' }}>
                  {[
                    { icon:'🌾', label:'CROP AI',     color:'#22C55E' },
                    { icon:'🔬', label:'BIODETECT',   color:'#4ADE80' },
                    { icon:'🌤️', label:'WEATHER',     color:'#86EFAC' },
                    { icon:'📊', label:'MARKET',      color:'#A3E635' },
                  ].map(f => (
                    <div key={f.label} style={{ border:`1px solid ${f.color}33`, background:`${f.color}11`, borderRadius:2, padding:'8px 4px', textAlign:'center' }}>
                      <div style={{ fontSize:16, marginBottom:4 }}>{f.icon}</div>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8, color:f.color, letterSpacing:2, margin:0 }}>{f.label}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:'rgba(34,197,94,0.6)', letterSpacing:3, margin:'20px 0 0', animation:'blink 1.2s infinite' }}>
                  ▶ TAP ROOT TO ENTER BIOME
                </p>
              </>
            )}
          </div>
        )}

        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(34,197,94,0.1)' }}>
          <div style={{ height:'100%', background:'#22C55E', boxShadow:'0 0 8px #22C55E', animation:'progressFill 9.5s linear forwards' }} />
        </div>

        {showSkip && (
          <button onClick={handleComplete} style={{
            position:'absolute', top:20, right:20, background:'transparent', border:'1px solid rgba(34,197,94,0.3)',
            color:'rgba(34,197,94,0.6)', fontFamily:"'Share Tech Mono'", fontSize:10, letterSpacing:3, padding:'6px 14px',
            cursor:'pointer', borderRadius:2, transition:'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#22C55E'; e.currentTarget.style.color='#22C55E' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(34,197,94,0.3)'; e.currentTarget.style.color='rgba(34,197,94,0.6)' }}>
            SKIP ►
          </button>
        )}
      </div>

      <div ref={flashRef} style={{ position:'absolute', inset:0, background:'white', opacity:0, pointerEvents:'none', zIndex:10 }} />

      {showCrack && !crackDone && <ATFieldCrack onShatterComplete={handleShatterComplete} />}

      {showCrack && (
        <div style={{ position:'fixed', inset:0, zIndex:10001, pointerEvents:'none', overflow:'hidden' }}>
          {Array.from({length:20}).map((_, i) => (
            <div key={i} style={{
              position:'absolute', top:'50%', left:'50%', width: 4 + Math.random() * 6, height: 4 + Math.random() * 6,
              background:'#4ADE80', borderRadius:'50%', boxShadow:'0 0 12px #4ADE80',
              animation:`burst${i} 1s ease-out forwards`,
            }} />
          ))}
          <style>{`
            ${Array.from({length:20}).map((_, i) => `
              @keyframes burst${i} {
                0%  { transform:translate(-50%,-50%) scale(1); opacity:1 }
                100%{ transform:translate(calc(-50% + ${(Math.random()-0.5)*100}vw), calc(-50% + ${(Math.random()-0.5)*100}vh)) scale(0); opacity:0 }
              }
            `).join('')}
          `}</style>
        </div>
      )}

      <style>{`
        @keyframes countPulse { 0%,100%{ transform:scale(1) } 50% { transform:scale(1.05) } }
        @keyframes glitchText {
          0%  { transform:translateX(3px);  color:#22C55E }
          25% { transform:translateX(-3px); color:#4ADE80 }
          50% { transform:translateX(2px);  color:#22C55E }
          75% { transform:translateX(-2px); color:#86EFAC }
          100%{ transform:translateX(0);    color:#22C55E }
        }
        @keyframes borderFlash { 0%,100%{ opacity:1 } 50% { opacity:0.5 } }
        @keyframes blink { 0%,100%{ opacity:1 } 50% { opacity:0 } }
        @keyframes fadeUp { from{ opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes lineExpand { from{ transform:scaleX(0) } to { transform:scaleX(1) } }
        @keyframes progressFill { from{ width:0% } to { width:100% } }
      `}</style>
    </div>
  )
}
