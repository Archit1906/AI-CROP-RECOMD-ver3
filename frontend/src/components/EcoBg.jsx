import { useEffect, useRef } from 'react'

export default function EcoBg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let W        = canvas.width  = window.innerWidth
    let H        = canvas.height = window.innerHeight

    // ── POLLEN PARTICLES ──────────────────────────────
    const pollen = Array.from({ length: 60 }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H + H,
      size: 1 + Math.random() * 3,
      vx:   (Math.random() - 0.5) * 0.4,
      vy:   -(0.3 + Math.random() * 0.8),
      rot:  Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.02,
      alpha:0.3 + Math.random() * 0.5,
      type: Math.floor(Math.random() * 3) // 0=circle, 1=diamond, 2=leaf
    }))

    // ── ROOT NETWORK NODES ────────────────────────────
    const nodes = Array.from({ length: 20 }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }))

    // ── CELL BUBBLES ──────────────────────────────────
    const cells = Array.from({ length: 15 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     20 + Math.random() * 60,
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.01,
      alpha: 0.02 + Math.random() * 0.04
    }))

    let frameId
    let time = 0

    const drawPollenCircle = (ctx, x, y, r, alpha, color) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle   = color
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      // Pollen texture dots
      ctx.fillStyle = 'rgba(163,230,53,0.5)'
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(
          x + Math.cos(angle) * r * 0.5,
          y + Math.sin(angle) * r * 0.5,
          r * 0.2, 0, Math.PI * 2
        )
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const drawLeafParticle = (ctx, x, y, size, rot, alpha) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      ctx.globalAlpha = alpha
      ctx.fillStyle   = '#22C55E'
      ctx.strokeStyle = '#4ADE80'
      ctx.lineWidth   = 0.5
      ctx.beginPath()
      ctx.moveTo(0, -size * 2)
      ctx.quadraticCurveTo(size * 1.5, 0, 0, size * 2)
      ctx.quadraticCurveTo(-size * 1.5, 0, 0, -size * 2)
      ctx.fill()
      ctx.stroke()
      // Leaf vein
      ctx.strokeStyle = 'rgba(134,239,172,0.5)'
      ctx.lineWidth   = 0.3
      ctx.beginPath()
      ctx.moveTo(0, -size * 2)
      ctx.lineTo(0, size * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.restore()
    }

    const render = () => {
      frameId = requestAnimationFrame(render)
      time += 0.008
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
      ctx.clearRect(0, 0, W, H)

      // ── CELL BUBBLES (background layer) ─────────────
      cells.forEach(cell => {
        cell.phase += cell.speed
        const pulse = 1 + Math.sin(cell.phase) * 0.08
        const grad  = ctx.createRadialGradient(
          cell.x, cell.y, 0,
          cell.x, cell.y, cell.r * pulse
        )
        grad.addColorStop(0,   `rgba(34,197,94,${cell.alpha * 1.5})`)
        grad.addColorStop(0.6, `rgba(22,163,74,${cell.alpha * 0.8})`)
        grad.addColorStop(1,   'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cell.x, cell.y, cell.r * pulse, 0, Math.PI * 2)
        ctx.fill()

        // Cell wall ring
        ctx.strokeStyle = `rgba(34,197,94,${cell.alpha * 3})`
        ctx.lineWidth   = 0.5
        ctx.stroke()
      })

      // ── ROOT NETWORK ─────────────────────────────────
      nodes.forEach(node => {
        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > W) node.vx *= -1
        if (node.y < 0 || node.y > H) node.vy *= -1
      })

      nodes.forEach((node, i) => {
        nodes.forEach((other, j) => {
          if (j <= i) return
          const dist = Math.hypot(node.x - other.x, node.y - other.y)
          if (dist > 200) return
          const alpha = (1 - dist / 200) * 0.12
          ctx.strokeStyle = `rgba(34,197,94,${alpha})`
          ctx.lineWidth   = (1 - dist / 200) * 1.5
          ctx.beginPath()
          ctx.moveTo(node.x, node.y)
          // Organic curved connection
          const mx = (node.x + other.x) / 2 + Math.sin(time + i) * 20
          const my = (node.y + other.y) / 2 + Math.cos(time + j) * 20
          ctx.quadraticCurveTo(mx, my, other.x, other.y)
          ctx.stroke()
        })
      })

      // ── POLLEN / LEAF PARTICLES ───────────────────────
      pollen.forEach(p => {
        p.x   += p.vx + Math.sin(time + p.y * 0.01) * 0.3
        p.y   += p.vy
        p.rot += p.vrot

        if (p.y < -20) {
          p.y    = H + 20
          p.x    = Math.random() * W
          p.alpha= 0.3 + Math.random() * 0.5
        }

        if (p.type === 2) {
          drawLeafParticle(ctx, p.x, p.y, p.size, p.rot, p.alpha * 0.6)
        } else if (p.type === 1) {
          // Diamond pollen
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.globalAlpha = p.alpha * 0.5
          ctx.fillStyle   = '#A3E635'
          ctx.beginPath()
          ctx.moveTo(0, -p.size * 1.5)
          ctx.lineTo(p.size, 0)
          ctx.lineTo(0, p.size * 1.5)
          ctx.lineTo(-p.size, 0)
          ctx.closePath()
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.restore()
        } else {
          drawPollenCircle(ctx, p.x, p.y, p.size, p.alpha * 0.4, '#22C55E')
        }
      })

      // ── GROUND MYCELIUM NETWORK (bottom of screen) ───
      const groundY = H * 0.92
      for (let i = 0; i < 8; i++) {
        const sx = (i / 8) * W
        ctx.strokeStyle = `rgba(34,197,94,0.06)`
        ctx.lineWidth   = 1
        ctx.beginPath()
        ctx.moveTo(sx, groundY)
        for (let j = 0; j < 5; j++) {
          const nx = sx + (Math.random() - 0.5) * 100 + Math.sin(time + i) * 20
          const ny = groundY + j * 12 + Math.random() * 8
          ctx.lineTo(nx, Math.min(ny, H))
        }
        ctx.stroke()
      }
    }

    render()

    const onResize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0,
      width: '100vw', height: '100vh',
      zIndex: 0, pointerEvents: 'none',
      opacity: 0.7
    }} />
  )
}
