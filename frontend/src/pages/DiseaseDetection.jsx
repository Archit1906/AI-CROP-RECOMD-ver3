import { useTranslation } from 'react-i18next'
import VineBorder from '../components/VineBorder'
import { useState, useRef, useCallback, useEffect } from 'react'
import api from '../api/axios'

const DISEASE_DATA = {
  "Tomato___Early_blight": {
    displayName: "Tomato Early Blight",
    threat: "HIGH",
    threatColor: "var(--primary)",
    cause: "Alternaria solani fungus",
    symptoms: "Dark brown spots with concentric rings on older leaves. Yellow halo around spots.",
    cure: "Remove infected leaves immediately. Apply copper-based fungicide.",
    pesticide: "Mancozeb 75% WP @ 2g/L water",
    prevention: "Avoid overhead irrigation. Practice crop rotation. Maintain proper spacing.",
    spreadRisk: 85
  },
  "Tomato___Late_blight": {
    displayName: "Tomato Late Blight",
    threat: "CRITICAL",
    threatColor: "var(--primary)",
    cause: "Phytophthora infestans",
    symptoms: "Water-soaked lesions on leaves turning brown-black. White mold under leaves.",
    cure: "Apply Metalaxyl + Mancozeb immediately. Remove all infected plants.",
    pesticide: "Ridomil Gold MZ @ 2.5g/L water",
    prevention: "Use resistant varieties. Avoid wet foliage. Destroy infected crop debris.",
    spreadRisk: 95
  },
  "Tomato___healthy": {
    displayName: "Healthy Tomato",
    threat: "NONE",
    threatColor: "#00FF41",
    cause: "No pathogen detected",
    symptoms: "No visible symptoms. Plant appears healthy.",
    cure: "No treatment required.",
    pesticide: "None required",
    prevention: "Continue regular monitoring. Maintain good agricultural practices.",
    spreadRisk: 0
  },
  "Apple___Apple_scab": {
    displayName: "Apple Scab",
    threat: "MEDIUM",
    threatColor: "#A3E635",
    cause: "Venturia inaequalis fungus",
    symptoms: "Olive-green to brown scab-like lesions on leaves and fruit.",
    cure: "Apply fungicide at early stage. Remove fallen leaves.",
    pesticide: "Captan 50% WP @ 2g/L water",
    prevention: "Plant resistant varieties. Apply dormant sprays in spring.",
    spreadRisk: 60
  },
  "Apple___Black_rot": {
    displayName: "Apple Black Rot",
    threat: "HIGH",
    threatColor: "var(--primary)",
    cause: "Botryosphaeria obtusa fungus",
    symptoms: "Brown rotting lesions on fruit. Purple-bordered leaf spots.",
    cure: "Prune infected branches. Apply copper fungicide.",
    pesticide: "Thiophanate-methyl @ 1g/L water",
    prevention: "Remove mummified fruit. Maintain tree vigor with proper fertilization.",
    spreadRisk: 75
  },
  "Apple___healthy": {
    displayName: "Healthy Apple",
    threat: "NONE",
    threatColor: "#00FF41",
    cause: "No pathogen detected",
    symptoms: "No visible symptoms.",
    cure: "No treatment required.",
    pesticide: "None required",
    prevention: "Continue regular monitoring and pruning.",
    spreadRisk: 0
  },
  "Corn___Common_rust": {
    displayName: "Corn Common Rust",
    threat: "MEDIUM",
    threatColor: "#A3E635",
    cause: "Puccinia sorghi fungus",
    symptoms: "Small brick-red to brown pustules on both leaf surfaces.",
    cure: "Apply triazole fungicide at early detection.",
    pesticide: "Propiconazole 25% EC @ 1ml/L water",
    prevention: "Plant resistant hybrids. Monitor fields regularly.",
    spreadRisk: 55
  },
  "Potato___Early_blight": {
    displayName: "Potato Early Blight",
    threat: "HIGH",
    threatColor: "var(--primary)",
    cause: "Alternaria solani fungus",
    symptoms: "Dark brown circular spots with target-board appearance on leaves.",
    cure: "Apply preventive fungicide. Remove infected foliage.",
    pesticide: "Chlorothalonil 75% WP @ 2g/L water",
    prevention: "Use certified seed tubers. Avoid excessive nitrogen fertilization.",
    spreadRisk: 70
  },
  "Potato___Late_blight": {
    displayName: "Potato Late Blight",
    threat: "CRITICAL",
    threatColor: "var(--primary)",
    cause: "Phytophthora infestans",
    symptoms: "Water-soaked lesions rapidly turning brown-black. Entire field can be destroyed.",
    cure: "Apply systemic fungicide immediately. Destroy infected plants.",
    pesticide: "Metalaxyl + Mancozeb @ 2.5g/L water",
    prevention: "Use resistant varieties. Avoid overhead irrigation.",
    spreadRisk: 98
  },
  "Potato___healthy": {
    displayName: "Healthy Potato",
    threat: "NONE",
    threatColor: "#00FF41",
    cause: "No pathogen detected",
    symptoms: "No visible symptoms.",
    cure: "No treatment required.",
    pesticide: "None required",
    prevention: "Continue crop rotation and regular monitoring.",
    spreadRisk: 0
  },
  "Rice___Brown_spot": {
    displayName: "Rice Brown Spot",
    threat: "HIGH",
    threatColor: "var(--primary)",
    cause: "Cochliobolus miyabeanus fungus",
    symptoms: "Oval brown spots with yellow halo on leaves. Can cause seedling blight.",
    cure: "Apply fungicide at booting stage.",
    pesticide: "Edifenphos 50% EC @ 1ml/L water",
    prevention: "Use disease-free seed. Apply balanced NPK fertilizers.",
    spreadRisk: 72
  },
  "Rice___Leaf_scald": {
    displayName: "Rice Leaf Scald",
    threat: "MEDIUM",
    threatColor: "#A3E635",
    cause: "Microdochium oryzae fungus",
    symptoms: "Water-soaked lesions with dark brown margins on leaf tips.",
    cure: "Apply copper-based fungicide.",
    pesticide: "Copper oxychloride @ 3g/L water",
    prevention: "Avoid excessive nitrogen. Maintain proper water management.",
    spreadRisk: 50
  },
}

const MOCK_RESULT = {
  disease: "Tomato___Early_blight",
  confidence: 91.5,
  top3: [
    { disease: "Tomato___Early_blight", confidence: 91.5 },
    { disease: "Tomato___Late_blight",  confidence: 6.2  },
    { disease: "Apple___Apple_scab",    confidence: 2.3  },
  ]
}

export default function DiseaseDetection() {
  const { t } = useTranslation()
  const [image,        setImage]        = useState(null)        // base64 preview
  const [imageFile,    setImageFile]    = useState(null)        // File object
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [scanPhase,    setScanPhase]    = useState(0)           // 0-4 scan animation phases
  const [dragOver,     setDragOver]     = useState(false)
  const [history,      setHistory]      = useState(() =>
    JSON.parse(localStorage.getItem('ak_disease_history') || '[]'))
  const [showHistory,  setShowHistory]  = useState(false)
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('ak_disease_history', JSON.stringify(history.slice(0, 3)))
  }, [history])

  // Handle file selection
  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setResult(null)
    const reader = new FileReader()
    reader.onload = e => setImage(e.target.result)
    reader.readAsDataURL(file)
  }, [])

  // Drag and drop handlers — FIX
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true)  }
  const handleDragLeave = ()  => { setDragOver(false) }

  // Scan animation phases
  const PHASES = [
    t('dis_nge.phase1'),
    t('dis_nge.phase2'),
    t('dis_nge.phase3'),
    t('dis_nge.phase4'),
    t('dis_nge.phase5'),
  ]

  // Initiate scan — FIX: actually calls API
  const handleScan = async () => {
    if (!imageFile && !image) return
    setLoading(true)
    setResult(null)
    setScanPhase(0)

    // Animate phases
    for (let i = 0; i < PHASES.length; i++) {
      await new Promise(r => setTimeout(r, 500))
      setScanPhase(i)
    }

    // ONLY use mock if no real file selected
    if (!imageFile) {
      await new Promise(r => setTimeout(r, 400))
      setResult(MOCK_RESULT)
      addToHistory(MOCK_RESULT, image)
      setLoading(false)
      return
    }

    // Real file exists — ALWAYS call real API
    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      const res = await api.post('/api/detect-disease', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      addToHistory(res.data, image)
    } catch (err) {
      console.error('Disease API error:', err)
      // Show error, NOT mock result
      setResult({
        disease: "ERROR",
        confidence: 0,
        top3: [],
        error: "Backend offline. Run: uvicorn main:app --reload"
      })
    } finally {
      setLoading(false)
    }
  }

  const addToHistory = (resultData, imgSrc) => {
    // Don't save error results to history
    if (resultData.error || resultData.disease === "ERROR") return

    const entry = {
      id:         Date.now(),
      disease:    resultData.disease,
      confidence: resultData.confidence,
      image:      imgSrc,
      timestamp:  new Date().toLocaleString('en-IN'),
      modelUsed:  resultData.model_used || 'mock'
    }
    setHistory(prev => {
      // Don't add duplicate if same image scanned twice
      const isDuplicate = prev[0]?.disease === entry.disease &&
                          prev[0]?.confidence === entry.confidence
      if (isDuplicate) return prev
      return [entry, ...prev].slice(0, 3)
    })
  }

  const loadFromHistory = (entry) => {
    setImage(entry.image)
    setResult({ disease: entry.disease, confidence: entry.confidence,
                top3: [{ disease: entry.disease, confidence: entry.confidence }] })
    setShowHistory(false)
  }

  const info = result ? (DISEASE_DATA[result.disease] || DISEASE_DATA["Tomato___healthy"]) : null
  const isHealthy = info?.threat === "NONE"

  return (
    <div style={{ padding:24, background:'var(--bg)', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ marginBottom:24, paddingBottom:16,
                    borderBottom:'1px solid var(--primary-dim)' }}>
        <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                    color:'var(--primary-dim)', letterSpacing:4, margin:'0 0 6px' }}>
          {t('dis_nge.sys_label')}
        </p>
        <h1 style={{ fontFamily:"'Exo 2'", fontSize:26, fontWeight:900,
                     color:'var(--primary)', margin:'0 0 6px', letterSpacing:4,
                     textShadow:'0 0 20px var(--primary)66' }}>
          {t('dis_nge.title')}
        </h1>
        <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10,
                    color:'#666680', margin:0, letterSpacing:3 }}>
          {t('dis_nge.subtitle')}
        </p>
      </div>

      {/* History toggle button */}
      {history.length > 0 && (
        <button onClick={() => setShowHistory(!showHistory)}
          style={{ marginBottom:16, padding:'8px 16px',
                   background: showHistory ? 'var(--primary-glow)' : 'transparent',
                   border:'1px solid var(--primary-dim)', borderRadius:2,
                   color:'var(--primary)', fontFamily:"'Share Tech Mono'",
                   fontSize:10, letterSpacing:2, cursor:'pointer' }}>
          {showHistory ? t('dis_nge.hide_hist') : t('dis_nge.show_hist')} {t('dis_nge.scan_hist')} ({history.length})
        </button>
      )}

      {/* SCAN HISTORY */}
      {showHistory && (
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          {history.map(entry => {
            const hInfo = DISEASE_DATA[entry.disease]
            return (
              <div key={entry.id}
                onClick={() => loadFromHistory(entry)}
                style={{ flex:1, background:'var(--bg-deep)',
                         border:`1px solid ${hInfo?.threatColor || 'var(--primary)'}44`,
                         borderRadius:2, padding:'12px', cursor:'pointer',
                         transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor=hInfo?.threatColor||'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor=`${hInfo?.threatColor||'var(--primary)'}44`}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {entry.image && (
                    <img src={entry.image} alt=""
                      style={{ width:40, height:40, objectFit:'cover',
                               borderRadius:2, border:'1px solid var(--primary-dim)' }} />
                  )}
                  <div>
                    <p style={{ fontFamily:"'Exo 2'", fontSize:10,
                                 color: hInfo?.threatColor || 'var(--primary)',
                                 margin:'0 0 2px', letterSpacing:1 }}>
                      {hInfo?.displayName || entry.disease}
                    </p>
                    <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                                 color:'#666680', margin:0 }}>
                      {entry.confidence}% // {entry.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Main 2-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* LEFT — Upload panel */}
        <div style={{ background:'var(--bg-deep)', border:'1px solid var(--primary-dim)',
                      borderRadius:2, padding:'20px' }}>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                      color:'var(--primary-dim)', letterSpacing:3, margin:'0 0 14px' }}>
            {t('dis_nge.vis_input')}
          </p>

          {/* Drop zone — FIX: all handlers wired */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border:`2px dashed ${dragOver ? 'var(--primary)' : image ? 'var(--primary)66' : 'var(--primary-dim)'}`,
              borderRadius:2, padding:'16px',
              minHeight:220, cursor:'pointer',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              background: dragOver ? 'var(--primary-glow)' : 'transparent',
              transition:'all 0.2s', marginBottom:14,
              position:'relative', overflow:'hidden'
            }}>

            {image ? (
              <>
                <img src={image} alt="Upload preview"
                  style={{ maxWidth:'100%', maxHeight:180,
                           objectFit:'contain', borderRadius:2 }} />
                {/* Scan line overlay on image when loading */}
                {loading && (
                  <div style={{
                    position:'absolute', inset:0,
                    background:'linear-gradient(180deg, transparent 45%, var(--primary-dim) 50%, transparent 55%)',
                    animation:'scan-line 1.5s linear infinite',
                    pointerEvents:'none'
                  }} />
                )}
                <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                             color:'var(--primary-dim)', margin:'8px 0 0', letterSpacing:2 }}>
                  {t('dis_nge.target_acq')}
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize:36, marginBottom:12, opacity:0.4,
                               color:'var(--primary)' }}>⬆</div>
                <p style={{ fontFamily:"'Exo 2'", fontSize:12,
                             color:'var(--primary-dim)', margin:'0 0 6px', letterSpacing:2 }}>
                  {t('dis_nge.drop_data')}
                </p>
                <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                             color:'#444', margin:0, letterSpacing:1 }}>
                  {t('dis_nge.browse_local')}
                </p>
              </>
            )}
          </div>

          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/*"
            style={{ display:'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          <input ref={cameraInputRef} type="file" accept="image/*"
            capture="environment"
            style={{ display:'none' }}
            onChange={e => handleFile(e.target.files[0])} />

          {/* Camera + Upload buttons */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <button onClick={() => cameraInputRef.current?.click()}
              style={{ flex:1, padding:'10px 8px',
                       background:'transparent',
                       border:'1px solid var(--primary-dim)', borderRadius:2,
                       color:'var(--primary-dim)', fontFamily:"'Share Tech Mono'",
                       fontSize:10, letterSpacing:2, cursor:'pointer' }}>
              {t('dis_nge.capture')}
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ flex:1, padding:'10px 8px',
                       background:'transparent',
                       border:'1px solid var(--primary-dim)', borderRadius:2,
                       color:'var(--primary-dim)', fontFamily:"'Share Tech Mono'",
                       fontSize:10, letterSpacing:2, cursor:'pointer' }}>
              {t('dis_nge.browse')}
            </button>
          </div>

          {/* Scan animation phases */}
          {loading && (
            <div style={{ background:'var(--bg)', border:'1px solid var(--primary-dim)',
                          borderRadius:2, padding:'10px 14px', marginBottom:12 }}>
              {PHASES.map((phase, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center',
                                       gap:8, padding:'3px 0' }}>
                  <span style={{ fontSize:10,
                                  color: i < scanPhase ? '#00FF41' :
                                         i === scanPhase ? 'var(--primary)' : '#333' }}>
                    {i < scanPhase ? '✓' : i === scanPhase ? '►' : '○'}
                  </span>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                               color: i < scanPhase ? '#00FF4166' :
                                      i === scanPhase ? 'var(--primary)' : '#333',
                               margin:0, letterSpacing:1 }}>
                    {phase}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Initiate Scan button — FIX: onClick wired */}
          <button onClick={handleScan}
            disabled={loading || (!image && !imageFile)}
            style={{
              width:'100%', padding:'14px',
              background: loading ? 'var(--primary-glow)' :
                          (!image && !imageFile) ? 'var(--bg)' : 'var(--primary-glow)',
              border:`1px solid ${loading ? 'var(--primary-dim)' : (!image && !imageFile) ? 'var(--primary-glow)' : 'var(--primary)'}`,
              color: loading ? 'var(--primary-dim)' :
                     (!image && !imageFile) ? 'var(--primary-dim)' : 'var(--primary)',
              fontFamily:"'Exo 2'", fontSize:12, fontWeight:700,
              letterSpacing:4, cursor: (!image && !imageFile) ? 'not-allowed' : 'pointer',
              borderRadius:2, transition:'all 0.2s',
              boxShadow: (!loading && image) ? '0 0 20px var(--primary)33' : 'none'
            }}
            onMouseEnter={e => { if(image && !loading) e.currentTarget.style.background='var(--primary-dim)' }}
            onMouseLeave={e => { if(image && !loading) e.currentTarget.style.background='var(--primary-glow)' }}>
            {loading ? `⚙ ${PHASES[scanPhase]?.replace('// ','')}` : t('dis_nge.init_scan')}
          </button>
        </div>

        {/* RIGHT — Result panel — FIX: shows results */}
        <div style={{ background:'var(--bg-deep)', border:`1px solid ${result ? (info?.threatColor||'var(--primary)')+'44' : 'var(--primary-glow)'}`,
                      borderRadius:2, padding:'20px',
                      transition:'border-color 0.3s' }}>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                      color:'var(--primary-dim)', letterSpacing:3, margin:'0 0 14px' }}>
            {result ? t('dis_nge.threat_comp') : t('dis_nge.await_data')}
          </p>

          {!result && !loading && (
            <div style={{ display:'flex', flexDirection:'column',
                          alignItems:'center', justifyContent:'center',
                          height:300, gap:16 }}>
              <span style={{ fontSize:48, opacity:0.2 }}>🔬</span>
              <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10,
                           color:'#333', textAlign:'center',
                           lineHeight:1.8, letterSpacing:1 }}>
                {t('dis_nge.idle_msg').split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}
              </p>
            </div>
          )}

          {loading && (
            <div style={{ display:'flex', flexDirection:'column',
                          alignItems:'center', justifyContent:'center',
                          height:300, gap:16 }}>
              <div style={{ width:80, height:80,
                             border:'2px solid var(--primary-dim)',
                             borderTop:'2px solid var(--primary)',
                             borderRadius:'50%',
                             animation:'spin 1s linear infinite' }} />
              <p style={{ fontFamily:"'Exo 2'", fontSize:12,
                           color:'var(--primary)', letterSpacing:3,
                           textShadow:'0 0 10px var(--primary)66' }}>
                {t('dis_nge.scanning')}
              </p>
            </div>
          )}

          {result && info && (
            <div>
              {/* Threat status banner */}
              <div style={{
                background: isHealthy ? '#00FF4111' : 'var(--primary-glow)',
                border:`1px solid ${info.threatColor}`,
                borderRadius:2, padding:'12px 16px', marginBottom:16,
                display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
                <div>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                               color: info.threatColor, letterSpacing:3, margin:'0 0 4px' }}>
                    {isHealthy ? t('dis_nge.nom') : t('dis_nge.threat_id')}
                  </p>
                  <p style={{ fontFamily:"'Exo 2'", fontSize:16, fontWeight:900,
                               color: info.threatColor, margin:0, letterSpacing:2,
                               textShadow:`0 0 10px ${info.threatColor}66` }}>
                    {info.displayName.toUpperCase()}
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                               color:'#666680', margin:'0 0 4px', letterSpacing:2 }}>
                    {t('dis_nge.threat_level')}
                  </p>
                  <span style={{
                    background:`${info.threatColor}22`,
                    border:`1px solid ${info.threatColor}`,
                    color: info.threatColor,
                    fontFamily:"'Exo 2'", fontSize:11, fontWeight:700,
                    padding:'4px 12px', letterSpacing:2
                  }}>
                    {info.threat}
                  </span>
                </div>
              </div>

              {/* Confidence bar */}
              <div style={{ background:'var(--bg)', border:'1px solid var(--primary-dim)',
                            borderRadius:2, padding:'12px 16px', marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                               color:'#666680', margin:0, letterSpacing:2 }}>
                    {t('dis_nge.det_conf')}
                  </p>
                  <p style={{ fontFamily:"'Exo 2'", fontSize:14, fontWeight:900,
                               color: info.threatColor, margin:0,
                               textShadow:`0 0 8px ${info.threatColor}66` }}>
                    {result.confidence}%
                  </p>
                </div>
                <div style={{ height:8, background:'var(--primary-glow)',
                               borderRadius:1, overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:1,
                    width:`${result.confidence}%`,
                    background:`linear-gradient(90deg, ${info.threatColor}88, ${info.threatColor})`,
                    transition:'width 1s ease',
                    boxShadow:`0 0 8px ${info.threatColor}66`
                  }} />
                </div>

                {/* Top 3 alternatives */}
                {result.top3?.length > 1 && (
                  <div style={{ marginTop:10 }}>
                    <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                                 color:'#444', letterSpacing:2, margin:'0 0 6px' }}>
                      {t('dis_nge.alt_match')}
                    </p>
                    {result.top3.slice(1).map((alt, i) => {
                      const altInfo = DISEASE_DATA[alt.disease]
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center',
                                               gap:8, marginBottom:4 }}>
                          <div style={{ height:4, flex:1, background:'var(--primary-glow)', borderRadius:1 }}>
                            <div style={{ height:'100%', borderRadius:1,
                                           width:`${alt.confidence}%`,
                                           background:'var(--primary-dim)' }} />
                          </div>
                          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                                       color:'#444', margin:0, minWidth:140 }}>
                            {altInfo?.displayName || alt.disease} — {alt.confidence}%
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Spread risk */}
              {!isHealthy && (
                <div style={{ background:'var(--bg)', border:'1px solid var(--primary-dim)',
                              borderRadius:2, padding:'12px 16px', marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                                 color:'#666680', margin:0, letterSpacing:2 }}>
                      {t('dis_nge.spread_risk')}
                    </p>
                    <p style={{ fontFamily:"'Exo 2'", fontSize:12, fontWeight:700,
                                 color: info.spreadRisk > 80 ? 'var(--primary)' :
                                        info.spreadRisk > 50 ? '#A3E635' : '#00FF41',
                                 margin:0 }}>
                      {info.spreadRisk}%
                    </p>
                  </div>
                  <div style={{ height:6, background:'var(--primary-glow)', borderRadius:1 }}>
                    <div style={{
                      height:'100%', borderRadius:1,
                      width:`${info.spreadRisk}%`,
                      background: info.spreadRisk > 80 ? 'var(--primary)' :
                                  info.spreadRisk > 50 ? '#A3E635' : '#00FF41',
                      transition:'width 1s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Cure & Treatment panel */}
              {[
                { label:t('dis_nge.lbl_path'), value:info.cause,       color:'var(--primary)' },
                { label:t('dis_nge.lbl_symp'), value:info.symptoms,    color:'#A3E635' },
                { label:t('dis_nge.lbl_cure'), value:info.cure, color:'var(--tertiary)' },
                { label:t('dis_nge.lbl_pest'), value:info.pesticide, color:'#10B981' },
                { label:t('dis_nge.lbl_prev'), value:info.prevention, color:'#00FF41' },
              ].map(item => (
                <div key={item.label}
                  style={{ background:'var(--bg)',
                           borderLeft:`3px solid ${item.color}44`,
                           padding:'10px 14px', marginBottom:8, borderRadius:'0 2px 2px 0' }}>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                               color:`${item.color}88`, letterSpacing:3, margin:'0 0 4px' }}>
                    // {item.label}
                  </p>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11,
                               color:item.color, margin:0, lineHeight:1.6 }}>
                    {item.value}
                  </p>
                </div>
              ))}

              {/* Reset button */}
              <button onClick={() => { setResult(null); setImage(null); setImageFile(null) }}
                style={{ width:'100%', padding:'10px', marginTop:8,
                         background:'transparent', border:'1px solid var(--primary-dim)',
                         color:'var(--primary-dim)', fontFamily:"'Share Tech Mono'",
                         fontSize:10, letterSpacing:3, cursor:'pointer', borderRadius:2 }}>
                {t('dis_nge.clear_rescan')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  )
}
