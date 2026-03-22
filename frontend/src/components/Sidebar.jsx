import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const Sidebar = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, currentTheme } = useTheme();

  const navItems = [
    { path: '/', icon: '🌿', label: t('nav.dashboard') },
    { path: '/crop', icon: '🌾', label: t('nav.crop') },
    { path: '/disease', icon: '🔬', label: t('nav.disease') },
    { path: '/weather', icon: '🌤️', label: t('nav.weather') },
    { path: '/market', icon: '📊', label: t('nav.market') },
    { path: '/chat', icon: '🤖', label: t('nav.chatbot') },
    { path: '/schemes', icon: '🏛️', label: t('nav.schemes') },
  ];

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'rgba(4, 15, 7, 0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '0 0 24px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Hex background replaced with eco-cellular pattern */}
      <div className="eco-cellular-bg" style={{ position:'absolute', inset:0, opacity:0.1, pointerEvents:'none' }} />

      {/* Eco Theme Header */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{
          padding: '24px 16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(180deg, rgba(7, 26, 12, 0.8) 0%, transparent 100%)'
        }}>
          {/* Eco-style logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
              borderRadius: '8px 24px 8px 24px', // Leaf shape
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px var(--text-muted)'
            }}>
              <span style={{ fontSize:18 }}>🌿</span>
            </div>
            <div>
              <p style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: 15, fontWeight: 900,
                color: 'var(--secondary)', margin: 0,
                letterSpacing: 2,
                textShadow: '0 0 10px rgba(74,222,128,0.5)'
              }}>
                AMRITKRISHI
              </p>
              <p style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 8, color: '#A7F3D0', margin: 0, letterSpacing: 1.5,
                opacity: 0.7
              }}>
                ECO INTELLIGENCE SYSTEM
              </p>
            </div>
          </div>

          {/* System status bar */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '6px 10px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'inset 0 0 10px rgba(34,197,94,0.05)'
          }}>
            <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9,
                           color:'var(--secondary)', letterSpacing:1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display:'block', width:6, height:6, borderRadius:'50%', background:'var(--secondary)', animation:'pulseEco 2s infinite' }} />
              BIOME ONLINE
            </span>
            <span style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'#6EE7B7', opacity:0.6 }}>
              v2.0.0
            </span>
          </div>
        </div>

        {/* Nav section label */}
        <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'rgba(74,222,128,0.7)',
                    letterSpacing:3, padding:'16px 16px 8px', margin:0 }}>
          // ROOT NETWORK
        </p>

        {/* Nav items */}
        <nav style={{ padding:'0 10px' }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', marginBottom: 4,
                borderRadius: 6, textDecoration: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13, fontWeight: 600, letterSpacing: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive ? 'linear-gradient(90deg, rgba(34,197,94,0.15) 0%, transparent 100%)' : 'transparent',
                color: isActive ? 'var(--secondary)' : '#A7F3D0',
                borderLeft: isActive ? '3px solid var(--secondary)' : '3px solid transparent',
              })}>
              {({ isActive }) => (
                <>
                  <span style={{ fontSize: 16, filter: isActive ? 'drop-shadow(0 0 8px rgba(74,222,128,0.6))' : 'grayscale(0.5) opacity(0.7)' }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {/* Active indicator */}
                  {isActive && (
                    <span style={{ marginLeft:'auto', fontFamily:"'Share Tech Mono'",
                                   fontSize:10, color:'var(--secondary)', animation: 'pulseEco 1.5s infinite' }}>
                      ●
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div style={{ padding:'0 16px', position: 'relative', zIndex: 10 }}>
        {/* Divider */}
        <div style={{ borderTop:'1px solid var(--border)', marginBottom:16 }} />

        {/* ── THEME TOGGLE ──────────────────────── */}
        <div style={{
          padding:      '12px',
          borderTop:    '1px solid var(--border)',
          marginTop:    'auto'
        }}>
          <p style={{
            fontFamily:  "'Share Tech Mono'",
            fontSize:    8, letterSpacing: 3,
            color:       'var(--text-muted)',
            margin:      '0 0 8px'
          }}>
            // ENVIRONMENT
          </p>

          <div style={{ display:'flex', gap:6 }}>
            {/* SUNLIGHT button */}
            <button
              onClick={() => toggleTheme('sunlight')}
              style={{
                flex:        1, padding: '8px 4px',
                background:  theme === 'sunlight'
                  ? 'rgba(245,158,11,0.2)' : 'transparent',
                border:      `1px solid ${theme === 'sunlight'
                  ? '#F59E0B' : 'rgba(245,158,11,0.2)'}`,
                borderRadius:6, cursor: 'pointer',
                transition:  'all 0.2s',
                display:     'flex', alignItems: 'center',
                justifyContent: 'center', gap: 4
              }}>
              <span style={{ fontSize: 12 }}>☀️</span>
              <span style={{
                fontFamily:  "'Share Tech Mono'",
                fontSize:    8, letterSpacing: 1,
                color:       theme === 'sunlight'
                  ? '#F59E0B' : 'rgba(245,158,11,0.4)'
              }}>
                SUNLIGHT
              </span>
            </button>

            {/* MOONLIGHT button */}
            <button
              onClick={() => toggleTheme('moonlight')}
              style={{
                flex:        1, padding: '8px 4px',
                background:  theme === 'moonlight'
                  ? 'rgba(59,130,246,0.2)' : 'transparent',
                border:      `1px solid ${theme === 'moonlight'
                  ? '#3B82F6' : 'rgba(59,130,246,0.2)'}`,
                borderRadius:6, cursor: 'pointer',
                transition:  'all 0.2s',
                display:     'flex', alignItems: 'center',
                justifyContent: 'center', gap: 4
              }}>
              <span style={{ fontSize: 12 }}>🌙</span>
              <span style={{
                fontFamily:  "'Share Tech Mono'",
                fontSize:    8, letterSpacing: 1,
                color:       theme === 'moonlight'
                  ? '#3B82F6' : 'rgba(59,130,246,0.4)'
              }}>
                MOONLIGHT
              </span>
            </button>
          </div>

          {/* Active theme indicator */}
          <p style={{
            fontFamily:  "'Share Tech Mono'",
            fontSize:    7, letterSpacing: 2,
            color:       'var(--text-muted)',
            textAlign:   'center',
            margin:      '6px 0 0'
          }}>
            ● {theme.toUpperCase()} ACTIVE
          </p>
        </div>

        {/* Language selector */}
        <div style={{ background:'rgba(7,26,12,0.6)', border:'1px solid var(--border)',
                      borderRadius:4, padding:'10px 12px' }}>
          <p style={{ fontFamily:"'Share Tech Mono'", fontSize:9, color:'rgba(74,222,128,0.7)',
                      margin:'0 0 10px', letterSpacing:2 }}>
            // TONGUE PROTOCOL
          </p>
          <div style={{ display:'flex', gap:6 }}>
            {[
              { code:'en', label:'ENG' },
              { code:'ta', label:'தமிழ்' },
              { code:'hi', label:'हिंदी' }
            ].map(lang => (
              <button key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); localStorage.setItem('lang', lang.code) }}
                style={{
                  flex:1, padding:'6px 2px', border:'1px solid',
                  borderColor: i18n.language===lang.code ? 'var(--primary)' : 'var(--border)',
                  background: i18n.language===lang.code ? 'rgba(34,197,94,0.15)' : 'transparent',
                  color: i18n.language===lang.code ? 'var(--secondary)' : '#6EE7B7',
                  fontFamily:"'Inter', sans-serif", fontSize:11, fontWeight: i18n.language===lang.code ? 600 : 400,
                  cursor:'pointer', borderRadius:3,
                  transition:'all 0.2s'
                }}>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Replay Intro button */}
        <button
          onClick={() => {
            sessionStorage.removeItem('intro_shown')
            window.location.reload()
          }}
          style={{
            width:'100%', padding:'8px',
            background:'transparent',
            border:'1px dashed var(--border-hover)',
            color:'rgba(74,222,128,0.6)', fontFamily:"'Share Tech Mono'",
            fontSize:9, letterSpacing:2, cursor:'pointer',
            borderRadius:4, marginTop:12, transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(34,197,94,0.6)'; e.currentTarget.style.color='var(--secondary)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-hover)'; e.currentTarget.style.color='rgba(74,222,128,0.6)' }}
        >
          // REPLAY GERMINATION
        </button>

        {/* Eco footer stamp */}
        <p style={{ fontFamily:"'Share Tech Mono'", fontSize:8, color:'var(--primary-dim)',
                    textAlign:'center', margin:'16px 0 0', letterSpacing:3 }}>
          AMRITKRISHI BIOME // ACTIVE
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
