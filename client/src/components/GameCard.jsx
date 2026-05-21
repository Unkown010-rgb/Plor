import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/global.css'

/* ─── category config ─────────────────────────────────────── */
const CAT = {
  adventure: { gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)', icon: '⚔️' },
  obby:      { gradient: 'linear-gradient(135deg, #c2410c, #f97316, #fb923c)', icon: '🏃' },
  roleplay:  { gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6, #a78bfa)', icon: '🎭' },
  fighting:  { gradient: 'linear-gradient(135deg, #991b1b, #ef4444, #f87171)', icon: '🥊' },
  simulator: { gradient: 'linear-gradient(135deg, #15803d, #22c55e, #4ade80)', icon: '🌍' },
  racing:    { gradient: 'linear-gradient(135deg, #92400e, #d97706, #facc15)', icon: '🏎️' },
  default:   { gradient: 'linear-gradient(135deg, #1e3a5f, #2563eb, #60a5fa)', icon: '🎮' },
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
    <span style={{ display: 'inline-flex', gap: 1, color: 'var(--warning)' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 11, lineHeight: 1 }}>
          {r >= i ? '★' : r >= i - 0.5 ? '⯨' : '☆'}
        </span>
      ))}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function GameCard({ game = {} }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

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

  return (
    <div
      className="game-card"
      onClick={handlePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? '0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px var(--primary)'
          : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Thumbnail ──────────────────────────────────── */}
      <div style={{
        background: config.gradient,
        height: 120,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* decorative circles */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -15, left: 8,
          width: 55, height: 55, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />

        <span style={{ fontSize: 38, zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          {config.icon}
        </span>

        {/* Players online badge */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          borderRadius: 20, padding: '3px 8px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: 'var(--success)', boxShadow: '0 0 4px var(--success)',
          }} />
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
            {formatPlays(players_online)}
          </span>
        </div>

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          borderRadius: 6, padding: '2px 7px',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {catLabel}
          </span>
        </div>

        {/* Hover play overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.38)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), #0077dd)',
            borderRadius: 24, padding: '8px 22px',
            color: '#fff', fontWeight: 900, fontSize: 14,
            transform: hovered ? 'scale(1)' : 'scale(0.8)',
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 4px 16px rgba(0,162,255,0.45)',
          }}>
            ▶ PLAY
          </div>
        </div>
      </div>

      {/* ── Info ───────────────────────────────────────── */}
      <div className="game-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div className="game-title">{title}</div>

        {description && (
          <div style={{
            color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {description}
          </div>
        )}

        <div className="game-meta" style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <StarRating rating={rating} />
            <span style={{ opacity: 0.7 }}>{typeof rating === 'number' ? rating.toFixed(1) : '—'}</span>
          </span>
          <span>🎮 {formatPlays(plays)}</span>
        </div>
      </div>

      {/* ── Play button ────────────────────────────────── */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          className="btn btn-primary btn-sm btn-full"
          onClick={handlePlay}
          style={{ borderRadius: 8 }}
        >
          ▶ Play
        </button>
      </div>
    </div>
  )
}
