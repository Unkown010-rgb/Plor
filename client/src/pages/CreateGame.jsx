import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Adventure', emoji: '🗺️' },
  { name: 'Obby',      emoji: '🏃' },
  { name: 'Roleplay',  emoji: '🎭' },
  { name: 'Fighting',  emoji: '⚔️' },
  { name: 'Simulator', emoji: '🏗️' },
  { name: 'Racing',    emoji: '🏎️' },
]

const ENGINES = [
  {
    id:          'obby',
    label:       'Obstacle Course',
    icon:        '🏃',
    description: 'Platformer physics, jumping, platforms',
  },
  {
    id:          'sandbox',
    label:       'Sandbox Builder',
    icon:        '🧱',
    description: 'Place and remove blocks freely',
  },
  {
    id:          'racing',
    label:       'Racing Track',
    icon:        '🏎️',
    description: 'Drive around a track, beat others',
  },
]

const THUMBNAIL_COLORS = [
  '#0066ff', '#7c3aed', '#e91e63', '#ff6b00',
  '#00bcd4', '#00e676', '#ff1744', '#ffd700',
  '#ff5722', '#3d5afe',
]

const THUMBNAIL_EMOJIS = [
  '🎮', '⚔️', '🏰', '🚀', '🌍', '🐉', '🦸', '🎯',
  '🏆', '💎', '🔥', '⚡', '🌊', '🏁', '🎪', '🗡️',
  '🛡️', '🧙', '🏎️', '🎭',
]

// ─── Toast component ──────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const borderColor = type === 'success' ? 'var(--success)' : 'var(--error)'

  return (
    <div style={{
      position:    'fixed',
      bottom:      28,
      right:       28,
      zIndex:      9999,
      minWidth:    270,
      maxWidth:    400,
      background:  'rgba(14,14,32,0.97)',
      border:      `1px solid rgba(255,255,255,0.08)`,
      borderLeft:  `3px solid ${borderColor}`,
      borderRadius: 14,
      padding:     '14px 18px',
      fontSize:    13,
      fontWeight:  500,
      boxShadow:   '0 16px 40px rgba(0,0,0,0.5)',
      display:     'flex',
      alignItems:  'center',
      gap:         10,
      animation:   'toast-in 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      backdropFilter: 'blur(16px)',
      color:       type === 'success' ? 'var(--success)' : '#ff6b8a',
    }}>
      <span style={{ fontSize: 18 }}>{type === 'success' ? '✅' : '❌'}</span>
      <span>{message}</span>
    </div>
  )
}

// ─── Game Card Preview ────────────────────────────────────────────────────────

function GameCardPreview({ title, category, gameType, maxPlayers, thumbnailColor, thumbnailEmoji }) {
  const catData    = CATEGORIES.find(c => c.name === category)
  const engineData = ENGINES.find(e => e.id === gameType)

  const catColors = {
    Adventure: { bg: 'rgba(0,102,255,0.15)',  color: '#5599ff',  border: 'rgba(0,102,255,0.3)'  },
    Obby:      { bg: 'rgba(0,230,118,0.15)',  color: '#00e676',  border: 'rgba(0,230,118,0.3)'  },
    Roleplay:  { bg: 'rgba(124,58,237,0.15)', color: '#c084fc',  border: 'rgba(124,58,237,0.3)' },
    Fighting:  { bg: 'rgba(255,23,68,0.15)',  color: '#ff6b8a',  border: 'rgba(255,23,68,0.3)'  },
    Simulator: { bg: 'rgba(255,171,0,0.15)',  color: '#ffab00',  border: 'rgba(255,171,0,0.3)'  },
    Racing:    { bg: 'rgba(255,107,0,0.15)',  color: '#ff6b00',  border: 'rgba(255,107,0,0.3)'  },
  }

  const chipStyle = category && catColors[category]
    ? { background: catColors[category].bg, color: catColors[category].color, border: `1px solid ${catColors[category].border}` }
    : { background: 'rgba(255,255,255,0.07)', color: '#a0a0c8', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div style={{
      background:   'var(--card-bg)',
      border:       '1px solid var(--card-border)',
      borderRadius: 16,
      overflow:     'hidden',
    }}>
      {/* Thumbnail */}
      <div style={{
        width:           '100%',
        aspectRatio:     '16/9',
        background:      thumbnailColor || '#0066ff',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        64,
        position:        'relative',
      }}>
        <div style={{
          position:    'absolute',
          inset:       0,
          background:  'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.18) 0%, transparent 60%)',
        }} />
        <span style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}>
          {thumbnailEmoji || '🎮'}
        </span>
        <div style={{
          position:       'absolute',
          top:            10,
          right:          10,
          background:     'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          borderRadius:   20,
          padding:        '4px 10px',
          display:        'flex',
          alignItems:     'center',
          gap:            5,
          border:         '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>0 playing</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          fontSize:     14,
          fontWeight:   700,
          color:        'var(--text-primary)',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {title || 'Untitled Game'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {category && (
            <span style={{
              ...chipStyle,
              display:      'inline-flex',
              alignItems:   'center',
              gap:          4,
              padding:      '2px 9px',
              borderRadius: 20,
              fontSize:     10,
              fontWeight:   700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {catData?.emoji} {category}
            </span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {engineData ? `${engineData.icon} ${engineData.label}` : ''}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
          <span>👥 Up to {maxPlayers} players</span>
          <span>⭐ 0.0</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateGame() {
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [title,          setTitle]          = useState('')
  const [description,    setDescription]    = useState('')
  const [category,       setCategory]       = useState('')
  const [gameType,       setGameType]       = useState('')
  const [maxPlayers,     setMaxPlayers]     = useState(10)
  const [thumbnailColor, setThumbnailColor] = useState('#0066ff')
  const [thumbnailEmoji, setThumbnailEmoji] = useState('🎮')

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [toast,      setToast]      = useState(null)

  const closeToast = useCallback(() => setToast(null), [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || title.trim().length < 3 || title.trim().length > 50) {
      setError('Title must be between 3 and 50 characters.')
      return
    }
    if (!category) {
      setError('Please select a category.')
      return
    }
    if (!gameType) {
      setError('Please select a game engine.')
      return
    }

    try {
      setSubmitting(true)
      const res = await axios.post(
        '/api/games',
        { title: title.trim(), description: description.trim(), category, game_type: gameType, max_players: maxPlayers, thumbnail_color: thumbnailColor, thumbnail_emoji: thumbnailEmoji },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const newGameId = res.data?.game?.id
      setToast({ message: "Your game is live! 🎉", type: 'success' })
      setTimeout(() => navigate(`/game/${newGameId}`), 1200)
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to publish game. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-wrapper" style={{ background: 'var(--dark-900)' }}>
        <Navbar />

        {/* Hero header */}
        <div style={{
          paddingTop:  'calc(var(--navbar-h) + 48px)',
          paddingBottom: 0,
          textAlign:   'center',
          background:  'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,66,204,0.22) 0%, transparent 60%)',
        }}>
          <div style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           8,
            background:    'rgba(0,102,255,0.1)',
            border:        '1px solid rgba(0,102,255,0.28)',
            color:         '#7db8ff',
            fontSize:      12,
            fontWeight:    700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding:       '7px 16px',
            borderRadius:  20,
            marginBottom:  18,
          }}>
            🚀 Game Creator Studio
          </div>
          <h1 style={{
            fontSize:      'clamp(28px, 5vw, 46px)',
            fontWeight:    900,
            letterSpacing: '-0.03em',
            margin:        0,
            marginBottom:  10,
          }}>
            Create Your Game
          </h1>
          <p style={{
            fontSize:     16,
            color:        'var(--text-muted)',
            marginBottom: 40,
          }}>
            Share your game with millions of players
          </p>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>

              {/* ── Left panel: form fields ─────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* Game Title */}
                <Section title="Game Title">
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter a catchy game title..."
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      maxLength={50}
                      style={{ paddingRight: 60 }}
                    />
                    <span style={{
                      position:  'absolute',
                      right:     14,
                      top:       '50%',
                      transform: 'translateY(-50%)',
                      fontSize:  12,
                      color:     title.length > 45 ? 'var(--warning)' : 'var(--text-muted)',
                      fontWeight: 600,
                    }}>
                      {title.length}/50
                    </span>
                  </div>
                </Section>

                {/* Description */}
                <Section title="Description">
                  <div style={{ position: 'relative' }}>
                    <textarea
                      className="form-input"
                      placeholder="Describe your game — what makes it unique and fun?"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      maxLength={300}
                      rows={4}
                      style={{ height: 'auto', resize: 'vertical', paddingTop: 12, paddingBottom: 12, paddingRight: 60 }}
                    />
                    <span style={{
                      position:  'absolute',
                      right:     14,
                      bottom:    14,
                      fontSize:  12,
                      color:     description.length > 270 ? 'var(--warning)' : 'var(--text-muted)',
                      fontWeight: 600,
                    }}>
                      {description.length}/300
                    </span>
                  </div>
                </Section>

                {/* Category */}
                <Section title="Category">
                  <div style={{
                    display:             'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap:                 10,
                  }}>
                    {CATEGORIES.map(cat => {
                      const selected = category === cat.name
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setCategory(cat.name)}
                          style={{
                            background:   selected ? 'rgba(0,102,255,0.15)' : 'rgba(255,255,255,0.03)',
                            border:       selected ? '2px solid rgba(0,102,255,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                            borderRadius: 12,
                            padding:      '14px 10px',
                            cursor:       'pointer',
                            textAlign:    'center',
                            transition:   'all 0.18s ease',
                            position:     'relative',
                            outline:      'none',
                            boxShadow:    selected ? '0 0 0 1px rgba(0,102,255,0.4), 0 0 20px rgba(0,102,255,0.12)' : 'none',
                          }}
                          onMouseEnter={e => {
                            if (!selected) {
                              e.currentTarget.style.background   = 'rgba(255,255,255,0.07)'
                              e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.18)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!selected) {
                              e.currentTarget.style.background   = 'rgba(255,255,255,0.03)'
                              e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.08)'
                            }
                          }}
                        >
                          {selected && (
                            <span style={{
                              position:    'absolute',
                              top:         6,
                              right:       6,
                              background:  'var(--primary)',
                              borderRadius: '50%',
                              width:       18,
                              height:      18,
                              display:     'flex',
                              alignItems:  'center',
                              justifyContent: 'center',
                              fontSize:    11,
                              color:       '#fff',
                              fontWeight:  800,
                            }}>✓</span>
                          )}
                          <div style={{ fontSize: 26, marginBottom: 6 }}>{cat.emoji}</div>
                          <div style={{
                            fontSize:   13,
                            fontWeight: 700,
                            color:      selected ? '#fff' : 'var(--text-secondary)',
                          }}>
                            {cat.name}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Section>

                {/* Game Engine */}
                <Section title="Game Engine">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ENGINES.map(eng => {
                      const selected = gameType === eng.id
                      return (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => setGameType(eng.id)}
                          style={{
                            background:   selected ? 'rgba(0,102,255,0.12)' : 'rgba(255,255,255,0.03)',
                            border:       selected ? '2px solid rgba(0,102,255,0.65)' : '1.5px solid rgba(255,255,255,0.08)',
                            borderRadius: 14,
                            padding:      '16px 18px',
                            cursor:       'pointer',
                            display:      'flex',
                            alignItems:   'center',
                            gap:          16,
                            textAlign:    'left',
                            transition:   'all 0.18s ease',
                            outline:      'none',
                            boxShadow:    selected ? '0 0 0 1px rgba(0,102,255,0.35), 0 0 24px rgba(0,102,255,0.1)' : 'none',
                          }}
                          onMouseEnter={e => {
                            if (!selected) {
                              e.currentTarget.style.background  = 'rgba(255,255,255,0.06)'
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!selected) {
                              e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                            }
                          }}
                        >
                          <div style={{
                            width:          52,
                            height:         52,
                            borderRadius:   14,
                            background:     selected ? 'rgba(0,102,255,0.2)' : 'rgba(255,255,255,0.06)',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            fontSize:       26,
                            flexShrink:     0,
                            border:         selected ? '1px solid rgba(0,102,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
                            transition:     'all 0.18s ease',
                          }}>
                            {eng.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize:   15,
                              fontWeight: 700,
                              color:      selected ? '#fff' : 'var(--text-secondary)',
                              marginBottom: 3,
                            }}>
                              {eng.label}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                              {eng.description}
                            </div>
                          </div>
                          {selected && (
                            <div style={{
                              width:          24,
                              height:         24,
                              borderRadius:   '50%',
                              background:     'var(--primary)',
                              display:        'flex',
                              alignItems:     'center',
                              justifyContent: 'center',
                              fontSize:       13,
                              color:          '#fff',
                              fontWeight:     900,
                              flexShrink:     0,
                            }}>✓</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </Section>

                {/* Max Players */}
                <Section title={`Max Players: ${maxPlayers}`}>
                  <div>
                    <input
                      type="range"
                      min={2}
                      max={20}
                      value={maxPlayers}
                      onChange={e => setMaxPlayers(Number(e.target.value))}
                      style={{
                        width:     '100%',
                        accentColor: 'var(--primary)',
                        height:    6,
                        cursor:    'pointer',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>2</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>20</span>
                    </div>
                  </div>
                </Section>

                {/* Thumbnail Color */}
                <Section title="Thumbnail Color">
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {THUMBNAIL_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setThumbnailColor(color)}
                        title={color}
                        style={{
                          width:        36,
                          height:       36,
                          borderRadius: '50%',
                          background:   color,
                          border:       thumbnailColor === color ? '3px solid #fff' : '3px solid transparent',
                          cursor:       'pointer',
                          outline:      thumbnailColor === color ? '2px solid var(--primary)' : '2px solid transparent',
                          transition:   'all 0.15s ease',
                          transform:    thumbnailColor === color ? 'scale(1.18)' : 'scale(1)',
                          boxShadow:    thumbnailColor === color ? `0 0 12px ${color}88` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </Section>

                {/* Thumbnail Emoji */}
                <Section title="Thumbnail Icon">
                  <div style={{
                    display:             'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap:                 8,
                  }}>
                    {THUMBNAIL_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setThumbnailEmoji(emoji)}
                        style={{
                          background:     thumbnailEmoji === emoji ? 'rgba(0,102,255,0.2)' : 'rgba(255,255,255,0.04)',
                          border:         thumbnailEmoji === emoji ? '2px solid rgba(0,102,255,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                          borderRadius:   10,
                          padding:        '8px 4px',
                          fontSize:       22,
                          cursor:         'pointer',
                          transition:     'all 0.15s ease',
                          textAlign:      'center',
                          outline:        'none',
                          transform:      thumbnailEmoji === emoji ? 'scale(1.12)' : 'scale(1)',
                          boxShadow:      thumbnailEmoji === emoji ? '0 0 12px rgba(0,102,255,0.3)' : 'none',
                        }}
                        onMouseEnter={e => {
                          if (thumbnailEmoji !== emoji) {
                            e.currentTarget.style.background  = 'rgba(255,255,255,0.1)'
                            e.currentTarget.style.transform   = 'scale(1.08)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (thumbnailEmoji !== emoji) {
                            e.currentTarget.style.background  = 'rgba(255,255,255,0.04)'
                            e.currentTarget.style.transform   = 'scale(1)'
                          }
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Error */}
                {error && (
                  <div style={{
                    background:   'rgba(255,23,68,0.1)',
                    border:       '1px solid rgba(255,23,68,0.25)',
                    color:        '#ff6b8a',
                    borderRadius: 10,
                    padding:      '13px 16px',
                    fontSize:     13,
                    fontWeight:   500,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          10,
                  }}>
                    <span>⚠️</span>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width:        '100%',
                    padding:      '16px 24px',
                    background:   submitting ? 'rgba(0,102,255,0.5)' : 'linear-gradient(135deg, #0066ff 0%, #7c3aed 100%)',
                    border:       'none',
                    borderRadius: 14,
                    color:        '#fff',
                    fontSize:     17,
                    fontWeight:   800,
                    cursor:       submitting ? 'not-allowed' : 'pointer',
                    transition:   'all 0.2s ease',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    gap:          10,
                    boxShadow:    submitting ? 'none' : '0 6px 28px rgba(0,102,255,0.45)',
                    letterSpacing: '-0.01em',
                    fontFamily:   'Outfit, sans-serif',
                  }}
                  onMouseEnter={e => {
                    if (!submitting) {
                      e.currentTarget.style.transform  = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow  = '0 10px 36px rgba(0,102,255,0.6)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!submitting) {
                      e.currentTarget.style.transform  = 'translateY(0)'
                      e.currentTarget.style.boxShadow  = '0 6px 28px rgba(0,102,255,0.45)'
                    }
                  }}
                >
                  {submitting ? (
                    <>
                      <span style={{
                        display:      'inline-block',
                        width:        18,
                        height:       18,
                        border:       '2.5px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius:  '50%',
                        animation:     'spin 0.7s linear infinite',
                      }} />
                      Publishing...
                    </>
                  ) : (
                    'Publish Game 🚀'
                  )}
                </button>
              </div>

              {/* ── Right panel: live preview ───────────────────────── */}
              <div style={{ position: 'sticky', top: 'calc(var(--navbar-h) + 24px)' }}>
                <div style={{
                  background:   'var(--card-bg)',
                  border:       '1px solid var(--card-border)',
                  borderRadius: 20,
                  padding:      24,
                  display:      'flex',
                  flexDirection: 'column',
                  gap:          20,
                }}>
                  <div>
                    <div style={{
                      fontSize:      13,
                      fontWeight:    700,
                      color:         'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom:  14,
                      display:       'flex',
                      alignItems:    'center',
                      gap:           6,
                    }}>
                      <span>👁</span> Live Preview
                    </div>
                    <GameCardPreview
                      title={title}
                      category={category}
                      gameType={gameType}
                      maxPlayers={maxPlayers}
                      thumbnailColor={thumbnailColor}
                      thumbnailEmoji={thumbnailEmoji}
                    />
                  </div>

                  {/* Info pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <InfoRow
                      icon="📂"
                      label="Category"
                      value={category ? `${CATEGORIES.find(c => c.name === category)?.emoji} ${category}` : 'Not selected'}
                      highlight={!!category}
                    />
                    <InfoRow
                      icon="⚙️"
                      label="Game engine"
                      value={gameType ? `${ENGINES.find(e => e.id === gameType)?.icon} ${ENGINES.find(e => e.id === gameType)?.label}` : 'Not selected'}
                      highlight={!!gameType}
                    />
                    <InfoRow
                      icon="👥"
                      label="Players per server"
                      value={`${maxPlayers} players`}
                      highlight
                    />
                    <InfoRow
                      icon="🎨"
                      label="Thumbnail"
                      value={`${thumbnailEmoji} on ${thumbnailColor}`}
                      highlight
                      swatch={thumbnailColor}
                    />
                  </div>

                  {/* Tip */}
                  <div style={{
                    background:   'rgba(0,102,255,0.08)',
                    border:       '1px solid rgba(0,102,255,0.2)',
                    borderRadius: 10,
                    padding:      '10px 14px',
                    fontSize:     12,
                    color:        '#7db8ff',
                    lineHeight:   1.5,
                  }}>
                    💡 Your game will appear in the{' '}
                    <strong>{category || '...'}</strong> section once published.
                    Players can find and join it immediately!
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{
      background:   'var(--card-bg)',
      border:       '1px solid var(--card-border)',
      borderRadius: 16,
      padding:      24,
    }}>
      <div style={{
        fontSize:      12,
        fontWeight:    700,
        color:         'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom:  14,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, value, highlight, swatch }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            10,
      padding:        '8px 12px',
      background:     'rgba(255,255,255,0.03)',
      border:         '1px solid rgba(255,255,255,0.06)',
      borderRadius:   10,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, minWidth: 90 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        {swatch && (
          <span style={{
            width:        12,
            height:       12,
            borderRadius: '50%',
            background:   swatch,
            flexShrink:   0,
            border:       '1px solid rgba(255,255,255,0.2)',
          }} />
        )}
        <span style={{
          fontSize:     12,
          fontWeight:   600,
          color:        highlight ? '#fff' : 'var(--text-muted)',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {value}
        </span>
      </div>
    </div>
  )
}
