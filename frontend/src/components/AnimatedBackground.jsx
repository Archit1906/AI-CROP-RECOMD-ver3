import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    let animFrame
    let scrollY = 0
    let time    = 0

    // Track scroll
    const onScroll = () => { scrollY = window.scrollY }
    window.addEventListener('scroll', onScroll)

    // ── GRID LINES ───────────────────────────────────────────
    // Perspective grid that moves with scroll
    const drawGrid = () => {
      const horizon = H * 0.5 + scrollY * 0.05
      const vanishX = W / 2
      const LINES   = 20
      const SPEED   = (time * 0.3) % 60

      ctx.strokeStyle = 'rgba(255,102,0,0.08)'
      ctx.lineWidth   = 0.5

      // Horizontal lines (perspective)
      for (let i = 0; i < LINES; i++) {
        const t   = (i / LINES + SPEED / 100) % 1
        const ease = Math.pow(t, 2)
        const y   = horizon + ease * (H - horizon)
        const xSpread = ease * W * 1.5

        ctx.beginPath()
        ctx.moveTo(vanishX - xSpread / 2, y)
        ctx.lineTo(vanishX + xSpread / 2, y)
        ctx.stroke()
      }

      // Vertical lines (perspective)
      for (let i = -8; i <= 8; i++) {
        const xAngle = i / 8
        ctx.beginPath()
        ctx.moveTo(vanishX, horizon)
        ctx.lineTo(vanishX + xAngle * W, H)
        ctx.stroke()
      }
    }

    // ── PARTICLES ────────────────────────────────────────────
    const PARTICLE_COUNT = 120
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x:     Math.random() * W,
      y:     Math.random() * H * 3,  // spread across full page height
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    -0.2 - Math.random() * 0.4,
      size:  0.5 + Math.random() * 2,
      color: i % 5 === 0 ? [0, 255, 255]     :  // cyan
             i % 5 === 1 ? [255, 0, 51]       :  // red
             i % 5 === 2 ? [255, 215, 0]      :  // gold
                           [255, 102, 0],         // orange
      alpha: 0.1 + Math.random() * 0.5,
      pulse: Math.random() * Math.PI * 2
    }))

    const drawParticles = () => {
      particles.forEach(p => {
        // Only draw particles near current viewport
        const screenY = p.y - scrollY * 0.3
        if (screenY < -50 || screenY > H + 50) return

        p.x  += p.vx
        p.y  += p.vy
        p.pulse += 0.02

        // Wrap horizontally
        if (p.x < -5) p.x = W + 5
        if (p.x > W + 5) p.x = -5

        // Reset when scrolled past
        if (p.y < -100) p.y = H * 3

        const alpha = p.alpha * (0.7 + Math.sin(p.pulse) * 0.3)
        const size  = p.size  * (0.8 + Math.sin(p.pulse * 1.3) * 0.2)

        ctx.beginPath()
        ctx.arc(p.x, screenY, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha})`
        ctx.fill()

        // Glow for larger particles
        if (p.size > 1.5) {
          ctx.beginPath()
          ctx.arc(p.x, screenY, size * 3, 0, Math.PI * 2)
          const grad = ctx.createRadialGradient(p.x, screenY, 0, p.x, screenY, size * 3)
          grad.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha * 0.3})`)
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = grad
          ctx.fill()
        }
      })
    }

    // ── HEXAGONAL FIELD ──────────────────────────────────────
    const HEX_SIZE  = 40
    const HEX_W     = HEX_SIZE * 2
    const HEX_H     = Math.sqrt(3) * HEX_SIZE
    const hexes = []

    // Pre-compute hex grid positions
    for (let row = -2; row < Math.ceil(H * 3 / HEX_H) + 2; row++) {
      for (let col = -2; col < Math.ceil(W / (HEX_W * 0.75)) + 2; col++) {
        const cx = col * HEX_W * 0.75 + HEX_SIZE
        const cy = row * HEX_H + (col % 2 === 0 ? 0 : HEX_H / 2)
        hexes.push({
          cx, cy,
          phase:    Math.random() * Math.PI * 2,
          speed:    0.005 + Math.random() * 0.01,
          baseAlpha: 0.02 + Math.random() * 0.04
        })
      }
    }

    const drawHexField = () => {
      hexes.forEach(hex => {
        const screenY = hex.cy - scrollY * 0.15

        if (screenY < -HEX_SIZE * 2 || screenY > H + HEX_SIZE * 2) return

        hex.phase += hex.speed
        const alpha = hex.baseAlpha * (0.5 + Math.sin(hex.phase) * 0.5)

        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6
          const x = hex.cx + (HEX_SIZE - 2) * Math.cos(angle)
          const y = screenY + (HEX_SIZE - 2) * Math.sin(angle)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = `rgba(255,102,0,${alpha})`
        ctx.lineWidth   = 0.5
        ctx.stroke()

        // Occasionally fill a hex brightly
        if (Math.sin(hex.phase * 2.3) > 0.97) {
          ctx.fillStyle = `rgba(255,102,0,${alpha * 3})`
          ctx.fill()
        }
      })
    }

    // ── FLOWING ENERGY LINES ─────────────────────────────────
    const ENERGY_LINES = 8
    const energyLines  = Array.from({ length: ENERGY_LINES }, (_, i) => ({
      points:  [],
      color:   i % 3 === 0 ? '255,102,0' :
               i % 3 === 1 ? '0,255,255' : '255,0,51',
      x:       (i / ENERGY_LINES) * W + Math.random() * 100,
      phase:   Math.random() * Math.PI * 2,
      speed:   0.008 + Math.random() * 0.015,
      alpha:   0.15 + Math.random() * 0.2
    }))

    const drawEnergyLines = () => {
      energyLines.forEach(line => {
        line.phase += line.speed
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${line.color},${line.alpha})`
        ctx.lineWidth   = 0.8

        for (let y = 0; y <= H; y += 8) {
          const wave1 = Math.sin(y * 0.01 + line.phase) * 40
          const wave2 = Math.sin(y * 0.02 + line.phase * 1.3) * 20
          const x     = line.x + wave1 + wave2

          y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      })
    }

    // ── SCAN LINE ────────────────────────────────────────────
    let scanY = 0
    const drawScanLine = () => {
      scanY = (scanY + 1.5) % H
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      grad.addColorStop(0,   'rgba(255,102,0,0)')
      grad.addColorStop(0.5, 'rgba(255,102,0,0.04)')
      grad.addColorStop(1,   'rgba(255,102,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, scanY - 20, W, 40)
    }

    // ── CORNER BRACKETS ──────────────────────────────────────
    const drawCornerBrackets = () => {
      const alpha = 0.15 + Math.sin(time * 0.02) * 0.05
      ctx.strokeStyle = `rgba(255,102,0,${alpha})`
      ctx.lineWidth   = 1
      const size = 30

      // Top left
      ctx.beginPath()
      ctx.moveTo(20 + size, 20); ctx.lineTo(20, 20); ctx.lineTo(20, 20 + size)
      ctx.stroke()
      // Top right
      ctx.beginPath()
      ctx.moveTo(W - 20 - size, 20); ctx.lineTo(W - 20, 20); ctx.lineTo(W - 20, 20 + size)
      ctx.stroke()
      // Bottom left
      ctx.beginPath()
      ctx.moveTo(20 + size, H - 20); ctx.lineTo(20, H - 20); ctx.lineTo(20, H - 20 - size)
      ctx.stroke()
      // Bottom right
      ctx.beginPath()
      ctx.moveTo(W - 20 - size, H - 20); ctx.lineTo(W - 20, H - 20); ctx.lineTo(W - 20, H - 20 - size)
      ctx.stroke()
    }

    // ── DATA READOUTS ─────────────────────────────────────────
    // Tiny scrolling numbers in corners like a military HUD
    const drawHUDText = () => {
      ctx.font      = '9px Courier New'
      ctx.fillStyle = 'rgba(255,102,0,0.2)'

      const lines = [
        `SYS:${(time * 0.1).toFixed(2)}`,
        `LAT:13.08°N`,
        `LNG:80.27°E`,
        `ALT:006M`,
        `MAGI:ONLINE`,
        `VER:2.0.0`,
      ]
      lines.forEach((line, i) => {
        ctx.fillText(line, 28, H - 100 + i * 14)
      })

      // Right side
      const rLines = [
        `CPU:${(40 + Math.sin(time * 0.05) * 20).toFixed(0)}%`,
        `MEM:${(60 + Math.sin(time * 0.03) * 15).toFixed(0)}%`,
        `NET:ACTIVE`,
        `THREAT:LOW`,
      ]
      rLines.forEach((line, i) => {
        const w = ctx.measureText(line).width
        ctx.fillText(line, W - w - 28, H - 80 + i * 14)
      })
    }

    // ── NEBULA CLOUDS ─────────────────────────────────────────
    const NEBULAS = Array.from({ length: 6 }, (_, i) => ({
      x:     Math.random() * W,
      y:     (i / 6) * H * 3,
      size:  150 + Math.random() * 200,
      color: i % 3 === 0 ? '255,102,0' :
             i % 3 === 1 ? '0,255,255' : '139,92,246',
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.005
    }))

    const drawNebulas = () => {
      NEBULAS.forEach(neb => {
        neb.phase += neb.speed
        const screenY = neb.y - scrollY * 0.2
        if (screenY < -neb.size * 2 || screenY > H + neb.size * 2) return

        const alpha = 0.03 + Math.sin(neb.phase) * 0.02
        const grad  = ctx.createRadialGradient(
          neb.x, screenY, 0,
          neb.x, screenY, neb.size
        )
        grad.addColorStop(0,   `rgba(${neb.color},${alpha})`)
        grad.addColorStop(0.5, `rgba(${neb.color},${alpha * 0.5})`)
        grad.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.fillRect(neb.x - neb.size, screenY - neb.size,
                     neb.size * 2, neb.size * 2)
      })
    }

    // ── MAIN RENDER LOOP ──────────────────────────────────────
    const render = () => {
      time++

      // Clear with dark base — slight trail effect
      ctx.fillStyle = 'rgba(10,10,15,0.85)'
      ctx.fillRect(0, 0, W, H)

      // Draw layers bottom to top
      drawNebulas()
      drawGrid()
      drawHexField()
      drawEnergyLines()
      drawParticles()
      drawScanLine()
      drawCornerBrackets()
      drawHUDText()

      animFrame = requestAnimationFrame(render)
    }

    render()

    // Resize handler
    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('scroll',  onScroll)
      window.removeEventListener('resize',  onResize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed',
      top: 0, left: 0,
      width:  '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none'
    }} />
  )
}
