import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CATEGORY_GRADIENTS = {
  adventure: 'linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)',
  obby:      'linear-gradient(135deg, #c2410c, #f97316, #fb923c)',
  roleplay:  'linear-gradient(135deg, #6d28d9, #8b5cf6, #a78bfa)',
  fighting:  'linear-gradient(135deg, #991b1b, #ef4444, #f87171)',
  simulator: 'linear-gradient(135deg, #15803d, #22c55e, #4ade80)',
  racing:    'linear-gradient(135deg, #a16207, #eab308, #facc15)',
  default:   'linear-gradient(135deg, #1e3a5f, #2563eb, #60a5fa)',
}

const CATEGORY_ICONS = {
  adventure: '⚔️',
  obby:      '🏃',
  roleplay:  '🎭',
  fighting:  '🥊',
  simulator: '🌍',
  racing:    '🏎️',
  default:   '🎮',
}

function formatPlays(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

function StarRating({ rating }) {
  const r = Math.round((rating || 0) * 2) / 2
  return (
    <span style={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 11, lineHeight: 1 }}>
          {r >= i ? '★' : r >= i - 0.5 ? '½' : '☆'}
        </span>
      ))}
    </span>
  )
}

export default function GameCard({ game = {} }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const {
    id,
    title = 'Untitled Game',
    description = '',
    category = 'default',
    players_online = 0,
    rating = 0,
    plays = 0,
  } = game

  const cat = (category || 'default').toLowerCase()
  const gradient = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.default
  const icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS.default

  const handlePlay = (e) => {
    e.stopPropagation()
    if (id) navigate(`/game/${id}`)
  }

  return (
    <div
      onClick={handlePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#111827',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: hovered ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: hovered
          ? '0 12px 40px rgba(59,130,246,0.2), 0 4px 12px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        background: gradient,
        height: 120,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.08)',
          top: -20,
          right: -20,
        }} />
        <div style={{
          position: 'absolute',
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.06)',
          bottom: -15,
          left: 10,
        }} />

        <span style={{ fontSize: 38, zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
          {icon}
        </span>

        {/* Players online badge */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          borderRadius: 20,
          padding: '3px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 4px #22c55e',
          }} />
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
            {formatPlays(players_online)}
          </span>
        </div>

        {/* Category badge */}
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          borderRadius: 6,
          padding: '2px 7px',
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {cat === 'default' ? 'Game' : cat}
          </span>
        </div>

        {/* Hover overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: '#3b82f6',
            borderRadius: 24,
            padding: '8px 20px',
            color: '#fff',
            fontWeight: 800,
            fontSize: 14,
            transform: hovered ? 'scale(1)' : 'scale(0.85)',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 12px rgba(59,130,246,0.5)',
          }}>
            ▶ PLAY
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          color: '#f1f5f9',
          fontWeight: 700,
          fontSize: 14,
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {title}
        </div>

        {description && (
          <div style={{
            color: '#64748b',
            fontSize: 11,
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {description}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: 4,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#facc15', fontSize: 11 }}>
              <StarRating rating={rating} />
            </span>
            <span style={{ color: '#64748b', fontSize: 11 }}>
              {typeof rating === 'number' ? rating.toFixed(1) : '—'}
            </span>
          </div>
          <span style={{ color: '#64748b', fontSize: 11 }}>
            🎮 {formatPlays(plays)} plays
          </span>
        </div>
      </div>

      {/* Play button footer */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          onClick={handlePlay}
          style={{
            width: '100%',
            padding: '8px 0',
            backgroundColor: hovered ? '#2563eb' : '#1d4ed8',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            letterSpacing: '0.3px',
          }}
        >
          ▶ Play
        </button>
      </div>
    </div>
  )
}
