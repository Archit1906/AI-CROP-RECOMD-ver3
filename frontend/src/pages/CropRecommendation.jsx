import { useTranslation } from 'react-i18next'
import VineBorder from '../components/VineBorder'
import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IndiaMap from '../components/IndiaMap'
import { SOIL_DATA, STATE_CAPITALS } from '../data/soilData'
import {
  STATE_DISTRICTS,
  DISTRICT_SOIL_MODIFIERS,
  DISTRICT_ZONES
} from '../data/districtData'
import api from '../api/axios'

const CROP_INFO = {
  rice:        { emoji:'🌾', profit:'₹28,000/acre', season:'Kharif',  water:'High',   days:'90-120'  },
  wheat:       { emoji:'🌿', profit:'₹22,000/acre', season:'Rabi',    water:'Medium', days:'110-130' },
  maize:       { emoji:'🌽', profit:'₹18,000/acre', season:'Kharif',  water:'Medium', days:'80-110'  },
  cotton:      { emoji:'🌱', profit:'₹35,000/acre', season:'Kharif',  water:'Medium', days:'150-180' },
  sugarcane:   { emoji:'🎋', profit:'₹45,000/acre', season:'Annual',  water:'High',   days:'300-365' },
  coffee:      { emoji:'☕', profit:'₹75,000/acre', season:'Annual',  water:'High',   days:'365'     },
  coconut:     { emoji:'🥥', profit:'₹40,000/acre', season:'Annual',  water:'High',   days:'365'     },
  banana:      { emoji:'🍌', profit:'₹60,000/acre', season:'Annual',  water:'High',   days:'270-365' },
  mango:       { emoji:'🥭', profit:'₹70,000/acre', season:'Annual',  water:'Medium', days:'90-120'  },
  chickpea:    { emoji:'🫘', profit:'₹22,000/acre', season:'Rabi',    water:'Low',    days:'90-100'  },
  lentil:      { emoji:'🫘', profit:'₹21,000/acre', season:'Rabi',    water:'Low',    days:'100-120' },
  mungbean:    { emoji:'🌿', profit:'₹16,000/acre', season:'Kharif',  water:'Low',    days:'60-75'   },
  blackgram:   { emoji:'🫘', profit:'₹17,000/acre', season:'Kharif',  water:'Low',    days:'70-90'   },
  pomegranate: { emoji:'🍎', profit:'₹80,000/acre', season:'Annual',  water:'Low',    days:'150-180' },
  grapes:      { emoji:'🍇', profit:'₹90,000/acre', season:'Annual',  water:'Medium', days:'150-180' },
  watermelon:  { emoji:'🍉', profit:'₹30,000/acre', season:'Summer',  water:'Medium', days:'70-90'   },
  papaya:      { emoji:'🍈', profit:'₹50,000/acre', season:'Annual',  water:'High',   days:'240-270' },
  orange:      { emoji:'🍊', profit:'₹65,000/acre', season:'Annual',  water:'Medium', days:'270-365' },
  kidneybeans: { emoji:'🫘', profit:'₹20,000/acre', season:'Kharif',  water:'Medium', days:'90-120'  },
  pigeonpeas:  { emoji:'🌿', profit:'₹19,000/acre', season:'Kharif',  water:'Low',    days:'150-180' },
  mothbeans:   { emoji:'🌱', profit:'₹15,000/acre', season:'Kharif',  water:'Low',    days:'75-85'   },
  jute:        { emoji:'🌿', profit:'₹20,000/acre', season:'Kharif',  water:'High',   days:'100-120' },
}

const LOAD_PHASES = [
  '// LOCATING DISTRICT COORDINATES...',
  '// FETCHING ATMOSPHERIC DATA...',
  '// RETRIEVING SOIL COMPOSITION...',
  '// APPLYING DISTRICT MODIFIERS...',
  '// RUNNING ECO ANALYSIS...',
  '// GENERATING RECOMMENDATION...',
]

export default function CropRecommendation() {
  const { t } = useTranslation()
  const [step,          setStep]          = useState('map')
  // 'map' → 'district' → 'loading' → 'result'
  const [selectedState, setSelectedState] = useState(null)
  const [selectedDist,  setSelectedDist]  = useState(null)
  const [distSearch,    setDistSearch]    = useState('')
  const [weather,       setWeather]       = useState(null)
  const [soil,          setSoil]          = useState(null)
  const [result,        setResult]        = useState(null)
  const [loadPhase,     setLoadPhase]     = useState(0)
  const [history,       setHistory]       = useState([])
  const [error,         setError]         = useState(null)

  // Filtered district list
  const districts = useMemo(() => {
    const list = STATE_DISTRICTS[selectedState] || []
    if (!distSearch.trim()) return list
    return list.filter(d =>
      d.toLowerCase().includes(distSearch.toLowerCase())
    )
  }, [selectedState, distSearch])

  // Step 1 — state selected on map
  const handleStateSelect = useCallback((stateName) => {
    if (!stateName || !STATE_DISTRICTS[stateName]) return
    setSelectedState(stateName)
    setSelectedDist(null)
    setResult(null)
    setError(null)
    setDistSearch('')
    setStep('district')
  }, [])

  // Get district-adjusted soil data
  const getDistrictSoil = useCallback((stateName, districtName) => {
    const baseSoil = SOIL_DATA[stateName] || { N:80, P:40, K:50, ph:7.0, region:'central' }
    const zone     = DISTRICT_ZONES[districtName] || 'default'
    const mod      = DISTRICT_SOIL_MODIFIERS[zone]   || DISTRICT_SOIL_MODIFIERS.default

    return {
      ...baseSoil,
      N:  Math.max(20, Math.min(140, baseSoil.N  + mod.N)),
      P:  Math.max(10, Math.min(145, baseSoil.P  + mod.P)),
      K:  Math.max(10, Math.min(205, baseSoil.K  + mod.K)),
      ph: Math.max(4,  Math.min(9,   baseSoil.ph + mod.ph)),
      zone
    }
  }, [])

  // Step 2 — district selected → fetch + predict
  const handleDistrictSelect = useCallback(async (districtName) => {
    setSelectedDist(districtName)
    setStep('loading')
    setError(null)
    setLoadPhase(0)

    try {
      // Phase 1 — locate
      setLoadPhase(0)
      await new Promise(r => setTimeout(r, 500))

      // Phase 2 — weather for specific district/city
      setLoadPhase(1)
      let weatherData
      try {
        const wRes = await api.get(
          `/api/weather/${encodeURIComponent(districtName)}`
        )
        weatherData = {
          temperature: wRes.data.current?.temp       || wRes.data.temperature,
          humidity:    wRes.data.current?.humidity   || wRes.data.humidity,
          rainfall:    wRes.data.current?.rainfall   || wRes.data.rainfall || 80,
          description: wRes.data.current?.description|| 'Partly Cloudy',
          city:        districtName
        }
      } catch {
        // Region-based mock weather
        const baseSoil = SOIL_DATA[selectedState] || {}
        const zone     = DISTRICT_ZONES[districtName] || baseSoil.region || 'central'
        const regionWeather = {
          arid:         { temperature:36, humidity:22, rainfall:28  },
          western:      { temperature:31, humidity:52, rainfall:68  },
          gangetic:     { temperature:27, humidity:72, rainfall:115 },
          southern:     { temperature:29, humidity:74, rainfall:135 },
          coastal:      { temperature:28, humidity:82, rainfall:195 },
          eastern:      { temperature:27, humidity:78, rainfall:165 },
          northeastern: { temperature:22, humidity:88, rainfall:235 },
          himalayan:    { temperature:12, humidity:62, rainfall:145 },
          central:      { temperature:30, humidity:56, rainfall:88  },
          default:      { temperature:28, humidity:65, rainfall:100 },
        }
        weatherData = {
          ...(regionWeather[zone] || regionWeather.central),
          description: 'Partly Cloudy',
          city: districtName
        }
      }
      setWeather(weatherData)
      await new Promise(r => setTimeout(r, 400))

      // Phase 3 — district-adjusted soil
      setLoadPhase(2)
      const soilData = getDistrictSoil(selectedState, districtName)
      setSoil(soilData)
      await new Promise(r => setTimeout(r, 400))

      // Phase 4 — apply modifiers
      setLoadPhase(3)
      await new Promise(r => setTimeout(r, 300))

      // Phase 5 — ML prediction
      setLoadPhase(4)
      const predRes = await api.post('/api/predict-crop', {
        nitrogen:    soilData.N,
        phosphorus:  soilData.P,
        potassium:   soilData.K,
        temperature: weatherData.temperature,
        humidity:    weatherData.humidity,
        ph:          soilData.ph,
        rainfall:    weatherData.rainfall,
      })

      // Phase 6 — done
      setLoadPhase(5)
      await new Promise(r => setTimeout(r, 300))

      setResult(predRes.data)
      setStep('result')

      setHistory(prev => [{
        state:    selectedState,
        district: districtName,
        crop:     predRes.data.recommended_crop,
        conf:     predRes.data.confidence,
        time:     new Date().toLocaleTimeString('en-IN')
      }, ...prev].slice(0, 6))

    } catch (err) {
      setError(`Analysis failed for ${districtName}. Check backend.`)
      setStep('district')
    }
  }, [selectedState, getDistrictSoil])

  const cropKey  = result?.recommended_crop?.toLowerCase().replace(/[\s_]/g,'')
  const cropInfo = CROP_INFO[cropKey] || { emoji:'🌱', profit:'N/A', season:'N/A', water:'N/A', days:'N/A' }

  return (
    <div style={{ padding:24, background:'#020D05', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:20,
                    paddingBottom:0 }}>
        <div>
          <p style={{ fontFamily:"'Courier New'", fontSize:9,
                       color:'#22C55E66', letterSpacing:4, margin:'0 0 6px' }}>
            {t('crop_nge.sys_label')}
          </p>
          <h1 style={{ fontFamily:"'Exo 2'", fontSize:22, fontWeight:900,
                       color:'#22C55E', margin:0, letterSpacing:4,
                       textShadow:'0 0 20px #22C55E66' }}>
            {t('crop_nge.title')}
          </h1>
        </div>

        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {[t('crop_nge.bc_state'), t('crop_nge.bc_dist'), t('crop_nge.bc_res')].map((label, i) => {
            const stepMap = { 0:'map', 1:'district', 2:'result' }
            const isActive = step === stepMap[i] ||
                             (step === 'loading' && i === 1) ||
                             (step === 'result'  && i === 2)
            const isDone   = (i === 0 && selectedState) ||
                             (i === 1 && selectedDist)
            return (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'4px 12px', borderRadius:1,
                  border:`1px solid ${isActive ? '#22C55E' : isDone ? '#22C55E44' : '#22C55E11'}`,
                  background: isActive ? '#22C55E22' : 'transparent'
                }}>
                  <div style={{
                    width:6, height:6, borderRadius:'50%',
                    background: isActive ? '#22C55E' : isDone ? '#00FF41' : '#333',
                    boxShadow: isActive ? '0 0 6px #22C55E' : 'none'
                  }} />
                  <span style={{ fontFamily:"'Courier New'", fontSize:9,
                                  color: isActive ? '#22C55E' : isDone ? '#00FF4188' : '#333',
                                  letterSpacing:2 }}>
                    {label}
                  </span>
                  {isDone && i < 2 && (
                    <span style={{ color:'#00FF41', fontSize:9 }}>✓</span>
                  )}
                </div>
                {i < 2 && (
                  <span style={{ color:'#22C55E22', fontSize:12 }}>▶</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display:'grid',
                    gridTemplateColumns: step === 'map' ? '1fr' : '440px 1fr',
                    gap:20, alignItems:'start' }}>

        {/* LEFT — Map (always visible) */}
        <div style={{ background:'#040F07',
                      border:'1px solid #22C55E33',
                      borderRadius:4, padding:16 }}>

          <p style={{ fontFamily:"'Courier New'", fontSize:9,
                       color:'#22C55E66', letterSpacing:3, margin:'0 0 4px' }}>
            {step === 'map' ? t('crop_nge.sel_state') : t('crop_nge.locked_state')}
          </p>
          {selectedState && (
            <p style={{ fontFamily:"'Exo 2'", fontSize:11, color:'#22C55E',
                         letterSpacing:3, margin:'0 0 12px' }}>
              ◉ {selectedState.toUpperCase()}
              {selectedDist && ` → ${selectedDist.toUpperCase()}`}
            </p>
          )}

          <div style={{ display:'flex', justifyContent:'center',
                        opacity: step !== 'map' ? 0.7 : 1,
                        transition:'opacity 0.3s' }}>
            <IndiaMap
              onStateSelect={step === 'map' ? handleStateSelect : undefined}
              selectedState={selectedState}
              activeStates={history.map(h => h.state)}
            />
          </div>

          {step !== 'map' && (
            <button onClick={() => {
              setStep('map')
              setSelectedState(null)
              setSelectedDist(null)
              setResult(null)
              setWeather(null)
              setSoil(null)
            }} style={{
              width:'100%', marginTop:12, padding:'8px',
              background:'transparent',
              border:'1px solid #22C55E22', borderRadius:1,
              color:'#22C55E66', fontFamily:"'Courier New'",
              fontSize:9, letterSpacing:2, cursor:'pointer'
            }}>
              {t('crop_nge.reselect')}
            </button>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={{ marginTop:12 }}>
              <p style={{ fontFamily:"'Courier New'", fontSize:8,
                           color:'#22C55E33', letterSpacing:3, margin:'0 0 6px' }}>
                {t('crop_nge.history')}
              </p>
              {history.map((h, i) => (
                <div key={i}
                  onClick={() => {
                    setSelectedState(h.state)
                    setStep('district')
                    setResult(null)
                  }}
                  style={{ padding:'5px 8px', marginBottom:3,
                           background:'#020D05',
                           border:'1px solid #22C55E11', borderRadius:1,
                           cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#22C55E33'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#22C55E11'}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:"'Courier New'", fontSize:9,
                                    color:'#22C55E' }}>
                      {h.state} → {h.district}
                    </span>
                    <span style={{ fontFamily:"'Courier New'", fontSize:8,
                                    color:'#00FF4188' }}>
                      {h.crop}
                    </span>
                  </div>
                  <span style={{ fontFamily:"'Courier New'", fontSize:7,
                                  color:'#444' }}>
                    {h.time} // {h.conf}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — District selector / Loading / Result */}
        {step !== 'map' && (
          <div>

            {/* ── DISTRICT SELECTOR ── */}
            <AnimatePresence mode="wait">
              {(step === 'district') && (
                <motion.div key="district"
                  initial={{ opacity:0, x:20 }}
                  animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:-20 }}
                  transition={{ duration:0.3 }}>

                  <div style={{ background:'#040F07',
                                border:'1px solid #22C55E33',
                                borderRadius:4, padding:20 }}>

                    <p style={{ fontFamily:"'Courier New'", fontSize:9,
                                 color:'#22C55E66', letterSpacing:3, margin:'0 0 4px' }}>
                      {t('crop_nge.sel_dist')}
                    </p>
                    <p style={{ fontFamily:"'Exo 2'", fontSize:14,
                                 color:'#22C55E', margin:'0 0 16px',
                                 letterSpacing:3 }}>
                      {selectedState?.toUpperCase()}
                    </p>

                    {error && (
                      <div style={{ background:'#2D0A0A',
                                    border:'1px solid #16A34A44',
                                    borderRadius:2, padding:'8px 12px',
                                    marginBottom:12 }}>
                        <p style={{ fontFamily:"'Courier New'", fontSize:9,
                                     color:'#16A34A', margin:0 }}>
                          ⚠ {error}
                        </p>
                      </div>
                    )}

                    {/* Search */}
                    <div style={{ display:'flex', alignItems:'center', gap:8,
                                  background:'#020D05',
                                  border:'1px solid #22C55E44', borderRadius:2,
                                  padding:'8px 12px', marginBottom:14 }}>
                      <span style={{ color:'#22C55E66', fontSize:14 }}>⌕</span>
                      <input
                        value={distSearch}
                        onChange={e => setDistSearch(e.target.value)}
                        placeholder={t("crop_nge.search_dist")}
                        autoFocus
                        style={{ background:'transparent', border:'none',
                                  outline:'none', color:'#E8E8E8',
                                  fontFamily:"'Courier New'", fontSize:12,
                                  letterSpacing:1, width:'100%' }}
                      />
                      {distSearch && (
                        <button onClick={() => setDistSearch('')}
                          style={{ background:'none', border:'none',
                                   color:'#22C55E', cursor:'pointer',
                                   fontSize:16 }}>×</button>
                      )}
                    </div>

                    {/* Count */}
                    <p style={{ fontFamily:"'Courier New'", fontSize:8,
                                 color:'#666680', letterSpacing:2,
                                 margin:'0 0 10px' }}>
                      {t('crop_nge.dist_avail').replace('DISTRICTS AVAILABLE', districts.length + ' DISTRICTS AVAILABLE')}
                    </p>

                    {/* District grid */}
                    <div style={{ display:'grid',
                                  gridTemplateColumns:'repeat(3,1fr)',
                                  gap:6, maxHeight:380,
                                  overflowY:'auto',
                                  paddingRight:4 }}>
                      {districts.map((district, i) => {
                        const zone     = DISTRICT_ZONES[district] || 'default'
                        const zoneColor = {
                          coastal:'#86EFAC', hill:'#10B981',
                          arid:'#A3E635', plain:'#00FF41',
                          default:'#22C55E66'
                        }[zone] || '#22C55E66'

                        return (
                          <motion.button
                            key={district}
                            initial={{ opacity:0, y:5 }}
                            animate={{ opacity:1, y:0 }}
                            transition={{ delay:i * 0.02 }}
                            onClick={() => handleDistrictSelect(district)}
                            style={{
                              background: district === selectedDist
                                ? '#22C55E22' : '#020D05',
                              border:`1px solid ${district === selectedDist
                                ? '#22C55E' : '#22C55E22'}`,
                              borderRadius:2, padding:'10px 6px',
                              cursor:'pointer', textAlign:'center',
                              transition:'all 0.15s',
                              position:'relative', overflow:'hidden'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#22C55E66'
                              e.currentTarget.style.background  = '#22C55E11'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor =
                                district === selectedDist ? '#22C55E' : '#22C55E22'
                              e.currentTarget.style.background  =
                                district === selectedDist ? '#22C55E22' : '#020D05'
                            }}>

                            {/* Zone indicator dot */}
                            <div style={{
                              position:'absolute', top:3, right:3,
                              width:4, height:4, borderRadius:'50%',
                              background:zoneColor,
                              boxShadow:`0 0 4px ${zoneColor}`
                            }} />

                            <p style={{ fontFamily:"'Courier New'",
                                         fontSize:9, color:'#E8E8E8',
                                         margin:0, letterSpacing:1,
                                         lineHeight:1.3 }}>
                              {district}
                            </p>
                          </motion.button>
                        )
                      })}

                      {districts.length === 0 && (
                        <div style={{ gridColumn:'1/-1', textAlign:'center',
                                       padding:20 }}>
                          <p style={{ fontFamily:"'Courier New'", fontSize:10,
                                       color:'#444', letterSpacing:2 }}>
                            {t('crop_nge.no_match')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Zone legend */}
                    <div style={{ marginTop:12, paddingTop:12,
                                  borderTop:'1px solid #22C55E11',
                                  display:'flex', gap:12, flexWrap:'wrap' }}>
                      {[
                        { zone:'coastal', color:'#86EFAC', label:'Coastal' },
                        { zone:'hill',    color:'#10B981', label:'Hill'    },
                        { zone:'arid',    color:'#A3E635', label:'Arid'    },
                        { zone:'plain',   color:'#00FF41', label:'Plain'   },
                      ].map(z => (
                        <div key={z.zone} style={{ display:'flex',
                                                    alignItems:'center', gap:4 }}>
                          <div style={{ width:6, height:6, borderRadius:'50%',
                                         background:z.color }} />
                          <span style={{ fontFamily:"'Courier New'", fontSize:8,
                                          color:'#666680', letterSpacing:1 }}>
                            {z.label}
                          </span>
                        </div>
                      ))}
                      <span style={{ fontFamily:"'Courier New'", fontSize:8,
                                      color:'#444', letterSpacing:1 }}>
                        {t('crop_nge.zone_note')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── LOADING ── */}
              {step === 'loading' && (
                <motion.div key="loading"
                  initial={{ opacity:0 }}
                  animate={{ opacity:1 }}
                  exit={{ opacity:0 }}
                  style={{ background:'#040F07',
                           border:'1px solid #22C55E33',
                           borderRadius:4, padding:32,
                           textAlign:'center' }}>

                  <p style={{ fontFamily:"'Courier New'", fontSize:9,
                               color:'#22C55E66', letterSpacing:3, margin:'0 0 20px' }}>
                    {t('crop_nge.anal_text')} {selectedState?.toUpperCase()} → {selectedDist?.toUpperCase()}
                  </p>

                  {/* Spinner */}
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
                    <div style={{ width:48, height:48,
                                   border:'2px solid #22C55E22',
                                   borderTop:'2px solid #22C55E',
                                   borderRadius:'50%',
                                   animation:'spin 0.8s linear infinite' }} />
                  </div>

                  {/* Current phase */}
                  <p style={{ fontFamily:"'Courier New'", fontSize:11,
                               color:'#22C55E', letterSpacing:1,
                               margin:'0 0 20px',
                               animation:'flicker 0.4s infinite' }}>
                    {t('crop_nge.load' + (loadPhase + 1))}
                  </p>

                  {/* Phase bars */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {LOAD_PHASES.map((phase, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontFamily:"'Courier New'", fontSize:9,
                                        color: i < loadPhase  ? '#00FF41' :
                                               i === loadPhase ? '#22C55E' : '#333',
                                        minWidth:12 }}>
                          {i < loadPhase ? '✓' : i === loadPhase ? '▶' : '○'}
                        </span>
                        <div style={{ flex:1, height:2,
                                       background:'#22C55E11', borderRadius:1 }}>
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width: i < loadPhase ? '100%' :
                                              i === loadPhase ? '60%' : '0%' }}
                            transition={{ duration:0.4 }}
                            style={{ height:'100%', borderRadius:1,
                                      background: i < loadPhase ? '#00FF4166' : '#22C55E' }} />
                        </div>
                        <span style={{ fontFamily:"'Courier New'", fontSize:8,
                                        color: i === loadPhase ? '#22C55E' : '#333',
                                        letterSpacing:1, minWidth:180,
                                        textAlign:'left' }}>
                          {t('crop_nge.load' + (i + 1))?.replace('// ','')}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── RESULT ── */}
              {step === 'result' && result && (
                <motion.div key="result"
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.4 }}>

                  {/* Data cards row */}
                  <div style={{ display:'grid',
                                gridTemplateColumns:'repeat(3,1fr)',
                                gap:10, marginBottom:14 }}>

                    {/* Weather */}
                    <div style={{ background:'#040F07',
                                  border:'1px solid #86EFAC22',
                                  borderTop:'2px solid #86EFAC',
                                  borderRadius:2, padding:12 }}>
                      <p style={{ fontFamily:"'Courier New'", fontSize:8,
                                   color:'#86EFAC66', letterSpacing:3,
                                   margin:'0 0 8px' }}>
                        // {t('crop_nge.weather')} // {selectedDist?.toUpperCase()}
                      </p>
                      {weather && [
                        { l:t('crop_nge.temp'),     v:`${weather.temperature}°C`, c:'#22C55E' },
                        { l:t('crop_nge.hum'), v:`${weather.humidity}%`,     c:'#86EFAC' },
                        { l:t('crop_nge.rain'), v:`${weather.rainfall}mm`,    c:'#3B82F6' },
                      ].map(item => (
                        <div key={item.l} style={{ marginBottom:6 }}>
                          <p style={{ fontFamily:"'Courier New'", fontSize:7,
                                       color:'#444', letterSpacing:2,
                                       margin:'0 0 1px' }}>
                            {item.l}
                          </p>
                          <p style={{ fontFamily:"'Exo 2'", fontSize:14,
                                       fontWeight:700, color:item.c,
                                       margin:0 }}>
                            {item.v}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Soil */}
                    <div style={{ background:'#040F07',
                                  border:'1px solid #22C55E22',
                                  borderTop:'2px solid #22C55E',
                                  borderRadius:2, padding:12 }}>
                      <p style={{ fontFamily:"'Courier New'", fontSize:8,
                                   color:'#22C55E66', letterSpacing:3,
                                   margin:'0 0 8px' }}>
                        // {t('crop_nge.soil')} // {soil?.zone?.toUpperCase()} {t('crop_nge.zone').toUpperCase()}
                      </p>
                      {soil && [
                        { l:'N', v:`${soil.N}`,  c:'#22C55E' },
                        { l:'P', v:`${soil.P}`,  c:'#86EFAC' },
                        { l:'K', v:`${soil.K}`,  c:'#A3E635' },
                        { l:'pH',v:`${soil.ph}`, c:'#10B981' },
                      ].map(item => (
                        <div key={item.l} style={{ display:'flex',
                                                    justifyContent:'space-between',
                                                    alignItems:'center',
                                                    marginBottom:5 }}>
                          <span style={{ fontFamily:"'Courier New'", fontSize:8,
                                          color:'#666680', letterSpacing:2 }}>
                            {item.l}
                          </span>
                          <span style={{ fontFamily:"'Exo 2'", fontSize:12,
                                          fontWeight:700, color:item.c }}>
                            {item.v}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Location */}
                    <div style={{ background:'#040F07',
                                  border:'1px solid #10B98122',
                                  borderTop:'2px solid #10B981',
                                  borderRadius:2, padding:12 }}>
                      <p style={{ fontFamily:"'Courier New'", fontSize:8,
                                   color:'#10B98166', letterSpacing:3,
                                   margin:'0 0 8px' }}>
                        // {t('crop_nge.loc')}
                      </p>
                      <p style={{ fontFamily:"'Exo 2'", fontSize:11,
                                   color:'#22C55E', margin:'0 0 2px',
                                   letterSpacing:2 }}>
                        {selectedState?.toUpperCase()}
                      </p>
                      <p style={{ fontFamily:"'Exo 2'", fontSize:13,
                                   fontWeight:700, color:'#E8E8E8',
                                   margin:'0 0 8px', letterSpacing:1 }}>
                        {selectedDist?.toUpperCase()}
                      </p>
                      <div style={{ padding:'4px 8px',
                                    background:`${(() => {
                                      const z = soil?.zone || 'default'
                                      return {coastal:'#86EFAC',hill:'#10B981',
                                              arid:'#A3E635',plain:'#00FF41'}[z] || '#22C55E'
                                    })()}11`,
                                    border:`1px solid ${(() => {
                                      const z = soil?.zone || 'default'
                                      return {coastal:'#86EFAC',hill:'#10B981',
                                              arid:'#A3E635',plain:'#00FF41'}[z] || '#22C55E'
                                    })()}33`,
                                    borderRadius:1 }}>
                        <p style={{ fontFamily:"'Courier New'", fontSize:8,
                                     color: (() => {
                                       const z = soil?.zone || 'default'
                                       return {coastal:'#86EFAC',hill:'#10B981',
                                               arid:'#A3E635',plain:'#00FF41'}[z] || '#22C55E'
                                     })(),
                                     margin:0, letterSpacing:2 }}>
                          {(soil?.zone || 'CENTRAL').toUpperCase()} {t('crop_nge.zone').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main recommendation card */}
                  <div style={{ background:'#040F07',
                                border:'1px solid #22C55E',
                                borderRadius:4, padding:20,
                                boxShadow:'0 0 30px #22C55E22',
                                marginBottom:12 }}>

                    <div style={{ display:'flex', justifyContent:'space-between',
                                  alignItems:'flex-start', marginBottom:16 }}>
                      <div>
                        <p style={{ fontFamily:"'Courier New'", fontSize:9,
                                     color:'#22C55E66', letterSpacing:3,
                                     margin:'0 0 8px' }}>
                          {t('crop_nge.magi_rec')} {selectedDist?.toUpperCase()}
                        </p>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                          <span style={{ fontSize:44 }}>{cropInfo.emoji}</span>
                          <p style={{ fontFamily:"'Exo 2'", fontSize:26,
                                       fontWeight:900, color:'#22C55E',
                                       margin:0, letterSpacing:3,
                                       textShadow:'0 0 20px #22C55E88' }}>
                            {result.recommended_crop?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontFamily:"'Courier New'", fontSize:8,
                                     color:'#666680', letterSpacing:2,
                                     margin:'0 0 4px' }}>
                          {t('crop_nge.conf')}
                        </p>
                        <p style={{ fontFamily:"'Exo 2'", fontSize:30,
                                     fontWeight:900, color:'#00FF41',
                                     margin:0,
                                     textShadow:'0 0 15px #00FF4188' }}>
                          {result.confidence}
                        </p>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div style={{ height:6, background:'#22C55E11',
                                   borderRadius:1, overflow:'hidden',
                                   marginBottom:16 }}>
                      <motion.div
                        initial={{ width:0 }}
                        animate={{ width: result.confidence }}
                        transition={{ duration:1.2, ease:'easeOut' }}
                        style={{ height:'100%', borderRadius:1,
                                  background:'linear-gradient(90deg,#22C55E66,#00FF41)',
                                  boxShadow:'0 0 8px #00FF4166' }} />
                    </div>

                    {/* Crop stats */}
                    <div style={{ display:'grid',
                                  gridTemplateColumns:'repeat(4,1fr)',
                                  gap:8 }}>
                      {[
                        { l:t('crop_nge.avg_prof'), v:cropInfo.profit,  c:'#A3E635' },
                        { l:t('crop_nge.water'),      v:cropInfo.water,   c:'#86EFAC' },
                        { l:t('crop_nge.season'),     v:cropInfo.season,  c:'#22C55E' },
                        { l:t('crop_nge.duration'),   v:cropInfo.days,    c:'#10B981' },
                      ].map(item => (
                        <div key={item.l} style={{ background:'#020D05',
                                                    border:`1px solid ${item.c}22`,
                                                    borderRadius:2, padding:'10px 8px',
                                                    textAlign:'center' }}>
                          <p style={{ fontFamily:"'Courier New'", fontSize:7,
                                       color:'#666680', letterSpacing:2,
                                       margin:'0 0 4px' }}>
                            {item.l}
                          </p>
                          <p style={{ fontFamily:"'Exo 2'", fontSize:10,
                                       fontWeight:700, color:item.c,
                                       margin:0, letterSpacing:1 }}>
                            {item.v}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 3 alternatives */}
                  {result.top3?.length > 1 && (
                    <div style={{ background:'#040F07',
                                  border:'1px solid #22C55E22',
                                  borderRadius:4, padding:16,
                                  marginBottom:12 }}>
                      <p style={{ fontFamily:"'Courier New'", fontSize:8,
                                   color:'#22C55E44', letterSpacing:3,
                                   margin:'0 0 10px' }}>
                        {t('crop_nge.alt_rec')}
                      </p>
                      {result.top3.slice(1).map((alt, i) => {
                        const altKey  = alt.crop?.toLowerCase().replace(/[\s_]/g,'')
                        const altInfo = CROP_INFO[altKey] || { emoji:'🌱' }
                        return (
                          <div key={i} style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'8px 10px', marginBottom:6,
                            background:'#020D05', borderRadius:2,
                            border:'1px solid #22C55E11'
                          }}>
                            <span style={{ fontSize:18 }}>{altInfo.emoji}</span>
                            <span style={{ fontFamily:"'Exo 2'", fontSize:11,
                                            color:'#9CA3AF', flex:1, letterSpacing:1 }}>
                              {alt.crop?.toUpperCase()}
                            </span>
                            <div style={{ width:80, height:3,
                                           background:'#22C55E11', borderRadius:1 }}>
                              <div style={{ height:'100%', borderRadius:1,
                                             background:'#22C55E44',
                                             width:`${alt.confidence}%` }} />
                            </div>
                            <span style={{ fontFamily:"'Courier New'", fontSize:9,
                                            color:'#22C55E66', minWidth:36,
                                            textAlign:'right' }}>
                              {alt.confidence}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display:'grid',
                                gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <button onClick={() => {
                      setStep('district')
                      setResult(null)
                      setWeather(null)
                      setSoil(null)
                    }} style={{
                      padding:'10px', background:'transparent',
                      border:'1px solid #22C55E33', borderRadius:2,
                      color:'#22C55E66', fontFamily:"'Courier New'",
                      fontSize:9, letterSpacing:2, cursor:'pointer'
                    }}>
                      ← CHANGE DISTRICT
                    </button>
                    <button onClick={() => {
                      setStep('map')
                      setSelectedState(null)
                      setSelectedDist(null)
                      setResult(null)
                      setWeather(null)
                      setSoil(null)
                    }} style={{
                      padding:'10px', background:'transparent',
                      border:'1px solid #22C55E33', borderRadius:2,
                      color:'#22C55E66', fontFamily:"'Courier New'",
                      fontSize:9, letterSpacing:2, cursor:'pointer'
                    }}>
                      ← CHANGE STATE
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from{ transform:rotate(0deg) }
          to  { transform:rotate(360deg) }
        }
        @keyframes flicker {
          0%,100%{ opacity:1 }
          50%    { opacity:0.6 }
        }
      `}</style>
    </div>
  )
}
