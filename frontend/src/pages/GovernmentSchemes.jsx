import { useTranslation } from 'react-i18next'
import VineBorder from '../components/VineBorder'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GovernmentSchemes() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [schemes,      setSchemes]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [lastUpdated,  setLastUpdated]  = useState(null)
  const [stats,        setStats]        = useState({})
  const [newSchemeIds, setNewSchemeIds] = useState(new Set())
  const prevSchemesRef = useRef([])

  const [search, setSearch]               = useState("")
  const [activeFilter, setActiveFilter]   = useState("all")
  const [bookmarks, setBookmarks]         = useState(() => JSON.parse(localStorage.getItem('ak_bookmarks') || '[]'))
  const [showBookmarked, setShowBookmarked] = useState(false)
  const [expandedId, setExpandedId]       = useState(null)
  const [eligibilityScheme, setEligibilityScheme] = useState(null)
  const [eligibilityResult, setEligibilityResult] = useState(null)
  const [eligibilityForm, setEligibilityForm] = useState({
    state: 'Tamil Nadu', landAcres: '', category: 'small', hasCrops: true
  })

  // Fetch schemes from backend
  const fetchSchemes = async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res  = await fetch(`${apiUrl}/api/schemes`)
      const data = await res.json()

      const prevIds  = new Set(prevSchemesRef.current.map(s => s.id))
      const newIds   = new Set(
        data.schemes
          .filter(s => !prevIds.has(s.id) && prevSchemesRef.current.length > 0)
          .map(s => s.id)
      )
      if (newIds.size > 0) setNewSchemeIds(newIds)

      prevSchemesRef.current = data.schemes
      setSchemes(data.schemes)
      setStats({
        total:   data.total,
        active:  data.active_count,
        expired: data.expired_count,
        isNew:   data.new_count
      })
      setLastUpdated(data.last_updated)
      setError(null)
    } catch (err) {
      setError(t('gov_nge.err_load'))
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchSchemes(true)
  }, [])

  // Auto-refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => fetchSchemes(false), 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Clear new highlight after 5 seconds
  useEffect(() => {
    if (newSchemeIds.size > 0) {
      const t = setTimeout(() => setNewSchemeIds(new Set()), 5000)
      return () => clearTimeout(t)
    }
  }, [newSchemeIds])

  // Countdown timer
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handleRefresh = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    await fetch(`${apiUrl}/api/schemes/refresh`, { method: 'POST' })
    setTimeout(() => fetchSchemes(false), 2000)
  }

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ak_bookmarks', JSON.stringify(bookmarks))
  }, [bookmarks])

  const toggleBookmark = (id) => {
    setBookmarks(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  const FILTERS = [
    { key: 'all',            label: t('gov_nge.f_all')           },
    { key: 'insurance',      label: t('gov_nge.f_ins')     },
    { key: 'income_support', label: t('gov_nge.f_inc')},
    { key: 'drought_relief', label: t('gov_nge.f_drought')},
    { key: 'subsidy',        label: t('gov_nge.f_sub')     },
    { key: 'loan',           label: t('gov_nge.f_loan')         },
  ]

  // FIX: filtered schemes — search + filter both work
  const filtered = useMemo(() => {
    let list = showBookmarked
      ? schemes.filter(s => bookmarks.includes(s.id))
      : schemes.filter(s => !s.is_expired)

    if (activeFilter !== 'all') {
      list = list.filter(s => s.category === activeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    return list
  }, [schemes, search, activeFilter, showBookmarked, bookmarks])

  const getCountdown = (deadlineStr) => {
    const deadline = new Date(deadlineStr)
    const diff     = deadline - now
    if (diff <= 0) return { label:t('gov_nge.expired'), color:'#16A34A', urgent:true, expired:true }
    const days    = Math.floor(diff / 86400000)
    const hours   = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    if (days === 0)  return { label:`${hours}h ${minutes}m ${seconds}s`, color:'#16A34A', urgent:true,  expired:false }
    if (days <= 7)   return { label:`${days}d ${hours}h left`,           color:'#16A34A', urgent:true,  expired:false }
    if (days <= 30)  return { label:`${days} days left`,                 color:'#A3E635', urgent:false, expired:false }
    return              { label:`${days} days left`,                     color:'#00FF41', urgent:false, expired:false }
  }

  const checkEligibility = () => {
    const { state, landAcres, category } = eligibilityForm
    const acres = parseFloat(landAcres) || 0
    const results = []

    schemes.forEach(scheme => {
      let eligible = true
      let reasons  = []

      if (scheme.level === 'STATE' && !scheme.name.toLowerCase().includes('tn') && state !== 'Tamil Nadu') {
        eligible = false
        reasons.push('State-specific scheme')
      }
      if (scheme.category === 'loan' && acres < 0.5) {
        eligible = false
        reasons.push('Minimum 0.5 acres required')
      }
      if (eligible) results.push({ ...scheme, reasons })
    })

    setEligibilityResult(results)
  }

  return (
    <div style={{ padding:24, background:'#020D05', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', marginBottom:24,
                    paddingBottom:0 }}>
        <div>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                      color:'#22C55E66', letterSpacing:4, margin:'0 0 6px' }}>
            {t('gov_nge.clr_req')}
          </p>
          <h1 style={{ fontFamily:"'Exo 2'", fontSize:28, fontWeight:900,
                       color:'#22C55E', margin:'0 0 6px', letterSpacing:4,
                       textShadow:'0 0 20px #22C55E66' }}>
            {t('gov_nge.title')}
          </h1>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <span style={{ background:'#22C55E33', border:'1px solid #16A34A',
                           color:'#16A34A', fontFamily:"'Share Tech Mono'",
                           fontSize:9, padding:'2px 8px', letterSpacing:2 }}>
              {t('gov_nge.restricted')}
            </span>
            <span style={{ fontFamily:"'Share Tech Mono'", fontSize:10,
                           color:'#666680', letterSpacing:2 }}>
              {t('gov_nge.subtitle')}
            </span>
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          {/* Refresh button */}
          <button onClick={handleRefresh} style={{
            padding: '8px 14px', background: 'transparent',
            border: '1px solid #22C55E44', borderRadius: 2,
            color: '#22C55E66', fontFamily: "'Courier New'",
            fontSize: 9, letterSpacing: 2, cursor: 'pointer',
            display: 'flex', alignItems: 'center'
          }}>
            {t('gov_nge.refresh')}
          </button>

          {/* Bookmarks toggle */}
          <button onClick={() => setShowBookmarked(!showBookmarked)}
            style={{
              padding:'10px 16px', border:`1px solid ${showBookmarked ? '#A3E635' : '#22C55E44'}`,
              background: showBookmarked ? '#A3E63522' : 'transparent',
              color: showBookmarked ? '#A3E635' : '#666680',
              fontFamily:"'Exo 2'", fontSize:10, letterSpacing:2,
              cursor:'pointer', borderRadius:2, display:'flex', alignItems:'center', gap:6
            }}>
            {t('gov_nge.saved')} ({bookmarks.length})
          </button>

          {/* Verify Clearance — opens eligibility checker */}
          <button onClick={() => setEligibilityScheme('all')}
            style={{
              padding:'10px 20px', border:'1px solid #86EFAC',
              background:'#86EFAC11', color:'#86EFAC',
              fontFamily:"'Exo 2'", fontSize:10, letterSpacing:2,
              cursor:'pointer', borderRadius:2,
              boxShadow:'0 0 15px #86EFAC22'
            }}>
            {t('gov_nge.verify_clr')}
          </button>
        </div>
      </div>

      {/* Last updated indicator */}
      {lastUpdated && (
        <p style={{ fontFamily: "'Courier New'", fontSize: 8,
                    color: '#444', letterSpacing: 2, margin: '-16px 0 24px' }}>
          {t('gov_nge.last_sync')} {new Date(lastUpdated).toLocaleString('en-IN')}
        </p>
      )}

      {/* Stats bar */}
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        {[
          { label:t('gov_nge.tot_dir'), value:stats.total || 0,                               color:'#22C55E' },
          { label:t('gov_nge.act_sch'),   value:stats.active || 0,                              color:'#00FF41' },
          { label:t('gov_nge.new_seas'),  value:stats.isNew || 0,                               color:'#A3E635' },
          { label:t('gov_nge.expired'),          value:stats.expired || 0,                             color:'#16A34A' },
        ].map(stat => (
          <div key={stat.label} style={{
            background:'#040F07', border:`1px solid ${stat.color}33`,
            borderRadius:2, padding:'10px 16px', flex:1, textAlign:'center'
          }}>
            <p style={{ fontFamily:"'Exo 2'", fontSize:20, fontWeight:900,
                         color:stat.color, margin:'0 0 2px',
                         textShadow:`0 0 10px ${stat.color}66` }}>
              {stat.value}
            </p>
            <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                         color:'#666680', margin:0, letterSpacing:2 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Filters — FIX: all wired to state */}
      <div style={{ background:'#040F07', border:'1px solid #22C55E44',
                    borderLeft:'3px solid #22C55E', borderRadius:2,
                    padding:'16px', marginBottom:20 }}>
        <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                    color:'#22C55E66', letterSpacing:3, margin:'0 0 10px' }}>
          {t('gov_nge.idx_query')}
        </p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {/* Search input — FIX: onChange wired */}
          <div style={{ flex:1, minWidth:200, display:'flex',
                        alignItems:'center', gap:8,
                        background:'#020D05', border:'1px solid #22C55E44',
                        borderRadius:2, padding:'8px 12px' }}>
            <span style={{ color:'#22C55E66' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("gov_nge.search_pl")}
              style={{ background:'transparent', border:'none', outline:'none',
                       color:'#E8E8E8', fontFamily:"'Share Tech Mono'",
                       fontSize:12, letterSpacing:1, width:'100%' }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background:'none', border:'none', color:'#22C55E',
                         cursor:'pointer', fontSize:14 }}>×</button>
            )}
          </div>

          {/* Filter buttons — FIX: onClick wired */}
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              style={{
                padding:'8px 14px', border:'1px solid',
                borderColor: activeFilter===f.key ? '#22C55E' : '#22C55E33',
                background:  activeFilter===f.key ? '#22C55E22' : 'transparent',
                color:       activeFilter===f.key ? '#22C55E'   : '#666680',
                fontFamily:"'Exo 2'", fontSize:9,
                letterSpacing:2, cursor:'pointer', borderRadius:2,
                transition:'all 0.15s'
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                    color:'#666680', margin:'10px 0 0', letterSpacing:2 }}>
          // {filtered.length} {t('gov_nge.dir_found')}
          {showBookmarked && t('gov_nge.show_bm')}
          {search && `${t('gov_nge.query')} "${search.toUpperCase()}"`}
        </p>
      </div>

      {/* New scheme notification banner */}
      {newSchemeIds.size > 0 && (
        <div style={{
          background: '#00FF4111', border: '1px solid #00FF41',
          borderRadius: 4, padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: 18 }}>🆕</span>
          <p style={{ fontFamily: "'Exo 2'", fontSize: 12,
                       color: '#00FF41', margin: 0, letterSpacing: 2 }}>
            {newSchemeIds.size} {t('gov_nge.new_dir')}
          </p>
        </div>
      )}

      {/* Expired scheme tombstone */}
      {schemes.filter(s => s.is_expired).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: "'Courier New'", fontSize: 8,
                       color: '#22C55E44', letterSpacing: 3, margin: '0 0 8px' }}>
            {t('gov_nge.exp_dir')} {schemes.filter(s => s.is_expired).length} {t('gov_nge.sch_closed')}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {schemes.filter(s => s.is_expired).map(s => (
              <div key={s.id} style={{
                background: '#1A0000', border: '1px solid #22C55E22',
                borderRadius: 2, padding: '6px 12px',
                opacity: 0.5
              }}>
                <p style={{ fontFamily: "'Courier New'", fontSize: 9,
                             color: '#16A34A', margin: 0,
                             textDecoration: 'line-through', letterSpacing: 1 }}>
                  {s.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              background: '#040F07', border: '1px solid #22C55E11',
              borderRadius: 4, padding: 20, height: 280,
              animation: 'shimmer 1.5s infinite'
            }}>
              <div style={{ height: 12, background: '#22C55E11', borderRadius: 2, marginBottom: 12 }} />
              <div style={{ height: 20, background: '#22C55E11', borderRadius: 2, marginBottom: 8, width: '60%' }} />
              <div style={{ height: 60, background: '#22C55E11', borderRadius: 2 }} />
            </div>
          ))}
        </div>
      )}

      {/* Schemes grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <p style={{ fontFamily:"'Exo 2'", fontSize:16,
                      color:'#22C55E44', letterSpacing:4 }}>
            {t('gov_nge.no_dir')}
          </p>
          <p style={{ fontFamily:"'Share Tech Mono'", color:'#444',
                      fontSize:12, marginTop:8 }}>
            {t('gov_nge.adj_query')}
          </p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {filtered.map(scheme => {
            const countdown   = getCountdown(scheme.deadline)
            const isBookmarked = bookmarks.includes(scheme.id)
            const isExpanded  = expandedId === scheme.id

            return (
              <div key={scheme.id}
                style={{
                  background:'#040F07',
                  border:`1px solid ${isExpanded ? scheme.color : '#22C55E33'}`,
                  borderTop:`2px solid ${scheme.color}`,
                  borderRadius:2, padding:'20px',
                  transition:'all 0.2s', position:'relative',
                  boxShadow: isExpanded ? `0 0 20px ${scheme.color}22` : 'none'
                }}>

                {/* NEW badge */}
                {scheme.is_new && (
                  <div style={{
                    position:'absolute', top:-1, right:40,
                    background:'#00FF41', color:'#000',
                    fontFamily:"'Exo 2'", fontSize:8,
                    padding:'2px 8px', letterSpacing:2
                  }}>
                    NEW
                  </div>
                )}

                {/* Card header */}
                <div style={{ display:'flex', justifyContent:'space-between',
                              alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{
                    width:44, height:44,
                    background:`${scheme.color}22`,
                    border:`1px solid ${scheme.color}44`,
                    borderRadius:2, display:'flex',
                    alignItems:'center', justifyContent:'center',
                    fontSize:22
                  }}>
                    {scheme.icon}
                  </div>

                  {/* Bookmark button — FIX: onClick wired */}
                  <button onClick={() => toggleBookmark(scheme.id)}
                    style={{
                      background: isBookmarked ? '#A3E63522' : 'transparent',
                      border:`1px solid ${isBookmarked ? '#A3E635' : '#22C55E33'}`,
                      color: isBookmarked ? '#A3E635' : '#666680',
                      padding:'6px 8px', cursor:'pointer', borderRadius:2,
                      fontSize:14, transition:'all 0.15s'
                    }}>
                    {isBookmarked ? '🔖' : '📌'}
                  </button>
                </div>

                {/* Tags */}
                <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                  <span style={{
                    background:`${scheme.color}22`, color:scheme.color,
                    fontFamily:"'Share Tech Mono'", fontSize:8,
                    padding:'2px 8px', letterSpacing:2, borderRadius:1
                  }}>
                    [{scheme.level}]
                  </span>
                  {scheme.tags.map(tag => (
                    <span key={tag} style={{
                      background:'#22C55E11', color:'#22C55E88',
                      fontFamily:"'Share Tech Mono'", fontSize:8,
                      padding:'2px 8px', letterSpacing:2, borderRadius:1
                    }}>
                      [{tag}]
                    </span>
                  ))}
                </div>

                {/* Name */}
                <h3 style={{
                  fontFamily:"'Exo 2'", fontSize:14, fontWeight:700,
                  color:'#E8E8E8', margin:'0 0 8px', letterSpacing:1
                }}>
                  {scheme.name.toUpperCase()}
                </h3>

                <p style={{
                  fontFamily:"'Share Tech Mono'", fontSize:11,
                  color:'#9CA3AF', margin:'0 0 12px', lineHeight:1.6
                }}>
                  {scheme.description}
                </p>

                <div style={{ borderTop:'1px solid #22C55E22', paddingTop:12, marginBottom:12 }}>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                               color:'#666680', margin:'0 0 4px', letterSpacing:2 }}>
                    {t('gov_nge.grant_amt')}
                  </p>
                  <p style={{ fontFamily:"'Exo 2'", fontSize:12, fontWeight:700,
                               color:scheme.color, margin:'0 0 10px',
                               textShadow:`0 0 8px ${scheme.color}66` }}>
                    {scheme.grant.toUpperCase()}
                  </p>

                  {/* Deadline countdown */}
                  <div style={{ display:'flex', justifyContent:'space-between',
                                alignItems:'center' }}>
                    <div>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                                   color:'#666680', margin:'0 0 2px', letterSpacing:2 }}>
                        {t('gov_nge.deadline')}
                      </p>
                      <p style={{
                        fontFamily:"'Share Tech Mono'", fontSize:10,
                        color: countdown.color, margin:0,
                        fontWeight: countdown.urgent ? 700 : 400,
                        animation: countdown.urgent ? 'flicker 2s infinite' : 'none'
                      }}>
                        {countdown.urgent && '⚠ '}{countdown.label}
                      </p>
                    </div>

                    {/* Expand toggle */}
                    <button onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
                      style={{
                        background:'transparent',
                        border:`1px solid ${scheme.color}44`,
                        color:scheme.color, padding:'4px 10px',
                        fontFamily:"'Share Tech Mono'", fontSize:10,
                        cursor:'pointer', borderRadius:1, letterSpacing:1
                      }}>
                      {isExpanded ? t('gov_nge.less') : t('gov_nge.more')}
                    </button>
                  </div>
                </div>

                {/* EXPANDED DETAIL VIEW */}
                {isExpanded && (
                  <div style={{
                    background:'#020D05', border:`1px solid ${scheme.color}33`,
                    borderRadius:2, padding:'14px', marginBottom:12
                  }}>
                    <div style={{ marginBottom:10 }}>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                                   color:'#666680', margin:'0 0 4px', letterSpacing:2 }}>
                        {t('gov_nge.reqs')}
                      </p>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11,
                                   color:'#86EFAC', margin:0 }}>
                        {scheme.eligibility.toUpperCase()}
                      </p>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                                   color:'#666680', margin:'0 0 4px', letterSpacing:2 }}>
                        {t('gov_nge.docs')}
                      </p>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11,
                                   color:'#9CA3AF', margin:0 }}>
                        {scheme.requirements}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8,
                                   color:'#666680', margin:'0 0 4px', letterSpacing:2 }}>
                        APPLICATION {t('gov_nge.deadline')}
                      </p>
                      <p style={{ fontFamily:"'Share Tech Mono'", fontSize:11,
                                   color: countdown.color, margin:0 }}>
                        {new Date(scheme.deadline).toLocaleDateString('en-IN', {
                          day:'numeric', month:'long', year:'numeric'
                        }).toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons — FIX: both wired */}
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={() => window.open(scheme.apply_url, '_blank')}
                    style={{
                      flex:1, padding:'10px 8px',
                      background:`${scheme.color}22`,
                      border:`1px solid ${scheme.color}`,
                      color:scheme.color,
                      fontFamily:"'Exo 2'", fontSize:9,
                      letterSpacing:2, cursor:'pointer', borderRadius:1,
                      transition:'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background=`${scheme.color}44`}
                    onMouseLeave={e => e.currentTarget.style.background=`${scheme.color}22`}>
                    {t('gov_nge.req_auth')}
                  </button>
                  <button
                    onClick={() => setEligibilityScheme(scheme)}
                    style={{
                      padding:'10px 12px',
                      background:'transparent',
                      border:'1px solid #22C55E44',
                      color:'#22C55E',
                      fontFamily:"'Share Tech Mono'", fontSize:14,
                      cursor:'pointer', borderRadius:1,
                      transition:'all 0.15s'
                    }}
                    title={t("gov_nge.chk_elig")}>
                    ✓
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ELIGIBILITY CHECKER MODAL */}
      {eligibilityScheme && (
        <div style={{
          position:'fixed', inset:0,
          background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:20
        }}
          onClick={e => { if(e.target===e.currentTarget) { setEligibilityScheme(null); setEligibilityResult(null) }}}>

          <div style={{
            background:'#040F07', border:'1px solid #86EFAC',
            borderRadius:4, padding:28, width:'100%', maxWidth:520,
            boxShadow:'0 0 40px #86EFAC22'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center', marginBottom:20 }}>
              <div>
                <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                             color:'#86EFAC88', letterSpacing:3, margin:'0 0 4px' }}>
                  {t('gov_nge.evs')}
                </p>
                <h2 style={{ fontFamily:"'Exo 2'", fontSize:16, fontWeight:700,
                              color:'#86EFAC', margin:0, letterSpacing:3 }}>
                  {t('gov_nge.vc_title')}
                </h2>
              </div>
              <button onClick={() => { setEligibilityScheme(null); setEligibilityResult(null) }}
                style={{ background:'none', border:'1px solid #22C55E44',
                         color:'#22C55E', fontSize:18, cursor:'pointer',
                         width:32, height:32, borderRadius:2 }}>
                ×
              </button>
            </div>

            {!eligibilityResult ? (
              <>
                {[
                  { label:t('gov_nge.lbl_state'), key:'state', type:'select',
                    options:['Tamil Nadu','Maharashtra','Punjab','Karnataka','Andhra Pradesh'] },
                  { label:t('gov_nge.lbl_land'), key:'landAcres', type:'number', placeholder:'E.G. 2.5' },
                  { label:t('gov_nge.lbl_cat'), key:'category', type:'select',
                    options:['small','marginal','large'] },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom:16 }}>
                    <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                                 color:'#22C55E88', letterSpacing:3, margin:'0 0 6px' }}>
                      // {field.label}
                    </p>
                    {field.type === 'select' ? (
                      <select value={eligibilityForm[field.key]}
                        onChange={e => setEligibilityForm(p => ({...p, [field.key]:e.target.value}))}
                        style={{ width:'100%', background:'#020D05',
                                 border:'1px solid #22C55E66', borderRadius:2,
                                 color:'#E8E8E8', fontFamily:"'Share Tech Mono'",
                                 padding:'10px 12px', outline:'none' }}>
                        {field.options.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                      </select>
                    ) : (
                      <input type={field.type}
                        placeholder={field.placeholder}
                        value={eligibilityForm[field.key]}
                        onChange={e => setEligibilityForm(p => ({...p, [field.key]:e.target.value}))}
                        style={{ width:'100%', background:'#020D05',
                                 border:'1px solid #22C55E66', borderRadius:2,
                                 color:'#E8E8E8', fontFamily:"'Share Tech Mono'",
                                 padding:'10px 12px', outline:'none' }} />
                    )}
                  </div>
                ))}

                <button onClick={checkEligibility}
                  style={{ width:'100%', padding:'12px',
                           background:'#86EFAC22', border:'1px solid #86EFAC',
                           color:'#86EFAC', fontFamily:"'Exo 2'",
                           fontSize:11, letterSpacing:3, cursor:'pointer',
                           borderRadius:2, boxShadow:'0 0 15px #86EFAC22' }}>
                  {t('gov_nge.init_scan')}
                </button>
              </>
            ) : (
              <>
                <div style={{ background:'#00FF4111', border:'1px solid #00FF4133',
                              borderRadius:2, padding:'12px 16px', marginBottom:16 }}>
                  <p style={{ fontFamily:"'Exo 2'", fontSize:13, color:'#00FF41',
                               margin:'0 0 4px', letterSpacing:2 }}>
                    {t('gov_nge.clr_grant')}
                  </p>
                  <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10,
                               color:'#9CA3AF', margin:0 }}>
                    {eligibilityResult.length} {t('gov_nge.dir_avail')}
                  </p>
                </div>

                <div style={{ maxHeight:240, overflowY:'auto', marginBottom:16 }}>
                  {eligibilityResult.map(s => (
                    <div key={s.id} style={{
                      display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'8px 12px',
                      borderBottom:'1px solid #22C55E11'
                    }}>
                      <span style={{ fontFamily:"'Share Tech Mono'", fontSize:11, color:'#E8E8E8' }}>
                        {s.icon} {s.name}
                      </span>
                      <span style={{ fontFamily:"'Share Tech Mono'", fontSize:10,
                                     color:s.color }}>
                        {s.grant.split(' ').slice(0,3).join(' ')}
                      </span>
                    </div>
                  ))}
                </div>

                <button onClick={() => { setEligibilityResult(null); setEligibilityScheme(null) }}
                  style={{ width:'100%', padding:'10px',
                           background:'#22C55E22', border:'1px solid #22C55E',
                           color:'#22C55E', fontFamily:"'Exo 2'",
                           fontSize:10, letterSpacing:3, cursor:'pointer', borderRadius:2 }}>
                  {t('gov_nge.close_term')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes shimmer {
          0%,100%{ opacity:0.4 }
          50%    { opacity:0.7 }
        }
        @keyframes fadeIn {
          from{ opacity:0; transform:translateY(-10px) }
          to  { opacity:1; transform:translateY(0) }
        }
        @keyframes newPulse {
          0%,100%{ box-shadow:0 0 0 0 rgba(0,255,65,0.4) }
          50%    { box-shadow:0 0 0 8px rgba(0,255,65,0) }
        }
      `}</style>
    </div>
  )
}
