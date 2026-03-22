import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = {
  moonlight: {
    name:        'moonlight',
    label:       'MOONLIGHT',
    icon:        '🌙',

    // Backgrounds
    bg:          '#010B14',
    bgDeep:      '#000A12',
    bgCard:      '#071828',
    bgElevated:  '#0C2236',
    bgHover:     '#102840',

    // Borders
    border:      '#1A3A5C',
    borderHover: '#2A5A8C',
    borderAccent:'#3B82F6',

    // Primary accent — blue
    primary:     '#3B82F6',
    primaryDim:  'rgba(59,130,246,0.4)',
    primaryGlow: 'rgba(59,130,246,0.2)',

    // Secondary
    secondary:   '#60A5FA',
    tertiary:    '#93C5FD',

    // Text
    textPrimary: '#E0F2FE',
    textSecond:  'rgba(147,197,253,0.7)',
    textMuted:   'rgba(59,130,246,0.4)',

    // Success/danger stay same
    success:     '#22C55E',
    danger:      '#EF4444',
    warning:     '#FBBF24',

    // Special
    logoGrad:    'linear-gradient(135deg,#60A5FA,#3B82F6,#93C5FD)',
    btnBg:       'linear-gradient(135deg,#1D4ED8,#3B82F6)',
    scanline:    'rgba(59,130,246,0.06)',
    hexPattern:  'rgba(59,130,246,0.05)',
  },

  sunlight: {
    name:        'sunlight',
    label:       'SUNLIGHT',
    icon:        '☀️',

    // Backgrounds — warm cream/parchment
    bg:          '#1A0F00',
    bgDeep:      '#120A00',
    bgCard:      '#2A1800',
    bgElevated:  '#3A2200',
    bgHover:     '#4A2C00',

    // Borders — amber/gold
    border:      '#5C3A00',
    borderHover: '#8C5A00',
    borderAccent:'#F59E0B',

    // Primary accent — golden amber
    primary:     '#F59E0B',
    primaryDim:  'rgba(245,158,11,0.4)',
    primaryGlow: 'rgba(245,158,11,0.2)',

    // Secondary
    secondary:   '#FCD34D',
    tertiary:    '#FDE68A',

    // Text
    textPrimary: '#FEF3C7',
    textSecond:  'rgba(253,211,77,0.7)',
    textMuted:   'rgba(245,158,11,0.4)',

    // Special
    success:     '#22C55E',
    danger:      '#EF4444',
    warning:     '#FDE047',

    logoGrad:    'linear-gradient(135deg,#FCD34D,#F59E0B,#FDE68A)',
    btnBg:       'linear-gradient(135deg,#92400E,#F59E0B)',
    scanline:    'rgba(245,158,11,0.06)',
    hexPattern:  'rgba(245,158,11,0.05)',
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ak_theme') || 'moonlight'
  })

  const currentTheme = THEMES[theme] || THEMES.moonlight

  // Apply CSS variables to :root whenever theme changes
  useEffect(() => {
    const root = document.documentElement
    const t    = currentTheme

    root.style.setProperty('--bg',            t.bg)
    root.style.setProperty('--bg-deep',       t.bgDeep)
    root.style.setProperty('--bg-card',       t.bgCard)
    root.style.setProperty('--bg-elevated',   t.bgElevated)
    root.style.setProperty('--bg-hover',      t.bgHover)
    root.style.setProperty('--border',        t.border)
    root.style.setProperty('--border-hover',  t.borderHover)
    root.style.setProperty('--border-accent', t.borderAccent)
    root.style.setProperty('--primary',       t.primary)
    root.style.setProperty('--primary-dim',   t.primaryDim)
    root.style.setProperty('--primary-glow',  t.primaryGlow)
    root.style.setProperty('--secondary',     t.secondary)
    root.style.setProperty('--tertiary',      t.tertiary)
    root.style.setProperty('--text-primary',  t.textPrimary)
    root.style.setProperty('--text-second',   t.textSecond)
    root.style.setProperty('--text-muted',    t.textMuted)
    root.style.setProperty('--success',       t.success)
    root.style.setProperty('--danger',        t.danger)
    root.style.setProperty('--warning',       t.warning)
    root.style.setProperty('--logo-grad',     t.logoGrad)
    root.style.setProperty('--btn-bg',        t.btnBg)
    root.style.setProperty('--scanline',      t.scanline)

    localStorage.setItem('ak_theme', theme)
  }, [theme, currentTheme])

  const toggleTheme = (name) => setTheme(name)

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, toggleTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
