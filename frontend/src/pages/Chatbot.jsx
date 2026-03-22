import { useTranslation } from 'react-i18next'
import VineBorder from '../components/VineBorder'
import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'

const QUICK_SUGGESTIONS = [
  { key: "sug1", icon: "🌾" },
  { key: "sug2", icon: "🍅" },
  { key: "sug3", icon: "🌤️" },
  { key: "sug4", icon: "💰" },
  { key: "sug5", icon: "🌱" },
  { key: "sug6", icon: "🐛" },
]

const LANGUAGES = [
  { code: "en", label: "EN",      full: "English" },
  { code: "ta", label: "தமிழ்",   full: "Tamil"   },
  { code: "hi", label: "हिंदी",   full: "Hindi"   },
]

const WELCOME_MESSAGES = {
  en: "Namaste! 🙏 I am AMRITKRISHI AI, your personal farming assistant. Ask me anything about crops, diseases, weather, market prices, or government schemes. I'm here to help!",
  ta: "நமஸ்தே! 🙏 நான் AMRITKRISHI AI, உங்கள் தனிப்பட்ட விவசாய உதவியாளர். பயிர்கள், நோய்கள், வானிலை, சந்தை விலைகள் அல்லது அரசு திட்டங்கள் பற்றி என்னிடம் கேளுங்கள்!",
  hi: "नमस्ते! 🙏 मैं AMRITKRISHI AI हूं, आपका व्यक्तिगत कृषि सहायक। फसल, बीमारी, मौसम, बाजार भाव या सरकारी योजनाओं के बारे में कुछ भी पूछें!",
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                  background: '#020D05', border: '1px solid #22C55E44', borderRadius: '4px',
                  width: 'fit-content', maxWidth: 80 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '2px', background: '#22C55E',
          animation: 'pulse-nge 1.2s ease infinite',
          animationDelay: `${i * 0.2}s`
        }} />
      ))}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
      alignItems: 'flex-start',
      gap: 8
    }}>
      {/* AI Avatar */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '2px',
          background: '#00FF4122', border: '1px solid #00FF41',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0
        }}>🤖</div>
      )}

      <div style={{ maxWidth: '85%' }}>
        {/* Bubble */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '2px',
          background: isUser ? '#1A0500' : '#020D05',
          border: `1px solid ${isUser ? '#22C55E' : '#00FF4144'}`,
          color: isUser ? '#22C55E' : '#00FF41',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 0 10px #22C55E22' : 'inset 0 0 10px #00FF4111'
        }}>
          {msg.content}
        </div>

        {/* Timestamp */}
        <p style={{
          color: '#666680', fontSize: 10, margin: '4px 6px 0',
          textAlign: isUser ? 'right' : 'left',
          fontFamily: "'Share Tech Mono', monospace"
        }}>
          {msg.time}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '2px',
          background: '#22C55E22', border: '1px solid #22C55E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0
        }}>👤</div>
      )}
    </div>
  )
}

export default function Chatbot() {
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const language = i18n.language || 'en'
  const [showLangMenu, setShowLangMenu] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Set welcome message when language changes
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: WELCOME_MESSAGES[language],
      time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    }])
  }, [language])

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    const userMsg = {
      role: 'user',
      content: trimmed,
      time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const history = updatedMessages
        .slice(1) // skip welcome message
        .map(m => ({ role: m.role, content: m.content }))

      const res = await api.post('/api/chatbot', {
        message: trimmed,
        language,
        history: history.slice(0, -1) // exclude current message
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply,
        time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('chat_nge.uplink_fail'),
        time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const currentLang = LANGUAGES.find(l => l.code === language)

  return (
    <div className="hex-bg" style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#020D05', position: 'relative'
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0D2914, #040F07)',
        borderBottom: '1px solid #22C55E',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '2px',
            background: '#22C55E22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, border: '1px solid #22C55E',
            boxShadow: '0 0 10px #22C55E44'
          }}>🤖</div>
          <div>
            <p style={{ color: '#22C55E', fontWeight: 900, fontSize: 18, margin: 0, fontFamily: "'Exo 2', sans-serif", letterSpacing: 2, textShadow: '0 0 10px #22C55E88' }}>
              {t('chat_nge.title')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '2px',
                            background: '#00FF41',
                            boxShadow: '0 0 6px #00FF41',
                            animation: 'flicker 3s infinite' }} />
              <p style={{ color: '#00FF41', fontSize: 10, margin: 0, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>{t('chat_nge.sys_status')}</p>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowLangMenu(!showLangMenu)}
            style={{
              background: '#020D05', border: '1px solid #22C55E66',
              borderRadius: 2, color: '#E8E8E8', padding: '8px 12px',
              cursor: 'pointer', fontSize: 12, fontFamily: "'Share Tech Mono', monospace",
              display: 'flex', alignItems: 'center', gap: 6
            }}>
            {currentLang.label} ▾
          </button>

          {showLangMenu && (
            <div style={{
              position: 'absolute', top: '110%', right: 0,
              background: '#040F07', border: '1px solid #22C55E',
              borderRadius: 2, overflow: 'hidden', zIndex: 100,
              minWidth: 140
            }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setShowLangMenu(false) }}
                  style={{
                    display: 'block', width: '100%', padding: '10px 16px',
                    background: language === lang.code ? '#22C55E22' : 'transparent',
                    border: 'none', color: language === lang.code ? '#22C55E' : '#666680',
                    cursor: 'pointer', textAlign: 'left', fontSize: 12, fontFamily: "'Share Tech Mono', monospace",
                    borderLeft: language === lang.code ? '3px solid #22C55E' : '3px solid transparent'
                  }}>
                  {lang.label} — {lang.full}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 24px', paddingBottom: '160px',
        display: 'flex', flexDirection: 'column'
      }}>
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '2px',
              background: '#00FF4122', border: '1px solid #00FF41',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>🤖</div>
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar Fixed Bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 240, right: 0,
        padding: '16px 24px', background: '#040F07',
        borderTop: '1px solid #22C55E', zIndex: 10
      }}>
        {/* Quick Suggestion Chips */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {QUICK_SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(t('chat_nge.' + s.key))}
                style={{
                  padding: '6px 14px', borderRadius: 2, border: '1px solid #22C55E66',
                  background: '#020D05', color: '#E8E8E8', fontSize: 11, cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: "'Share Tech Mono', monospace"
                }}
                onMouseEnter={e => { e.target.style.borderColor = '#22C55E'; e.target.style.background = '#22C55E22'; e.target.style.color = '#22C55E' }}
                onMouseLeave={e => { e.target.style.borderColor = '#22C55E66'; e.target.style.background = '#020D05'; e.target.style.color = '#E8E8E8' }}>
                <span style={{color: '#22C55E'}}>{t('chat_nge.query')}</span> {t('chat_nge.' + s.key)}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat_nge.placeholder')}
            disabled={loading}
            autoFocus
            style={{
              flex: 1, background: '#020D05', border: '1px solid #22C55E66',
              borderRadius: 2, color: '#22C55E', padding: '12px 16px',
              fontSize: 14, outline: 'none', pointerEvents: 'all', cursor: 'text',
              caretColor: '#22C55E',
              fontFamily: "'Share Tech Mono', monospace",
              textTransform: 'uppercase'
            }}
            onFocus={e => { e.target.style.borderColor = '#22C55E'; e.target.style.boxShadow = '0 0 10px #22C55E33'; }}
            onBlur={e => { e.target.style.borderColor = '#22C55E66'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              height: 44, borderRadius: 2, border: '1px solid #22C55E',
              background: input.trim() && !loading ? '#22C55E22' : '#040F07',
              color: input.trim() && !loading ? '#22C55E' : '#666680',
              fontSize: 12, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', pointerEvents: 'all', padding: '0 24px',
              fontFamily: "'Exo 2', sans-serif", letterSpacing: 2, fontWeight: 700
            }}>
            {loading ? t('chat_nge.processing') : t('chat_nge.transmit')}
          </button>
        </div>
        <p style={{ color: '#666680', fontSize: 10, textAlign: 'center', margin: '8px 0 0', fontFamily: "'Share Tech Mono', monospace" }}>
          {t('chat_nge.caution')}
        </p>
      </div>

      <style>{`
        @keyframes pulse-nge {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
