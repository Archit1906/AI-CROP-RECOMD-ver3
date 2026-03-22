import { useTranslation } from 'react-i18next'
import VineBorder from '../components/VineBorder'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid,
         Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../api/axios'
import { useTheme } from '../contexts/ThemeContext'

const WEATHER_ICONS = {
  "01d":"☀️","01n":"🌙","02d":"⛅","02n":"⛅",
  "03d":"☁️","03n":"☁️","04d":"☁️","04n":"☁️",
  "09d":"🌧️","09n":"🌧️","10d":"🌦️","10n":"🌧️",
  "11d":"⛈️","11n":"⛈️","13d":"❄️","13n":"❄️","50d":"🌫️"
}

const TN_CITIES = [
  "Chennai","Coimbatore","Madurai","Salem","Trichy",
  "Tirunelveli","Vellore","Erode","Thanjavur","Dindigul"
]

export default function WeatherPage() {
  const { t } = useTranslation()
  const { currentTheme: themeVars } = useTheme()
  const [city, setCity] = useState("Chennai")
  const [searchInput, setSearchInput] = useState("Chennai")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchWeather(city)
  }, [city])

  const fetchWeather = async (cityName) => {
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await api.get(`/api/weather/${cityName}`)
      setData(res.data)
    } catch {
      setError(t('wea_nge.sys_fail').replace('FAILED.', `"${cityName}" FAILED.`))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = searchInput.trim()
    if (trimmed && trimmed !== city) {
      setCity(trimmed)
    }
  }

  const handleCityChip = (selectedCity) => {
    setSearchInput(selectedCity)
    setCity(selectedCity)
  }

  const alertColors = {
    danger:  { bg: "#1A0500", border: "var(--primary)", text: "var(--primary)" },
    warning: { bg: "#1A1A00", border: "#A3E635", text: "#A3E635" },
    info:    { bg: 'var(--bg-deep)', border: 'var(--tertiary)', text: 'var(--tertiary)' },
    success: { bg: "#0A1A0A", border: "#00FF41", text: "#00FF41" },
  }

  const NgeTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--primary)',
                    borderRadius: 2, padding: '10px 14px', fontFamily: "'Share Tech Mono', monospace" }}>
        <p style={{ color: 'var(--primary-dim)', fontSize: 9, margin: '0 0 4px', letterSpacing: 2 }}>{t('wea_nge.dp')}</p>
        <p style={{ color: 'var(--primary)', fontSize: 12, margin: '0 0 4px' }}>{label}</p>
        <p style={{ color: 'var(--tertiary)', fontWeight: 700, margin: 0, fontSize: 13 }}>
          {t('wea_nge.rain_mm')} {payload[0].value} mm
        </p>
      </div>
    )
    return null
  }

  if (loading) return (
    <div className="hex-bg" style={{ padding: 24, background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', margin: '0 0 8px', fontFamily: "'Exo 2', sans-serif", letterSpacing: 4, textTransform: 'uppercase' }} className="glitch-text">
        {t('wea_nge.title')}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flex: 1, flexDirection: 'column', gap: 12 }}>
        <div className="flicker" style={{ color: 'var(--primary)', fontSize: 14, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 3 }}>
          {t('wea_nge.scan_tgt')} {city.toUpperCase()} ...
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="hex-bg" style={{ padding: 24, background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ margin:32, padding:20, background:'#1A0500',
                    border:'1px solid var(--primary)', borderRadius:2, color:'var(--primary)', fontFamily: "'Share Tech Mono', monospace" }}>
        {error}
      </div>
    </div>
  )

  const c = data?.current
  const sowing = data?.sowing

  return (
    <div className="hex-bg" style={{ padding:24, background:'var(--bg)', minHeight:'100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Header + Search */}
      <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:'var(--primary-dim)',
                      letterSpacing:3, margin:'0 0 4px' }}>
            {t('wea_nge.sys_sens')}
          </p>
          <h1 style={{ fontSize:28, fontWeight:900, color:'var(--primary)', margin:0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 0 20px var(--primary-dim)' }} className="glitch-text">
            {t('wea_nge.title')}
          </h1>
          <p style={{ color:'#666680', fontSize:11, margin:'4px 0 0', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
            {t('wea_nge.last_intel')} {data?.last_updated}
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder={t("wea_nge.scan_reg")}
            style={{ background:'var(--bg)', border:'1px solid var(--primary-dim)', borderRadius:2,
                     color:'#E8E8E8', padding:'10px 14px', fontSize:14, width:220,
                     outline:'none', fontFamily: "'Share Tech Mono', monospace" }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 10px var(--primary-dim)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--primary-dim)'; e.target.style.boxShadow = 'none'; }}
          />
          <button type="submit"
            style={{ background:'var(--primary-glow)', border:'1px solid var(--primary)', borderRadius:2,
                     color:'var(--primary)', fontWeight:700, padding:'10px 20px', cursor:'pointer', fontFamily: "'Exo 2', sans-serif", letterSpacing: 3, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = 'var(--primary-dim)'; e.target.style.boxShadow = '0 0 20px var(--primary-dim)'; }}
            onMouseLeave={e => { e.target.style.background = 'var(--primary-glow)'; e.target.style.boxShadow = 'none'; }}
          >
            {t('wea_nge.target')}
          </button>
        </form>
      </div>

      {/* Quick city chips */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
        {TN_CITIES.map(c_name => (
          <button key={c_name} onClick={() => handleCityChip(c_name)}
            style={{ padding:'6px 14px', borderRadius:2, fontSize:11,
                     cursor:'pointer', border:'1px solid',
                     borderColor: city===c_name ? 'var(--primary)' : 'var(--primary-dim)',
                     background: city===c_name ? 'var(--primary-glow)' : 'var(--bg-deep)',
                     color: city===c_name ? 'var(--primary)' : '#666680',
                     transition:'all 0.15s', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase' }}
            onMouseEnter={e => { if(city!==c_name) { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--primary-glow)' } }}
            onMouseLeave={e => { if(city!==c_name) { e.target.style.borderColor = 'var(--primary-dim)'; e.target.style.background = 'var(--bg-deep)' } }}
          >
            {c_name}
          </button>
        ))}
      </div>

      {/* Current Weather Hero Card */}
      <div className="nge-card" data-label={t("wea_nge.tac_brief")} style={{ padding:28, marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>

          {/* Left: Main temp */}
          <div>
            <p style={{ color:'var(--primary)', fontSize:14, margin:'0 0 4px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2 }}>
              {t('wea_nge.loc')} {data?.city.toUpperCase()}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginTop: 10 }}>
              <span style={{ fontSize:72, filter: 'sepia(1) hue-rotate(-50deg) saturate(3)' }}>{WEATHER_ICONS[c?.icon] || '🌤️'}</span>
              <div>
                <p style={{ fontSize:72, fontWeight:900, color:'var(--primary)', margin:0, lineHeight:1, fontFamily: "'Exo 2', sans-serif", textShadow: '0 0 20px var(--primary-dim)' }}>
                  {c?.temp}°
                </p>
                <p style={{ color:'var(--tertiary)', fontSize:13, margin:'6px 0 0', fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase', letterSpacing: 1 }}>
                  {c?.description} {t('wea_nge.feels_like')} {c?.feels_like}°C
                </p>
              </div>
            </div>
          </div>

          {/* Right: Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { icon:'💧', label:t('wea_nge.hum'),    value:`${c?.humidity}%` },
              { icon:'💨', label:t('wea_nge.wind'),    value:`${c?.wind_kmh} KM/H` },
              { icon:'📊', label:t('wea_nge.press'),    value:`${c?.pressure} HPA` },
              { icon:'👁️', label:t('wea_nge.vis'),  value:`${c?.visibility} KM` },
            ].map(stat => (
              <div key={stat.label}
                style={{ background:'var(--bg)', borderRadius:2,
                         padding:'12px 14px', border:'1px solid var(--primary-dim)' }}>
                <p style={{ color:'var(--primary-dim)', fontSize:11, margin:'0 0 4px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
                  {stat.icon} {stat.label}
                </p>
                <p style={{ color:'var(--primary)', fontWeight:700, fontSize:18, margin:0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 1 }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Humidity + Wind visual gauges */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:24 }}>
          {[
            { label:t('wea_nge.atm_mst'), value:c?.humidity, max:100, color:'var(--tertiary)', unit:'%' },
            { label:t('wea_nge.wind_vel'), value:c?.wind_kmh, max:100, color:'var(--primary)', unit:' KM/H' },
          ].map(gauge => (
            <div key={gauge.label}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ color:'#666680', fontSize:11, fontFamily: "'Share Tech Mono', monospace" }}>// {gauge.label}</span>
                <span style={{ color:gauge.color, fontSize:12, fontWeight:600, fontFamily: "'Share Tech Mono', monospace" }}>
                  {gauge.value}{gauge.unit}
                </span>
              </div>
              <div style={{ height:4, background:'var(--bg)', borderRadius:0, overflow:'hidden', border: '1px solid var(--primary-dim)' }}>
                <div style={{ height:'100%', width:`${(gauge.value/gauge.max)*100}%`,
                              background:gauge.color,
                              transition:'width 1s ease', boxShadow: `0 0 10px ${gauge.color}88` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="nge-card" data-label={t("wea_nge.long_proj")} style={{ padding:20, marginBottom:20 }}>
        <p style={{ color:'var(--primary)', fontWeight:700, fontSize:16, margin:'0 0 16px', fontFamily: "'Exo 2', sans-serif", letterSpacing: 3 }}>
          {t('wea_nge.proj_title')}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:8 }}>
          {data?.forecast?.map((day, i) => (
            <div key={i} style={{ background:'var(--bg)', borderRadius:2,
                                   padding:'12px 8px', textAlign:'center',
                                   border:'1px solid var(--primary-dim)', transition: 'all 0.2s' }}
                 className="nge-hover">
              <p style={{ color:'var(--primary-dim)', fontSize:11, margin:'0 0 8px', fontFamily: "'Share Tech Mono', monospace" }}>{t('wea_nge.day')}{i+1}</p>
              <p style={{ color:'var(--tertiary)', fontSize:12, margin:'0 0 8px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>{day.day.toUpperCase()}</p>
              <span style={{ fontSize:28, filter: 'sepia(1) hue-rotate(-50deg) saturate(3)' }}>{WEATHER_ICONS[day.icon] || '🌤️'}</span>
              <p style={{ color:'var(--primary)', fontWeight:700, fontSize:18, margin:'8px 0 2px', fontFamily: "'Exo 2', sans-serif" }}>
                {day.high}°
              </p>
              <p style={{ color:'#666680', fontSize:12, margin:'0 0 8px', fontFamily: "'Share Tech Mono', monospace" }}>{day.low}°</p>
              <div style={{ background: day.rain_chance > 50 ? 'var(--tertiary)22' : 'var(--bg)',
                            borderRadius:2, padding:'3px 0', border: `1px solid ${day.rain_chance > 50 ? 'var(--tertiary)' : 'var(--primary-dim)'}` }}>
                <p style={{ color: day.rain_chance > 50 ? 'var(--tertiary)' : '#666680',
                             fontSize:10, margin:0, fontFamily: "'Share Tech Mono', monospace" }}>
                  💧{day.rain_chance}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Alerts + Sowing + Rainfall Chart */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Farming Alerts */}
        <div className="nge-card" data-label={t("wea_nge.notif")} style={{ padding:20 }}>
          <p style={{ color:'var(--primary)', fontWeight:700, fontSize:16, margin:'0 0 14px', fontFamily: "'Exo 2', sans-serif", letterSpacing: 3 }}>
            {t('wea_nge.sys_alerts')}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {data?.alerts?.map((alert, i) => {
              const colors = alertColors[alert.type] || alertColors.info
              return (
                <div key={i} style={{ background:colors.bg, border:`1px solid ${colors.border}`,
                                       borderRadius:2, padding:'12px 14px',
                                       borderLeft:`4px solid ${colors.border}` }}>
                  <p style={{ color:colors.text, fontWeight:700, fontSize:13, margin:'0 0 3px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
                    {alert.icon} {alert.title.toUpperCase()}
                  </p>
                  <p style={{ color:'#E8E8E8', fontSize:11, margin:0, fontFamily: "'Share Tech Mono', monospace" }}>{alert.msg}</p>
                </div>
              )
            })}
            {(!data?.alerts || data.alerts.length === 0) && (
              <div style={{ background:'#0A1A0A', border:'1px solid #00FF41',
                            borderRadius:2, padding:'12px 14px', borderLeft: '4px solid #00FF41' }}>
                <p style={{ color:'#00FF41', fontWeight:700, margin:'0 0 3px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
                  {t('wea_nge.all_clear')}
                </p>
                <p style={{ color:'#E8E8E8', fontSize:11, margin:0, fontFamily: "'Share Tech Mono', monospace" }}>
                  {t('wea_nge.no_threats')}
                </p>
              </div>
            )}
          </div>

          {/* Sowing Recommendation */}
          <div style={{ marginTop:24, background:'var(--bg)', borderRadius:2,
                        padding:'14px 16px', border:`1px solid ${sowing?.color==='var(--primary)'? '#00FF41' : '#A3E635'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ color:'#E8E8E8', fontWeight:700, margin:'0 0 4px', fontFamily: "'Share Tech Mono', monospace", fontSize: 13, letterSpacing: 1 }}>
                {t('wea_nge.sow_cond')}
              </p>
              <span style={{ background:`${sowing?.color==='var(--primary)'? '#00FF41' : '#A3E635'}22`, color:sowing?.color==='var(--primary)'? '#00FF41' : '#A3E635',
                             padding:'3px 12px', borderRadius:2, border: `1px solid ${sowing?.color==='var(--primary)'? '#00FF41' : '#A3E635'}`,
                             fontSize:10, fontWeight:700, fontFamily: "'Exo 2', sans-serif", letterSpacing: 2 }}>
                {sowing?.label?.toUpperCase() || 'OPTIMAL'}
              </span>
            </div>
            <p style={{ color:'#9CA3AF', fontSize:11, margin:'8px 0 10px', fontFamily: "'Share Tech Mono', monospace" }}>
              {sowing?.message?.toUpperCase() || 'PROCEED WITH CAUTION'}
            </p>
            {sowing?.crops?.length > 0 && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {sowing.crops.map(crop => (
                  <span key={crop} style={{ background:'var(--bg-elevated)', color:'var(--primary)',
                                            padding:'3px 10px', borderRadius:2,
                                            fontSize:10, border:'1px solid var(--primary-dim)', fontFamily: "'Share Tech Mono', monospace" }}>
                    {crop.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Rainfall Chart */}
        <div className="nge-card" data-label={t("wea_nge.clim_hist")} style={{ padding:20 }}>
          <p style={{ color:'var(--primary)', fontWeight:700, fontSize:16, margin:'0 0 4px', fontFamily: "'Exo 2', sans-serif", letterSpacing: 3 }}>
            {t('wea_nge.mon_rain')}
          </p>
          <p style={{ color:'#666680', fontSize:11, margin:'0 0 16px', fontFamily: "'Share Tech Mono', monospace" }}>
            {t('wea_nge.hist_avg')} {data?.city.toUpperCase()}
          </p>
          <div style={{ height:280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly_rainfall}>
                <CartesianGrid strokeDasharray="3 3" stroke={themeVars.primaryDim} vertical={false} />
                <XAxis dataKey="month" tick={{ fill:'#666680', fontSize:10, fontFamily: "'Share Tech Mono', monospace" }}
                       axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#666680', fontSize:10, fontFamily: "'Share Tech Mono', monospace" }}
                       axisLine={false} tickLine={false}
                       tickFormatter={v => `${v}mm`} />
                <Tooltip content={<NgeTooltip />} cursor={{fill: themeVars.primaryGlow}} />
                <Bar dataKey="rainfall" radius={[2,2,0,0]} barSize={24}>
                  {data?.monthly_rainfall?.map((entry, i) => (
                    <Cell key={i} fill={themeVars.primary} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ color:'var(--primary-dim)', fontSize:10, textAlign:'center', margin:'12px 0 0', fontFamily: "'Share Tech Mono', monospace" }}>
            {t('wea_nge.peak_precip')}
          </p>
        </div>

      </div>
    </div>
  )
}
