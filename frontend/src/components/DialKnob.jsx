import { useRef, useCallback } from 'react'

export default function DialKnob({
  label, value, min, max, unit, optimal_min, optimal_max,
  color = '#22C55E', onChange, size = 120
}) {
  const svgRef = useRef(null)
  const dragging = useRef(false)
  const centerRef = useRef({ x: 0, y: 0 })

  const START_ANGLE = 135   // degrees — where arc starts (bottom left)
  const END_ANGLE   = 405   // degrees — where arc ends (bottom right) = 135 + 270
  const SWEEP       = 270   // total sweep degrees

  const pct         = (value - min) / (max - min)
  const fillAngle   = START_ANGLE + pct * SWEEP
  const optMinPct   = (optimal_min - min) / (max - min)
  const optMaxPct   = (optimal_max - min) / (max - min)
  const optMinAngle = START_ANGLE + optMinPct * SWEEP
  const optMaxAngle = START_ANGLE + optMaxPct * SWEEP

  const R       = size / 2 - 12   // arc radius
  const CX      = size / 2
  const CY      = size / 2

  const polarToXY = (angleDeg, r) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
  }

  const describeArc = (startDeg, endDeg, r) => {
    const s   = polarToXY(startDeg, r)
    const e   = polarToXY(endDeg,   r)
    const big = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${big} 1 ${e.x} ${e.y}`
  }

  const angleToValue = useCallback((angleDeg) => {
    let a = ((angleDeg % 360) + 360) % 360
    if (a < START_ANGLE - 180) a += 360
    const clamped = Math.max(START_ANGLE, Math.min(END_ANGLE, a + (a < START_ANGLE ? 360 : 0)))
    const p = (clamped - START_ANGLE) / SWEEP
    return Math.round(min + p * (max - min))
  }, [min, max])

  const getAngleFromEvent = useCallback((e) => {
    const { x, y } = centerRef.current
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return Math.atan2(clientY - y, clientX - x) * (180 / Math.PI) + 90
  }, [])

  const startDrag = useCallback((e) => {
    e.preventDefault()
    const rect = svgRef.current.getBoundingClientRect()
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    dragging.current = true

    const move = (ev) => {
      if (!dragging.current) return
      const angle = getAngleFromEvent(ev)
      onChange(angleToValue(angle))
    }
    const stop = () => { dragging.current = false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', stop); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', stop) }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup',   stop)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend',  stop)
  }, [angleToValue, getAngleFromEvent, onChange])

  const isOptimal = value >= optimal_min && value <= optimal_max
  const arcColor  = isOptimal ? '#00FF41' : color

  const startPt = polarToXY(START_ANGLE, R)
  const endPt   = polarToXY(END_ANGLE,   R)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>

      {/* Label */}
      <p style={{
        fontFamily:"'Share Tech Mono', monospace",
        fontSize: 9, color:'#22C55E88',
        letterSpacing: 3, textTransform:'uppercase',
        margin: 0, textAlign:'center'
      }}>
        {label}
      </p>

      {/* SVG Dial */}
      <svg ref={svgRef} width={size} height={size}
        style={{ cursor:'grab', userSelect:'none', overflow:'visible' }}
        onMouseDown={startDrag} onTouchStart={startDrag}>

        {/* Outer ring decoration */}
        <circle cx={CX} cy={CY} r={R + 8} fill="none"
          stroke="#22C55E11" strokeWidth={1} strokeDasharray="4 6" />

        {/* Track arc (background) */}
        <path d={describeArc(START_ANGLE, END_ANGLE, R)}
          fill="none" stroke="#22C55E22" strokeWidth={8}
          strokeLinecap="round" />

        {/* Optimal range arc */}
        <path d={describeArc(optMinAngle, optMaxAngle, R)}
          fill="none" stroke="#00FF4133" strokeWidth={8}
          strokeLinecap="round" />

        {/* Value arc */}
        {pct > 0 && (
          <path d={describeArc(START_ANGLE, fillAngle, R)}
            fill="none" stroke={arcColor} strokeWidth={8}
            strokeLinecap="round"
            style={{ filter:`drop-shadow(0 0 4px ${arcColor}88)`, transition:'d 0.1s' }} />
        )}

        {/* Start dot */}
        <circle cx={startPt.x} cy={startPt.y} r={3}
          fill="#22C55E44" />

        {/* End dot */}
        <circle cx={endPt.x} cy={endPt.y} r={3}
          fill="#22C55E44" />

        {/* Thumb indicator */}
        {(() => {
          const tp = polarToXY(fillAngle, R)
          return (
            <circle cx={tp.x} cy={tp.y} r={6}
              fill={arcColor} stroke="#020D05" strokeWidth={2}
              style={{ filter:`drop-shadow(0 0 6px ${arcColor})` }} />
          )
        })()}

        {/* Center value display */}
        <text x={CX} y={CY - 6} textAnchor="middle"
          fontFamily="'Exo 2', sans-serif"
          fontSize={size < 110 ? 16 : 20}
          fontWeight="900" fill={arcColor}
          style={{ filter:`drop-shadow(0 0 8px ${arcColor}88)` }}>
          {value}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle"
          fontFamily="'Share Tech Mono', monospace"
          fontSize={9} fill="#666680">
          {unit}
        </text>

        {/* Optimal indicator dot */}
        <circle cx={CX} cy={CY + 26} r={3}
          fill={isOptimal ? '#00FF41' : '#22C55E44'}
          style={{ filter: isOptimal ? 'drop-shadow(0 0 4px #00FF41)' : 'none' }} />
      </svg>
      
      <input
        type="number"
        value={value}
        min={min} max={max}
        onChange={e => {
          const v = Math.min(max, Math.max(min, Number(e.target.value)))
          onChange(v)
        }}
        style={{
          width:70, textAlign:'center',
          background:'#020D05',
          border:'1px solid #22C55E44',
          borderRadius:2, color:'#22C55E',
          fontFamily:"'Share Tech Mono'",
          fontSize:11, padding:'4px 6px',
          outline:'none'
        }}
      />

      {/* Optimal range label */}
      <p style={{
        fontFamily:"'Share Tech Mono'", fontSize:8,
        color: isOptimal ? '#00FF4188' : '#22C55E55',
        margin:0, letterSpacing:1
      }}>
        {isOptimal ? '// OPTIMAL' : `OPT: ${optimal_min}–${optimal_max}`}
      </p>
    </div>
  )
}
