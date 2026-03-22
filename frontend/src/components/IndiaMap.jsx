import { useEffect, useRef, useState, useCallback } from 'react'

// ── STATE NAME NORMALIZATION ──────────────────────────────────
// Maps GeoJSON names → standard names used in your app
const STATE_NAME_MAP = {
  // DataMeet variations
  'Andaman & Nicobar Island':  'Andaman and Nicobar Islands',
  'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
  'Arunachal Pradesh':         'Arunachal Pradesh',
  'Assam':                     'Assam',
  'Bihar':                     'Bihar',
  'Chandigarh':                'Chandigarh',
  'Chhattisgarh':              'Chhattisgarh',
  'Dadra & Nagar Haveli':      'Dadra and Nagar Haveli',
  'Daman & Diu':               'Daman and Diu',
  'Delhi':                     'Delhi',
  'Goa':                       'Goa',
  'Gujarat':                   'Gujarat',
  'Haryana':                   'Haryana',
  'Himachal Pradesh':          'Himachal Pradesh',
  'Jammu & Kashmir':           'Jammu and Kashmir',
  'Jammu and Kashmir':         'Jammu and Kashmir',
  'Jharkhand':                 'Jharkhand',
  'Karnataka':                 'Karnataka',
  'Kerala':                    'Kerala',
  'Lakshadweep':               'Lakshadweep',
  'Madhya Pradesh':            'Madhya Pradesh',
  'Maharashtra':               'Maharashtra',
  'Manipur':                   'Manipur',
  'Meghalaya':                 'Meghalaya',
  'Mizoram':                   'Mizoram',
  'Nagaland':                  'Nagaland',
  'Odisha':                    'Odisha',
  'Orissa':                    'Odisha',
  'Puducherry':                'Puducherry',
  'Punjab':                    'Punjab',
  'Rajasthan':                 'Rajasthan',
  'Sikkim':                    'Sikkim',
  'Tamil Nadu':                'Tamil Nadu',
  'Telangana':                 'Telangana',
  'Tripura':                   'Tripura',
  'Uttar Pradesh':             'Uttar Pradesh',
  'Uttarakhand':               'Uttarakhand',
  'Uttaranchal':               'Uttarakhand',
  'West Bengal':               'West Bengal',
  'Ladakh':                    'Ladakh',
}

const normalizeName = (name) => STATE_NAME_MAP[name] || name

// ── INDIA GEOGRAPHIC BOUNDS (precise) ────────────────────────
const INDIA_BOUNDS = {
  minLon: 68.1,
  maxLon: 97.4,
  minLat: 8.07,
  maxLat: 37.1,
}

export default function IndiaMap({
  onStateSelect,
  selectedState,
  activeStates = [],
}) {
  const svgRef       = useRef(null)
  const [paths,      setPaths]      = useState({})
  const [tooltip,    setTooltip]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [hoveredState, setHoveredState] = useState(null)

  const W = 460
  const H = 520

  // ── PROJECTION ──────────────────────────────────────────────
  const project = useCallback((lon, lat) => {
    const padding  = 24
    const mapW     = W - padding * 2
    const mapH     = H - padding * 2
    const lonRange = INDIA_BOUNDS.maxLon - INDIA_BOUNDS.minLon
    const latRange = INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat
    const scaleX   = mapW / lonRange
    const scaleY   = mapH / latRange
    const scale    = Math.min(scaleX, scaleY)
    const offX     = padding + (mapW - lonRange * scale) / 2
    const offY     = padding + (mapH - latRange * scale) / 2
    return [
      offX + (lon - INDIA_BOUNDS.minLon) * scale,
      H - offY - (lat - INDIA_BOUNDS.minLat) * scale,
    ]
  }, [W, H])

  // ── RING TO SVG PATH ─────────────────────────────────────────
  const ringToD = useCallback((ring) => {
    if (!ring || ring.length < 2) return ''
    const pts = ring.map(([lon, lat]) => project(lon, lat))
    return (
      `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} ` +
      pts.slice(1).map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') +
      ' Z'
    )
  }, [project])

  // ── GEOMETRY TO PATH ─────────────────────────────────────────
  const geomToPath = useCallback((geom) => {
    if (geom.type === 'Polygon') {
      return geom.coordinates.map(ringToD).join(' ')
    }
    if (geom.type === 'MultiPolygon') {
      return geom.coordinates
        .flat(1)
        .map(ringToD)
        .join(' ')
    }
    return ''
  }, [ringToD])

  // ── CENTROID ─────────────────────────────────────────────────
  const getCentroid = useCallback((geom) => {
    const coords = []
    const collect = (ring) => ring.forEach(c => coords.push(c))
    if (geom.type === 'Polygon') {
      geom.coordinates.forEach(collect)
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach(poly => poly.forEach(collect))
    }
    if (!coords.length) return [W / 2, H / 2]
    const avgLon = coords.reduce((s, c) => s + c[0], 0) / coords.length
    const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length
    return project(avgLon, avgLat)
  }, [project, W, H])

  // ── EXTRACT STATE NAME FROM PROPERTIES ───────────────────────
  const getStateName = (props) => {
    const raw =
      props.ST_NM     ||
      props.NAME_1    ||
      props.state     ||
      props.State     ||
      props.name      ||
      props.Name      ||
      props.STNAME    ||
      props.statename ||
      props.st_nm     ||
      props.NAME      ||
      ''
    return normalizeName(raw.trim())
  }

  // ── LOAD AND PROCESS GEOJSON ─────────────────────────────────
  useEffect(() => {
    const SOURCES = [
      '/india-states.geojson',
      'https://raw.githubusercontent.com/datameet/maps/master/States/Admin2.geojson',
      'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
      'https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States',
    ]

    const loadMap = async () => {
      setLoading(true)
      for (const src of SOURCES) {
        try {
          const res  = await fetch(src)
          if (!res.ok) continue
          const data = await res.json()
          if (!data?.features?.length) continue

          // Debug — log what property names are available
          console.log('Map loaded from:', src)
          console.log('Sample properties:', data.features[0].properties)

          // Build path lookup keyed by normalized state name
          const built = {}
          data.features.forEach(f => {
            const name = getStateName(f.properties)
            if (!name) return
            const d = geomToPath(f.geometry)
            if (!built[name]) {
              built[name] = { d: '', centroids: [] }
            }
            built[name].d += (built[name].d ? ' ' : '') + d
            built[name].centroids.push(getCentroid(f.geometry))
          })

          // Calculate average centroid for labels/tooltips
          for (const name in built) {
            const cs = built[name].centroids
            const avgX = cs.reduce((sum, c) => sum + c[0], 0) / cs.length
            const avgY = cs.reduce((sum, c) => sum + c[1], 0) / cs.length
            built[name].centroid = [avgX, avgY]
            delete built[name].centroids
          }

          console.log('States found:', Object.keys(built))
          setPaths(built)
          setError(null)
          setLoading(false)
          return
        } catch (err) {
          console.warn('Failed to load from', src, err)
        }
      }
      setError('Map data unavailable — check your internet connection.')
      setLoading(false)
    }

    loadMap()
  }, [geomToPath, getCentroid])

  // ── MOUSE HANDLERS ────────────────────────────────────────────
  const handleEnter = useCallback((e, name) => {
    setHoveredState(name)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      name,
      x: Math.min(e.clientX - rect.left, W - 120),
      y: Math.max(e.clientY - rect.top  - 38, 8),
    })
  }, [W])

  const handleLeave = useCallback(() => {
    setHoveredState(null)
    setTooltip(null)
  }, [])

  const handleClick = useCallback((name) => {
    if (onStateSelect) onStateSelect(name)
  }, [onStateSelect])

  // ── STATE COLOR ───────────────────────────────────────────────
  const getFill = (name) => {
    if (name === selectedState)        return 'rgba(34,197,94,0.30)'
    if (name === hoveredState)         return 'rgba(34,197,94,0.18)'
    if (activeStates.includes(name))   return 'rgba(34,197,94,0.10)'
    return 'rgba(7,26,12,0.85)'
  }

  const getStroke = (name) => {
    if (name === selectedState)        return 'var(--primary)'
    if (name === hoveredState)         return 'rgba(34,197,94,0.8)'
    if (activeStates.includes(name))   return 'rgba(34,197,94,0.35)'
    return 'rgba(34,197,94,0.22)'
  }

  const getStrokeW = (name) => {
    if (name === selectedState) return 1.5
    if (name === hoveredState)  return 1.0
    return 0.5
  }

  // ── RENDER ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ width:W, height:H, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  flexDirection:'column', gap:12 }}>
      <div style={{
        width:32, height:32,
        border:'2px solid var(--border)', borderTop:'2px solid var(--primary)',
        borderRadius:'50%', animation:'spin 0.8s linear infinite'
      }} />
      <p style={{ fontFamily:"'Share Tech Mono'", color:'rgba(34,197,94,0.5)',
                   fontSize:10, letterSpacing:3 }}>
        // LOADING MAP DATA...
      </p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ width:W, height:H, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  flexDirection:'column', gap:12, padding:24 }}>
      <span style={{ fontSize:40 }}>🗺️</span>
      <p style={{ fontFamily:"'Share Tech Mono'", color:'#EF4444',
                   fontSize:10, letterSpacing:2, textAlign:'center' }}>
        {error}
      </p>
      <button onClick={() => window.location.reload()}
        style={{ background:'rgba(34,197,94,0.1)', border:'1px solid var(--primary)',
                  borderRadius:8, color:'var(--secondary)', padding:'8px 16px',
                  fontFamily:"'Share Tech Mono'", fontSize:9,
                  letterSpacing:2, cursor:'pointer' }}>
        ↺ RETRY
      </button>
    </div>
  )

  return (
    <div style={{ position:'relative', width:W, height:H }}>
      <svg ref={svgRef} width={W} height={H}
        style={{ overflow:'visible', display:'block' }}>
        <defs>
          <pattern id="hexBg" x="0" y="0" width="22" height="19"
            patternUnits="userSpaceOnUse">
            <polygon
              points="11,1.5 20.5,6.5 20.5,14 11,18.5 1.5,14 1.5,6.5"
              fill="none" stroke="rgba(34,197,94,0.05)" strokeWidth="0.5"
            />
          </pattern>
          <filter id="selGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width={W} height={H} fill='var(--bg-deep)' rx="10"/>
        <rect width={W} height={H} fill="url(#hexBg)" rx="10"/>

        {/* State paths — render non-selected first, selected on top */}
        {Object.entries(paths)
          .sort(([a], [b]) => {
            // Selected state renders last (on top)
            if (a === selectedState) return 1
            if (b === selectedState) return -1
            return 0
          })
          .map(([name, { d }]) => {
            const isSelected = name === selectedState
            return (
              <g key={name}>
                {/* Glow for selected */}
                {isSelected && (
                  <path d={d}
                    fill="rgba(34,197,94,0.12)"
                    stroke='var(--secondary)'
                    strokeWidth="4"
                    filter="url(#selGlow)"
                    opacity="0.4"
                  />
                )}
                {/* Main path */}
                <path
                  d={d}
                  fill={getFill(name)}
                  stroke={getStroke(name)}
                  strokeWidth={getStrokeW(name)}
                  strokeLinejoin="round"
                  style={{
                    cursor: onStateSelect ? 'pointer' : 'default',
                    transition: 'fill 0.12s ease, stroke 0.12s ease'
                  }}
                  onMouseEnter={e => handleEnter(e, name)}
                  onMouseLeave={handleLeave}
                  onClick={() => handleClick(name)}
                />
                {/* Pulse ring on selected */}
                {isSelected && (
                  <path d={d}
                    fill="none"
                    stroke='var(--primary)'
                    strokeWidth="2"
                    opacity="0.35"
                    style={{ animation:'pulse 2s ease infinite' }}
                  />
                )}
              </g>
            )
          })}

        {/* Scan line animation */}
        <rect x="0" y="0" width={W} height="8"
          fill="rgba(34,197,94,0.06)"
          style={{ animation:`scanLine ${H * 0.06}s linear infinite` }}
        />

        {/* HUD corner brackets */}
        {[[10,10],[W-10,10],[10,H-10],[W-10,H-10]].map(([cx,cy],i) => {
          const sx = cx < W/2 ? 1 : -1
          const sy = cy < H/2 ? 1 : -1
          return (
            <g key={i} stroke="rgba(34,197,94,0.35)" strokeWidth="1.5">
              <line x1={cx} y1={cy} x2={cx+sx*14} y2={cy}/>
              <line x1={cx} y1={cy} x2={cx} y2={cy+sy*14}/>
            </g>
          )
        })}

        {/* State count */}
        <text x="12" y={H-10}
          fill="rgba(34,197,94,0.35)"
          fontSize="9" fontFamily="'Share Tech Mono'"
          letterSpacing="2">
          // {Object.keys(paths).length} STATES LOADED
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:     'absolute',
          left:         tooltip.x,
          top:          tooltip.y,
          transform:    'translateX(-50%)',
          background:   'var(--bg-card)',
          border:       '1px solid var(--primary)',
          borderRadius: 8,
          padding:      '5px 14px',
          pointerEvents:'none',
          zIndex:       20,
          whiteSpace:   'nowrap',
          boxShadow:    '0 0 12px var(--primary-glow)'
        }}>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11,
                       color:'var(--secondary)', letterSpacing:2, margin:0 }}>
            {tooltip.name.toUpperCase()}
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%,100%{ stroke-width:2; opacity:0.35 }
          50%    { stroke-width:5; opacity:0.1  }
        }
        @keyframes scanLine {
          0%  { transform:translateY(-8px) }
          100%{ transform:translateY(${H+8}px) }
        }
        @keyframes spin {
          from{ transform:rotate(0deg) }
          to  { transform:rotate(360deg) }
        }
      `}</style>
    </div>
  )
}
