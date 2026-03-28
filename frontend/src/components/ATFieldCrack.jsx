import { useEffect, useRef } from 'react'

export default function ATFieldCrack({ onShatterComplete }) {
    const canvasRef = useRef(null)
    const doneRef = useRef(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let w = canvas.width = window.innerWidth
        let h = canvas.height = window.innerHeight

        let roots = []

        // Initialize initial bursts from the center
        for (let i = 0; i < 16; i++) {
            roots.push({
                x: w / 2, y: h / 2,
                angle: (i / 16) * (Math.PI * 2) + Math.random() * 0.2,
                speed: 10 + Math.random() * 15,
                width: 12 + Math.random() * 8,
                active: true
            })
        }

        let frameId
        let opacity = 1.0
        let phase = 'growing'
        let timer = 0

        const color1 = 'var(--secondary)' // light green glow
        const color2 = 'var(--primary)' // solid green vein
        const color3 = 'var(--primary)' // dark green core

        // Fill screen with deep dark green initially
        ctx.fillStyle = 'var(--bg)'
        ctx.fillRect(0, 0, w, h)

        const animate = () => {
            frameId = requestAnimationFrame(animate)

            // Slight fade effect to create trails and visual depth
            ctx.fillStyle = `rgba(2, 13, 5, 0.08)`
            ctx.fillRect(0, 0, w, h)

            timer++
            if (timer > 80 && phase === 'growing') {
                phase = 'fade'
            }

            if (phase === 'growing') {
                let newRoots = []

                // Flash effect on first frame
                if (timer === 1) {
                    ctx.fillStyle = 'var(--secondary)'
                    ctx.fillRect(0, 0, w, h)
                }

                roots.forEach(r => {
                    if (!r.active) return

                    ctx.beginPath()
                    ctx.moveTo(r.x, r.y)

                    // Organic wandering
                    r.angle += (Math.random() - 0.5) * 0.5
                    r.x += Math.cos(r.angle) * r.speed
                    r.y += Math.sin(r.angle) * r.speed

                    // Thinning out as it grows
                    r.width *= 0.94

                    ctx.lineTo(r.x, r.y)

                    // Dynamic coloring based on size
                    ctx.strokeStyle = r.width > 6 ? color3 : (Math.random() > 0.3 ? color2 : color1)
                    ctx.lineWidth = r.width
                    ctx.lineCap = 'round'

                    // Core stroke
                    ctx.stroke()

                    // Bioluminescent Glow
                    ctx.shadowColor = 'var(--secondary)'
                    ctx.shadowBlur = Math.min(20, r.width * 3)
                    ctx.stroke()
                    ctx.shadowBlur = 0

                    // Stop if too thin or heavily out of bounds
                    if (r.width < 0.5 || r.x < -200 || r.x > w + 200 || r.y < -200 || r.y > h + 200) {
                        r.active = false
                    }

                    // Branching logic (bifurcation like plant roots)
                    if (Math.random() < 0.15 && r.width > 2 && newRoots.length < 50) {
                        const dir = Math.random() > 0.5 ? 1 : -1
                        newRoots.push({
                            x: r.x, y: r.y,
                            angle: r.angle + dir * (0.4 + Math.random() * 0.6),
                            speed: r.speed * (0.7 + Math.random() * 0.5),
                            width: r.width * (0.6 + Math.random() * 0.3),
                            active: true
                        })
                    }
                })

                roots = [...roots, ...newRoots]

                // Optimization: remove inactive roots periodically
                if (timer % 10 === 0) {
                    roots = roots.filter(r => r.active)
                }

            } else {
                // Rapid organic fade out
                opacity -= 0.04
                canvas.style.opacity = opacity

                // White flash at the very end of fade
                if (opacity <= 0.2 && opacity > 0.16) {
                    ctx.fillStyle = '#FFFFFF'
                    ctx.fillRect(0, 0, w, h)
                }

                if (opacity <= 0 && !doneRef.current) {
                    doneRef.current = true
                    if (onShatterComplete) onShatterComplete()
                    cancelAnimationFrame(frameId)
                }
            }
        }
        animate()

        const onResize = () => {
            w = canvas.width = window.innerWidth
            h = canvas.height = window.innerHeight
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener('resize', onResize)
        }
    }, [onShatterComplete])

    return (
        <canvas ref={canvasRef} style={{
            position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none',
            mixBlendMode: 'screen'
        }} />
    )
}
