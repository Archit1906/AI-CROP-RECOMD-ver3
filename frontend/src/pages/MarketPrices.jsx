import { useTranslation } from 'react-i18next'
import VineBorder from '../components/VineBorder'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import api from '../api/axios'

const STATES = ["Tamil Nadu", "Maharashtra", "Punjab", "Karnataka", "Andhra Pradesh"]

const DISTRICTS = {
  "Tamil Nadu": ["All Districts", "Chennai", "Coimbatore", "Madurai", "Salem", "Trichy", "Vellore", "Tirunelveli"],
  "Maharashtra": ["All Districts", "Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad"],
  "Punjab": ["All Districts", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
}

export default function MarketPrices() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [state, setState] = useState("Tamil Nadu")
  const [district, setDistrict] = useState("All Districts")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [timeRange, setTimeRange] = useState("history_6m")
  const [error, setError] = useState(null)

  // Fetch prices when state/district changes
  useEffect(() => {
    fetchPrices()
  }, [state, district])

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/market-prices/${state}?district=${district}`)
      setData(res.data)
      // Auto-select first crop
      if (res.data.prices?.length > 0) {
        setSelectedCrop(res.data.prices[0])
      }
    } catch (err) {
      setError(t('mkt_nge.comm_err'))
    } finally {
      setLoading(false)
    }
  }

  // When user clicks a crop in the list, update chart
  const handleCropClick = (crop) => {
    setSelectedCrop(crop)
  }

  const chartData = selectedCrop?.[timeRange] || []

  const NgeTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: '#040F07', border: '1px solid #22C55E',
          borderRadius: 2, padding: '10px 14px', fontFamily: "'Share Tech Mono', monospace"
        }}>
          <p style={{ color: '#22C55E88', fontSize: 10, margin: '0 0 4px', letterSpacing: 2 }}>// T={label}</p>
          <p style={{ color: '#00FF41', fontWeight: 700, fontSize: 16, margin: 0, letterSpacing: 1 }}>
            ₹{payload[0]?.value?.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) return (
    <div className="hex-bg" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#020D05', color: '#22C55E', fontSize: 16, fontFamily: "'Share Tech Mono', monospace"
    }}>
      <div className="flicker" style={{ letterSpacing: 3 }}>{t('mkt_nge.conn')}</div>
    </div>
  )

  if (error) return (
    <div className="hex-bg" style={{ minHeight: '100vh', padding: 32, background: '#020D05' }}>
      <div style={{ padding: 20, background: '#1A0500', border: '1px solid #16A34A', borderRadius: 2, color: '#16A34A', fontFamily: "'Share Tech Mono', monospace" }}>
        {error}
      </div>
    </div>
  )

  return (
    <div className="hex-bg" style={{ padding: 24, background: '#020D05', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <p style={{ fontFamily: "'Share Tech Mono'", fontSize: 10, color: '#22C55E88', letterSpacing: 3, margin: '0 0 4px' }}>
            {t('mkt_nge.data_lbl')}
          </p>
          <h1 className="glitch-text" style={{ fontSize: 28, fontWeight: 900, color: '#22C55E', margin: 0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 3, textTransform: 'uppercase', textShadow: '0 0 20px #22C55E66' }}>
            {t('mkt_nge.title')}
          </h1>
          <p style={{ color: '#666680', fontSize: 11, margin: '4px 0 0', fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
            {t('mkt_nge.last_sync')} {data?.last_updated}
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={state} onChange={e => { setState(e.target.value); setDistrict("All Districts") }}
            style={{
              background: '#020D05', border: '1px solid #22C55E66', borderRadius: 2,
              color: '#E8E8E8', padding: '8px 12px', fontSize: 12, fontFamily: "'Share Tech Mono', monospace", outline: 'none', cursor: 'pointer'
            }}
            onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 10px #22C55E33'; }}
            onBlur={e => { e.target.style.borderColor = '#22C55E66'; e.target.style.boxShadow = 'none'; }}
          >
            {STATES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>

          <select value={district} onChange={e => setDistrict(e.target.value)}
            style={{
              background: '#020D05', border: '1px solid #22C55E66', borderRadius: 2,
              color: '#E8E8E8', padding: '8px 12px', fontSize: 12, fontFamily: "'Share Tech Mono', monospace", outline: 'none', cursor: 'pointer'
            }}
            onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 10px #22C55E33'; }}
            onBlur={e => { e.target.style.borderColor = '#22C55E66'; e.target.style.boxShadow = 'none'; }}
          >
            {(DISTRICTS[state] || ["All Districts"]).map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {/* Best Time to Sell Banner */}
      {data?.best_sell && (
        <div style={{
          background: 'linear-gradient(135deg, #0D2914, #040F07)',
          border: '1px solid #A3E635', borderLeft: '4px solid #A3E635', borderRadius: 2,
          padding: '16px 20px', marginBottom: 24, paddingLeft: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24, filter: 'sepia(1) hue-rotate(-50deg) saturate(3)' }}>⏰</span>
            <div>
              <p style={{ color: '#A3E635', fontWeight: 700, margin: 0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 2 }}>{t('mkt_nge.sell_rec')}</p>
              <p style={{ color: '#E8E8E8', fontSize: 12, margin: '4px 0 0', fontFamily: "'Share Tech Mono', monospace" }}>
                {data.best_sell_msg.toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/market/analytics')}
            className="nge-hover"
            style={{
              background: '#A3E63522', border: '1px solid #A3E635',
              borderRadius: 2, color: '#A3E635', fontWeight: 700,
              padding: '10px 16px', cursor: 'pointer', fontFamily: "'Exo 2', sans-serif", letterSpacing: 2, fontSize: 11, transition: 'all 0.2s'
            }}>
            {t('mkt_nge.view_anal')}
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* Crop List */}
        <div className="nge-card" data-label={t("mkt_nge.mandi_com")} style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '16px', background: '#040F07' }}>
            <p style={{ color: '#22C55E', fontWeight: 700, margin: 0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 2 }}>{t('mkt_nge.curr_price')}</p>
            <p style={{ color: '#666680', fontSize: 11, margin: '4px 0 0', fontFamily: "'Share Tech Mono', monospace" }}>
              {t('mkt_nge.sel_com')}
            </p>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 480 }}>
            {data?.prices?.map((crop, i) => (
              <div key={i} onClick={() => handleCropClick(crop)}
                className="nge-hover"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #22C55E22',
                  background: selectedCrop?.crop === crop.crop ? '#22C55E22' : 'transparent',
                  borderLeft: selectedCrop?.crop === crop.crop ? '4px solid #22C55E' : '4px solid transparent',
                  transition: 'all 0.15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                <div>
                  <p style={{ color: selectedCrop?.crop === crop.crop ? '#22C55E' : '#E8E8E8', fontWeight: 700, margin: 0, fontSize: 15, fontFamily: "'Exo 2', sans-serif", letterSpacing: 1, textTransform: 'uppercase' }}>
                    <span style={{ filter: 'grayscale(1) sepia(1)' }}>{crop.emoji}</span> {crop.crop}
                  </p>
                  <p style={{ color: '#666680', fontSize: 11, margin: '2px 0 0', fontFamily: "'Share Tech Mono', monospace" }}>
                    / {crop.unit.toUpperCase()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: selectedCrop?.crop === crop.crop ? '#22C55E' : '#E8E8E8', fontWeight: 700, margin: 0, fontSize: 16, fontFamily: "'Exo 2', sans-serif" }}>
                    ₹{crop.price.toLocaleString()}
                  </p>
                  <p style={{
                    margin: '4px 0 0', fontSize: 11, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1,
                    color: crop.change > 0 ? '#00FF41' : crop.change < 0 ? '#16A34A' : '#666680'
                  }}>
                    {crop.change > 0 ? '▲' : crop.change < 0 ? '▼' : '►'} {Math.abs(crop.change)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Panel */}
        <div className="nge-card" data-label={t("mkt_nge.vec_anal")} style={{ padding: 24 }}>

          {selectedCrop ? (
            <>
              {/* Chart Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 24, flexDirection: 'column', gap: 16
              }}>
                <div>
                  <p style={{ color: '#22C55E', fontWeight: 700, fontSize: 16, margin: 0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 2, textTransform: 'uppercase' }}>
                    {t('mkt_nge.price_vec')} {selectedCrop.crop}
                  </p>
                  <p style={{ color: '#86EFAC', fontSize: 12, margin: '6px 0 0', fontFamily: "'Share Tech Mono', monospace" }}>
                    ₹{selectedCrop.price.toLocaleString()} / {selectedCrop.unit.toUpperCase()} •
                    <span style={{
                      color: selectedCrop.change > 0 ? '#00FF41' : '#16A34A',
                      marginLeft: 6
                    }}>
                      {selectedCrop.change > 0 ? '▲' : '▼'} {Math.abs(selectedCrop.change)}% {t('mkt_nge.delta')}
                    </span>
                  </p>
                </div>

                {/* Time Range Buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { key: 'history_1m', label: '1M' },
                    { key: 'history_6m', label: '6M' },
                    { key: 'history_1y', label: '1Y' }
                  ].map(btn => (
                    <button key={btn.key} onClick={() => setTimeRange(btn.key)}
                      style={{
                        padding: '6px 16px', borderRadius: 2, fontSize: 11,
                        fontWeight: 700, cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace",
                        background: timeRange === btn.key ? '#22C55E' : '#040F07',
                        color: timeRange === btn.key ? '#020D05' : '#666680',
                        border: `1px solid ${timeRange === btn.key ? '#22C55E' : '#22C55E44'}`,
                        transition: 'all 0.15s'
                      }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Chart */}
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22C55E33" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#666680', fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}
                      axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#666680', fontSize: 10, fontFamily: "'Share Tech Mono', monospace" }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<NgeTooltip />} cursor={{ stroke: '#22C55E22', strokeWidth: 20 }} />
                    <Line type="monotone" dataKey="price" stroke="#00FF41"
                      strokeWidth={2} dot={{ fill: '#020D05', stroke: '#00FF41', r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#00FF41', stroke: '#040F07', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Prediction Banner */}
              <div style={{
                marginTop: 24, padding: '16px 20px',
                background: '#040F07', borderRadius: 2, border: '1px solid #86EFAC44', borderLeft: '4px solid #86EFAC',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <p style={{ color: '#86EFAC88', fontSize: 10, margin: 0, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2 }}>
                    {t('mkt_nge.proj_msg')}
                  </p>
                  <p style={{ color: '#86EFAC', fontWeight: 700, fontSize: 20, margin: '6px 0 0', fontFamily: "'Exo 2', sans-serif" }}>
                    ₹{Math.round(selectedCrop.price * 1.05).toLocaleString()}
                  </p>
                </div>
                <span style={{
                  background: selectedCrop.change > 3 ? '#00FF4122' : '#A3E63522',
                  color: selectedCrop.change > 3 ? '#00FF41' : '#A3E635', border: `1px solid ${selectedCrop.change > 3 ? '#00FF41' : '#A3E635'}`,
                  padding: '6px 14px', borderRadius: 2, fontSize: 10, fontWeight: 700, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1
                }}>
                  {selectedCrop.change > 3 ? t('mkt_nge.opt_sell') : t('mkt_nge.hold')}
                </span>
              </div>
            </>
          ) : (
            <div style={{
              height: 300, display: 'flex', alignItems: 'center', textAlign: 'center',
              justifyContent: 'center', color: '#22C55E88', fontFamily: "'Share Tech Mono', monospace", fontSize: 12, letterSpacing: 1
            }}>
              {t('mkt_nge.no_sel').split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
