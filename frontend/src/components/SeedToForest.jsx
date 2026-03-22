import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function SeedToForest({ onComplete }) {
  const mountRef = useRef(null)
  const [phase,  setPhase] = useState('falling')

  useEffect(() => {
    if (!mountRef.current) return

    const W = window.innerWidth
    const H = window.innerHeight

    // ── RENDERER ─────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(W, H)
    renderer.setClearColor(0x010804, 1)
    mountRef.current.appendChild(renderer.domElement)

    // ── SCENE + CAMERA ────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 100)
    camera.position.set(0, 1, 7)
    camera.lookAt(0, 0, 0)

    // ── LIGHTS ────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0x113311, 2)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0x22C55E, 3)
    sun.position.set(5, 10, 5)
    scene.add(sun)

    const fill = new THREE.DirectionalLight(0x4ADE80, 1)
    fill.position.set(-5, 3, -5)
    scene.add(fill)

    const seedPtLight = new THREE.PointLight(0x22C55E, 4, 10)
    seedPtLight.position.set(0, 3, 0)
    scene.add(seedPtLight)

    // ── GROUND ────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(30, 30)
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x0a2a0a })
    const ground    = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -2
    scene.add(ground)

    // ── SEED ──────────────────────────────────────────────
    const seedGeo = new THREE.SphereGeometry(0.25, 16, 16)
    seedGeo.scale(1, 1.4, 1)
    const seedMat = new THREE.MeshPhongMaterial({
      color: 0x22C55E, emissive: 0x0a3a0a, shininess: 100
    })
    const seed = new THREE.Mesh(seedGeo, seedMat)
    seed.position.set(0, 5, 0)
    scene.add(seed)

    // ── TRUNK ─────────────────────────────────────────────
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.22, 5, 10)
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x15803D })
    const trunk    = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.y = 0.5
    trunk.scale.y    = 0.001
    scene.add(trunk)

    // ── CANOPY LAYERS ─────────────────────────────────────
    const canopies = [
      { y: 2.5, r: 2.2, color: 0x15803D },
      { y: 3.4, r: 2.6, color: 0x16A34A },
      { y: 4.2, r: 2.2, color: 0x22C55E },
      { y: 4.9, r: 1.6, color: 0x4ADE80 },
      { y: 5.5, r: 1.0, color: 0x86EFAC },
    ].map(({ y, r, color }) => {
      const geo  = new THREE.SphereGeometry(r, 12, 10)
      const mat  = new THREE.MeshLambertMaterial({ color })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.y = y
      mesh.scale.setScalar(0.001)
      scene.add(mesh)
      return mesh
    })

    // ── BRANCHES ──────────────────────────────────────────
    const branches = []
    for (let i = 0; i < 6; i++) {
      const angle  = (i / 6) * Math.PI * 2
      const height = 1 + i * 0.6
      const bGeo   = new THREE.CylinderGeometry(0.04, 0.08, 1.5, 6)
      const bMat   = new THREE.MeshLambertMaterial({ color: 0x166534 })
      const branch = new THREE.Mesh(bGeo, bMat)
      branch.position.set(
        Math.cos(angle) * 0.3,
        height,
        Math.sin(angle) * 0.3
      )
      branch.rotation.z = Math.cos(angle) * 0.6
      branch.rotation.x = Math.sin(angle) * 0.6
      branch.scale.setScalar(0.001)
      scene.add(branch)
      branches.push(branch)
    }

    // ── PARTICLES ─────────────────────────────────────────
    const partCount = 400
    const partPos   = new Float32Array(partCount * 3)
    for (let i = 0; i < partCount; i++) {
      partPos[i*3]   = (Math.random() - 0.5) * 14
      partPos[i*3+1] = Math.random() * 10 - 1
      partPos[i*3+2] = (Math.random() - 0.5) * 14
    }
    const partGeo = new THREE.BufferGeometry()
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3))
    const partMat = new THREE.PointsMaterial({
      color: 0x4ADE80, size: 0.06,
      transparent: true, opacity: 0
    })
    scene.add(new THREE.Points(partGeo, partMat))

    // ── STATE MACHINE ─────────────────────────────────────
    // States: 'falling' → 'rooting' → 'growing' → 'done'
    let state      = 'falling'
    let growTimer  = 0
    let frameId

    // ── RENDER LOOP ───────────────────────────────────────
    let t = 0
    const loop = () => {
      frameId = requestAnimationFrame(loop)
      t      += 0.016

      if (state === 'falling') {
        // Drop seed with gravity
        seed.position.y -= 0.08
        seedPtLight.position.y = seed.position.y

        // Seed rotation while falling
        seed.rotation.z += 0.04

        // Hit ground
        if (seed.position.y <= -1.7) {
          seed.position.y       = -1.7
          seedPtLight.intensity = 8  // flash on impact
          state                 = 'rooting'
          setPhase('rooting')

          // Camera shake effect
          camera.position.y += 0.15
        }
      }

      if (state === 'rooting') {
        growTimer += 0.016

        // Seed pulses
        const pulse = 1 + Math.sin(t * 8) * 0.1
        seed.scale.setScalar(pulse)
        seedPtLight.intensity = 4 + Math.sin(t * 6) * 2

        // After 1 second start growing
        if (growTimer > 1.0) {
          state     = 'growing'
          growTimer = 0
          setPhase('growing')
        }
      }

      if (state === 'growing') {
        growTimer += 0.016

        // Progress 0→1 over 4 seconds
        const p = Math.min(1, growTimer / 4)

        // Shrink seed
        seed.scale.setScalar(Math.max(0.001, 1 - p * 2))
        seedPtLight.intensity = Math.max(0, 4 - p * 5)

        // Grow trunk
        trunk.scale.y = Math.min(1, p * 2.5)

        // Grow branches after 30% progress
        if (p > 0.3) {
          const bp = Math.min(1, (p - 0.3) / 0.5)
          branches.forEach((b, i) => {
            b.scale.setScalar(Math.min(1, bp * 1.2 - i * 0.05))
          })
        }

        // Grow canopy after 50% progress
        if (p > 0.5) {
          const cp = Math.min(1, (p - 0.5) / 0.5)
          canopies.forEach((c, i) => {
            c.scale.setScalar(Math.min(1, cp * 1.3 - i * 0.06))
          })
          partMat.opacity = Math.min(0.7, cp * 0.8)
        }

        // Camera pull back as tree grows
        camera.position.z = 7 + p * 8
        camera.position.y = 1 + p * 3
        camera.lookAt(0, 2 + p * 2, 0)

        // Canopy rotation
        canopies.forEach((c, i) => {
          c.rotation.y += 0.003 * (i % 2 === 0 ? 1 : -1)
        })

        // Done
        if (p >= 1) {
          state = 'done'
          setPhase('complete')
          setTimeout(() => onComplete(), 2000)
        }
      }

      if (state === 'done') {
        // Gentle sway
        canopies.forEach((c, i) => {
          c.rotation.y += 0.004 * (i % 2 === 0 ? 1 : -1)
        })
        camera.position.x = Math.sin(t * 0.3) * 0.5
      }

      renderer.render(scene, camera)
    }
    loop()

    // ── RESIZE ────────────────────────────────────────────
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
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 9999, background: '#010804'
    }}>
      <div ref={mountRef} style={{
        position: 'absolute', inset: 0,
        width: '100vw', height: '100vh'
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.05) 2px,rgba(0,0,0,0.05) 4px)'
      }} />

      {/* Phase label */}
      <p style={{
        position: 'absolute', top: 24, left: 32,
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 10, letterSpacing: 4,
        color: 'rgba(74,222,128,0.5)', margin: 0, zIndex: 2
      }}>
        {phase === 'falling'  && '// SEED DETECTED...'}
        {phase === 'rooting'  && '// ROOT NETWORK SPREADING...'}
        {phase === 'growing'  && '// GROWTH SEQUENCE ACTIVE...'}
        {phase === 'complete' && '// ECOSYSTEM ONLINE'}
      </p>

      {/* Logo */}
      {phase === 'complete' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(1,8,4,0.6)',
          animation: 'fadeIn 0.8s ease forwards'
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🌿</div>
          <h1 style={{
            fontFamily: "'Cabinet Grotesk',sans-serif",
            fontSize: 64, fontWeight: 900, letterSpacing: -1,
            background: 'linear-gradient(135deg,#4ADE80,#22C55E,#A3E635)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px',
            filter: 'drop-shadow(0 0 40px rgba(74,222,128,0.5))'
          }}>
            AMRITKRISHI
          </h1>
          <p style={{
            fontFamily: "'Share Tech Mono'",
            fontSize: 12, letterSpacing: 6,
            color: 'rgba(134,239,172,0.6)', margin: 0
          }}>
            ECO INTELLIGENCE SYSTEM // v2.0
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3, background: 'rgba(34,197,94,0.1)', zIndex: 2
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg,#22C55E,#4ADE80)',
          boxShadow: '0 0 8px rgba(74,222,128,0.6)',
          transition: 'width 0.5s ease',
          width: phase === 'falling'  ? '15%' :
                 phase === 'rooting'  ? '35%' :
                 phase === 'growing'  ? '75%' : '100%'
        }} />
      </div>

      {/* Skip */}
      <button onClick={onComplete} style={{
        position: 'absolute', top: 20, right: 20, zIndex: 4,
        background: 'rgba(34,197,94,0.08)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 8, color: 'rgba(74,222,128,0.7)',
        fontFamily: "'Share Tech Mono'",
        fontSize: 10, letterSpacing: 3,
        padding: '7px 16px', cursor: 'pointer'
      }}>
        SKIP ►
      </button>

      <style>{`
        @keyframes fadeIn {
          from{opacity:0;transform:scale(0.95)}
          to{opacity:1;transform:scale(1)}
        }
      `}</style>
    </div>
  )
}
