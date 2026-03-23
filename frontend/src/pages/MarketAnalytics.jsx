import { useTranslation } from 'react-i18next'
import VineBorder from '../components/VineBorder'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, Cell
} from 'recharts'

const CROP_ANALYTICS = [
  { crop: "Rice (Samba)",  emoji:"🌾", current:2400, lastMonth:2100, lastYear:1900, predicted:2650, trend:"up",   volatility:"Low",    bestMonth:"October",   worstMonth:"March"  },
  { crop: "Tomato",        emoji:"🍅", current:800,  lastMonth:600,  lastYear:500,  predicted:950, trend:"up",   volatility:"High",   bestMonth:"December",  worstMonth:"July"   },
  { crop: "Cotton",        emoji:"🌱", current:6500, lastMonth:6200, lastYear:5800, predicted:6800,trend:"up",   volatility:"Medium", bestMonth:"November",  worstMonth:"May"    },
  { crop: "Onion",         emoji:"🧅", current:1200, lastMonth:1400, lastYear:1100, predicted:1050,trend:"down", volatility:"High",   bestMonth:"January",   worstMonth:"August" },
  { crop: "Banana",        emoji:"🍌", current:1800, lastMonth:1750, lastYear:1600, predicted:1900,trend:"up",   volatility:"Low",    bestMonth:"February",  worstMonth:"June"   },
  { crop: "Groundnut",     emoji:"🥜", current:5200, lastMonth:5100, lastYear:4800, predicted:5400,trend:"up",   volatility:"Medium", bestMonth:"December",  worstMonth:"April"  },
]

const MONTHLY_COMPARISON = [
  { month:"Jan", rice:2100, tomato:900,  cotton:6100, onion:1500 },
  { month:"Feb", rice:2150, tomato:850,  cotton:6200, onion:1400 },
  { month:"Mar", rice:2000, tomato:700,  cotton:6000, onion:1200 },
  { month:"Apr", rice:2050, tomato:600,  cotton:5900, onion:1100 },
  { month:"May", rice:2200, tomato:550,  cotton:5800, onion:1000 },
  { month:"Jun", rice:2300, tomato:500,  cotton:6000, onion:950  },
  { month:"Jul", rice:2250, tomato:450,  cotton:6100, onion:900  },
  { month:"Aug", rice:2100, tomato:500,  cotton:6200, onion:850  },
  { month:"Sep", rice:2200, tomato:600,  cotton:6300, onion:950  },
  { month:"Oct", rice:2350, tomato:700,  cotton:6400, onion:1100 },
  { month:"Nov", rice:2400, tomato:750,  cotton:6500, onion:1300 },
  { month:"Dec", rice:2400, tomato:800,  cotton:6500, onion:1200 },
]

const getColors = (t) => ["#00FF41", "#A3E635", t.primary, t.primary, t.tertiary, "#E8E8E8"]

export default function MarketAnalytics() {
  const { t } = useTranslation()
  const { currentTheme: themeVars } = useTheme()
  const navigate = useNavigate()
  const [selectedCrops, setSelectedCrops] = useState(["rice","tomato"])
  const COLORS = getColors(themeVars)

  const toggleCrop = (crop) => {
    const key = crop.toLowerCase().split(" ")[0]
    setSelectedCrops(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  const NgeTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ background:'var(--bg-deep)', border:'1px solid var(--primary)',
                    borderRadius:2, padding:'10px 14px', fontFamily: "'Share Tech Mono', monospace" }}>
        <p style={{ color:'var(--primary-dim)', fontSize:10, margin:'0 0 6px', letterSpacing: 2 }}>// T={label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color:p.color, fontWeight:700, fontSize:13, margin:'2px 0', textTransform: 'uppercase' }}>
            {p.name}: <span style={{ color: '#E8E8E8' }}>₹{p.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
    return null
  }

  return (
    <div className="hex-bg" style={{ padding:24, background:'var(--bg)', minHeight:'100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
        <button onClick={() => navigate('/market')}
          className="nge-hover"
          style={{ background:'var(--bg)', border:'1px solid var(--primary-dim)',
                   borderRadius:2, color:'var(--primary)', padding:'10px 14px',
                   cursor:'pointer', fontSize:12, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2 }}>
          {t('mkt_nge.go_back')}
        </button>
        <div>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:10, color:'var(--primary-dim)', letterSpacing:3, margin:'0 0 4px' }}>
            {t('mkt_nge.long_proj')}
          </p>
          <h1 className="glitch-text" style={{ fontSize:28, fontWeight:900, color:'var(--primary)', margin:0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 0 20px var(--primary-dim)' }}>
            {t('mkt_nge.adv_anal')}
          </h1>
          <p style={{ color:'#666680', fontSize:11, margin:'4px 0 0', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
            {t('mkt_nge.tn_mandi')}
          </p>
        </div>
      </div>

      {/* Crop Performance Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16, marginBottom:28 }}>
        {CROP_ANALYTICS.map((crop, i) => {
          const changePercent = (((crop.current - crop.lastMonth) / crop.lastMonth) * 100).toFixed(1)
          const isUp = crop.trend === "up"
          return (
            <div key={i} className="nge-card" data-label={`// ${crop.crop.toUpperCase()}`}
              style={{
                borderLeft: `4px solid ${isUp ? '#00FF41' : 'var(--primary)'}`,
                padding: '20px', background: 'var(--bg-deep)'
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ color:'var(--primary)', fontSize:13, margin:'0 0 4px',
                               textTransform:'uppercase', letterSpacing:2, fontFamily: "'Exo 2', sans-serif", fontWeight: 700 }}>
                    <span style={{filter: 'grayscale(1) sepia(1)'}}>{crop.emoji}</span> {crop.crop}
                  </p>
                  <p style={{ color:'#E8E8E8', fontWeight:700, fontSize:22, margin:0, fontFamily: "'Exo 2', sans-serif" }}>
                    ₹{crop.current.toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ color: isUp ? '#00FF41' : 'var(--primary)',
                               fontWeight:700, fontSize:16, margin:'0 0 4px', fontFamily: "'Exo 2', sans-serif" }}>
                    {isUp ? '▲' : '▼'} {Math.abs(changePercent)}%
                  </p>
                  <span style={{ fontSize:9, padding:'3px 8px', borderRadius:2, border: '1px solid',
                                 background: crop.volatility==='High' ? '#1A0500' :
                                             crop.volatility==='Medium' ? '#1A1A00' : '#0A1A0A',
                                 color: crop.volatility==='High' ? 'var(--primary)' :
                                        crop.volatility==='Medium' ? '#A3E635' : '#00FF41',
                                 borderColor: crop.volatility==='High' ? 'var(--primary)' :
                                        crop.volatility==='Medium' ? '#A3E635' : '#00FF41',
                                 fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, textTransform: 'uppercase' }}>
                    {crop.volatility} {t('mkt_nge.volat')}
                  </span>
                </div>
              </div>
              <div style={{ marginTop:20, paddingTop: 16, borderTop: '1px solid var(--primary-dim)', display:'flex', justifyContent:'space-between' }}>
                <div>
                  <p style={{ color:'#666680', fontSize:10, margin:'0 0 4px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>{t('mkt_nge.pred_30d')}</p>
                  <p style={{ color:'var(--tertiary)', fontWeight:700, fontSize:15, margin:0, fontFamily: "'Share Tech Mono', monospace" }}>
                    ₹{crop.predicted.toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ color:'#666680', fontSize:10, margin:'0 0 4px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>{t('mkt_nge.opt_month')}</p>
                  <p style={{ color:'#00FF41', fontWeight:700, fontSize:15, margin:0, fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase' }}>
                    {crop.bestMonth}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Crop Toggle Filter */}
      <div className="nge-card" data-label={t("mkt_nge.sel_mat")} style={{ padding:'20px 24px', marginBottom:24 }}>
        <p style={{ color:'var(--primary-dim)', fontSize:11, margin:'0 0 12px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
          {t('mkt_nge.sel_cross')}
        </p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {CROP_ANALYTICS.map((crop, i) => {
            const key = crop.crop.toLowerCase().split(" ")[0]
            const active = selectedCrops.includes(key)
            return (
              <button key={i} onClick={() => toggleCrop(crop.crop)}
                style={{ padding:'8px 16px', borderRadius:2, fontSize:11, fontWeight: 700,
                         cursor:'pointer', border:`1px solid ${active ? COLORS[i] : 'var(--primary-dim)'}`,
                         background: active ? `${COLORS[i]}11` : 'var(--bg)',
                         color: active ? COLORS[i] : '#666680',
                         transition:'all 0.15s', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, textTransform: 'uppercase',
                         boxShadow: active ? `0 0 10px ${COLORS[i]}44` : 'none' }}>
                {crop.crop}
              </button>
            )
          })}
        </div>
      </div>

      {/* Monthly Comparison Chart */}
      <div className="nge-card" data-label={t("mkt_nge.month_comp")} style={{ padding:24, marginBottom:24 }}>
        <p style={{ color:'var(--primary)', fontWeight:700, fontSize:16, margin:'0 0 4px', fontFamily: "'Exo 2', sans-serif", letterSpacing: 3 }}>
          {t('mkt_nge.hist_overlay')}
        </p>
        <p style={{ color:'#666680', fontSize:11, margin:'0 0 20px', fontFamily: "'Share Tech Mono', monospace" }}>
          {t('mkt_nge.tog_met')}
        </p>
        <div style={{ height:320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MONTHLY_COMPARISON}>
              <CartesianGrid strokeDasharray="3 3" stroke={themeVars.primaryDim} vertical={false} />
              <XAxis dataKey="month" tick={{ fill:'#666680', fontSize:10, fontFamily: "'Share Tech Mono', monospace" }}
                     axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#666680', fontSize:10, fontFamily: "'Share Tech Mono', monospace" }}
                     axisLine={false} tickLine={false}
                     tickFormatter={v => `₹${v}`} />
              <Tooltip content={<NgeTooltip />} cursor={{ stroke: themeVars.primaryGlow, strokeWidth: 20 }} />
              <Legend wrapperStyle={{ color:'#E8E8E8', fontSize:11, fontFamily: "'Share Tech Mono', monospace", paddingTop: 10 }} />
              {selectedCrops.includes("rice") &&
                <Line type="monotone" dataKey="rice" stroke={COLORS[0]}
                      strokeWidth={2} dot={false} name="RICE" />}
              {selectedCrops.includes("tomato") &&
                <Line type="monotone" dataKey="tomato" stroke={COLORS[1]}
                      strokeWidth={2} dot={false} name="TOMATO" />}
              {selectedCrops.includes("cotton") &&
                <Line type="monotone" dataKey="cotton" stroke={COLORS[2]}
                      strokeWidth={2} dot={false} name="COTTON" />}
              {selectedCrops.includes("onion") &&
                <Line type="monotone" dataKey="onion" stroke={COLORS[3]}
                      strokeWidth={2} dot={false} name="ONION" />}
              {selectedCrops.includes("banana") &&
                <Line type="monotone" dataKey="banana" stroke={COLORS[4]}
                      strokeWidth={2} dot={false} name="BANANA" />}
              {selectedCrops.includes("groundnut") &&
                <Line type="monotone" dataKey="groundnut" stroke={COLORS[5]}
                      strokeWidth={2} dot={false} name="GROUNDNUT" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Best Time to Sell Table */}
      <div className="nge-card" data-label={t("mkt_nge.temp_anal")} style={{ padding:24 }}>
        <p style={{ color:'var(--primary)', fontWeight:700, fontSize:16, margin:'0 0 20px', fontFamily: "'Exo 2', sans-serif", letterSpacing: 2 }}>
          {t('mkt_nge.sell_cyc')}
        </p>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--primary-dim)', background: 'var(--primary-glow)' }}>
                {[t('mkt_nge.h_com'), t('mkt_nge.h_curr'), t('mkt_nge.h_last'), t('mkt_nge.h_delta'), t('mkt_nge.h_opt'), t('mkt_nge.h_proj')].map(h => (
                  <th key={h} style={{ color:'var(--primary)', fontSize:10, fontWeight:700,
                                       textAlign:'left', padding:'12px 14px',
                                       textTransform:'uppercase', letterSpacing:2, fontFamily: "'Share Tech Mono', monospace" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CROP_ANALYTICS.map((crop, i) => {
                const change = (((crop.current-crop.lastMonth)/crop.lastMonth)*100).toFixed(1)
                const isUp = parseFloat(change) > 0
                return (
                  <tr key={i} style={{ borderBottom:'1px solid var(--primary-glow)', transition: 'all 0.15s' }} className="hover:bg-[var(--primary-glow)]">
                    <td style={{ padding:'16px 14px', color:'#E8E8E8', fontWeight:700, fontFamily: "'Exo 2', sans-serif", fontSize: 13, textTransform: 'uppercase' }}>
                      {crop.crop}
                    </td>
                    <td style={{ padding:'16px 14px', color:'#E8E8E8', fontFamily: "'Share Tech Mono', monospace", fontSize: 13 }}>
                      ₹{crop.current.toLocaleString()}
                    </td>
                    <td style={{ padding:'16px 14px', color:'#666680', fontFamily: "'Share Tech Mono', monospace", fontSize: 13 }}>
                      ₹{crop.lastMonth.toLocaleString()}
                    </td>
                    <td style={{ padding:'16px 14px', fontFamily: "'Share Tech Mono', monospace", fontSize: 13,
                                 color: isUp ? '#00FF41' : 'var(--primary)', fontWeight:700 }}>
                      {isUp ? '▲' : '▼'} {Math.abs(change)}%
                    </td>
                    <td style={{ padding:'16px 14px' }}>
                      <span style={{ background:'#0A1A0A', color:'#00FF41', border: '1px solid #00FF41', letterSpacing: 1,
                                     padding:'4px 10px', borderRadius:2, fontSize:10, fontFamily: "'Share Tech Mono', monospace", textTransform: 'uppercase' }}>
                        {crop.bestMonth}
                      </span>
                    </td>
                    <td style={{ padding:'16px 14px', color:'var(--tertiary)', fontWeight:700, fontFamily: "'Share Tech Mono', monospace", fontSize: 13 }}>
                      ₹{crop.predicted.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
