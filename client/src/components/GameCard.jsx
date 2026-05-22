import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/global.css'

/* ── Category config ─────────────────────────────────────── */
const CAT = {
  adventure: {
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
    chipColor: 'rgba(59,130,246,0.2)',
    chipBorder: 'rgba(59,130,246,0.4)',
    chipText: '#93c5fd',
    icon: '⚔️',
  },
  obby: {
    gradient: 'linear-gradient(135deg, #c2410c 0%, #f97316 50%, #fb923c 100%)',
    chipColor: 'rgba(249,115,22,0.18)',
    chipBorder: 'rgba(249,115,22,0.4)',
    chipText: '#fdba74',
    icon: '🏃',
  },
  roleplay: {
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 50%, #a78bfa 100%)',
    chipColor: 'rgba(139,92,246,0.18)',
    chipBorder: 'rgba(139,92,246,0.4)',
    chipText: '#c4b5fd',
    icon: '🎭',
  },
  fighting: {
    gradient: 'linear-gradient(135deg, #991b1b 0%, #ef4444 50%, #f87171 100%)',
    chipColor: 'rgba(239,68,68,0.18)',
    chipBorder: 'rgba(239,68,68,0.4)',
    chipText: '#fca5a5',
    icon: '🥊',
  },
  simulator: {
    gradient: 'linear-gradient(135deg, #15803d 0%, #22c55e 50%, #4ade80 100%)',
    chipColor: 'rgba(34,197,94,0.15)',
    chipBorder: 'rgba(34,197,94,0.35)',
    chipText: '#86efac',
    icon: '🌍',
  },
  racing: {
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 50%, #facc15 100%)',
    chipColor: 'rgba(217,119,6,0.18)',
    chipBorder: 'rgba(217,119,6,0.4)',
    chipText: '#fcd34d',
    icon: '🏎️',
  },
  default: {
    gradient: 'linear-gradient(135deg, #0f1e4d 0%, #1d4ed8 50%, #3b82f6 100%)',
    chipColor: 'rgba(0,102,255,0.15)',
    chipBorder: 'rgba(0,102,255,0.35)',
    chipText: '#7db8ff',
    icon: '🎮',
  },
}

function formatPlays(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function StarRating({ rating = 0 }) {
  const r = Math.round(Math.max(0, Math.min(5, rating)) * 2) / 2
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{
          fontSize: 11,
          lineHeight: 1,
          color: r >= i ? '#ffab00' : r >= i - 0.5 ? '#ffab00' : '#2a2a50',
          filter: r >= i ? 'drop-shadow(0 0 3px rgba(255,171,0,0.6))' : 'none',
        }}>
          {r >= i ? '★' : r >= i - 0.5 ? '⯨' : '★'}
        </span>
      ))}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function GameCard({ game = {} }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const {
    id,
    title          = 'Untitled Game',
    description    = '',
    category       = 'default',
    players_online = 0,
    rating         = 0,
    plays          = 0,
  } = game

  const cat      = (category || 'default').toLowerCase()
  const config   = CAT[cat] || CAT.default
  const catLabel = cat === 'default' ? 'Game' : cat.charAt(0).toUpperCase() + cat.slice(1)

  const handlePlay = (e) => {
    e.stopPropagation()
    if (id) navigate(`/game/${id}`)
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    setFavorited(f => !f)
  }

  return (
    <div
      className="game-card"
      onClick={handlePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Thumbnail ──────────────────────────────────── */}
      <div
        className="game-thumbnail"
        style={{ background: config.gradient }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -24, right: -24,
          width: 96, height: 96, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.07)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -18, left: 10,
          width: 64, height: 64, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }} />

        {/* Game icon */}
        <span style={{
          fontSize: 40,
          zIndex: 1,
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.4))',
          position: 'relative',
          transition: 'transform 0.22s ease',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
        }}>
          {config.icon}
        </span>

        {/* Players badge (top-right) */}
        <div className="players-badge">
          <span className="dot" />
          <span>{formatPlays(players_online)}</span>
        </div>

        {/* Favorite button (top-left) */}
        <button
          onClick={handleFavorite}
          style={{
            position: 'absolute', top: 8, left: 8,
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, cursor: 'pointer', zIndex: 5,
            transition: 'transform 0.15s, background 0.15s',
            color: favorited ? '#ff4d6d' : 'rgba(255,255,255,0.7)',
            transform: favorited ? 'scale(1.2)' : 'scale(1)',
          }}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorited ? '♥' : '♡'}
        </button>

        {/* Hover overlay gradient */}
        <div className="game-overlay" />

        {/* Play button overlay */}
        <div className="play-btn-overlay">
          <div className="play-pill">▶ PLAY</div>
        </div>
      </div>

      {/* ── Info ───────────────────────────────────────── */}
      <div className="game-info">
        <div className="game-title">{title}</div>

        {/* Category chip + rating row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="cat-chip" style={{
            background: config.chipColor,
            border: `1px solid ${config.chipBorder}`,
            color: config.chipText,
          }}>
            {config.icon} {catLabel}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <StarRating rating={rating} />
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginLeft: 2,
            }}>
              {typeof rating === 'number' ? rating.toFixed(1) : '—'}
            </span>
          </span>
        </div>

        {/* Play count + play button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            🎮 {formatPlays(plays)} plays
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePlay}
            style={{
              padding: '5px 14px',
              fontSize: 12,
              borderRadius: 8,
              opacity: hovered ? 1 : 0.85,
              transition: 'opacity 0.2s',
            }}
          >
            Play
          </button>
        </div>
      </div>
    </div>
  )
}
