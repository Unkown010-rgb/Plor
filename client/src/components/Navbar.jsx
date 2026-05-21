import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const COLORS = {
  navy: '#0a0e1a',
  navyLight: '#111827',
  navyBorder: '#1e2a3a',
  blue: '#3b82f6',
  blueHover: '#2563eb',
  green: '#22c55e',
  yellow: '#facc15',
  white: '#f1f5f9',
  gray: '#94a3b8',
  grayDark: '#475569',
}

function avatarColor(username) {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4']
  if (!username) return colors[0]
  return colors[username.charCodeAt(0) % colors.length]
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinks = [
    { to: '/home', label: 'Home' },
    { to: '/games', label: 'Games' },
    { to: '/avatar', label: 'Avatar' },
  ]

  return (
    <nav style={{
      backgroundColor: COLORS.navy,
      borderBottom: `2px solid ${COLORS.navyBorder}`,
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        height: 60,
        gap: 8,
      }}>
        {/* Logo */}
        <Link to="/home" style={{ textDecoration: 'none', marginRight: 24 }}>
          <span style={{
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            PLOR
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }} className="plor-desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                color: isActive(link.to) ? COLORS.blue : COLORS.gray,
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontWeight: isActive(link.to) ? 700 : 500,
                fontSize: 15,
                backgroundColor: isActive(link.to) ? 'rgba(59,130,246,0.12)' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.color = COLORS.white
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.color = COLORS.gray
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          {/* Plor Coins */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(250,204,21,0.1)',
              border: '1px solid rgba(250,204,21,0.25)',
              borderRadius: 20,
              padding: '4px 12px',
            }}>
              <span style={{ fontSize: 16 }}>💰</span>
              <span style={{ color: COLORS.yellow, fontWeight: 700, fontSize: 14 }}>
                {(user.robux_balance || user.coins || 0).toLocaleString()}
              </span>
            </div>
          )}

          {/* User avatar dropdown */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 24,
                  padding: '4px 12px 4px 4px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: avatarColor(user.username),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  {(user.username || 'U')[0].toUpperCase()}
                </div>
                <span style={{ color: COLORS.white, fontWeight: 600, fontSize: 14 }}>
                  {user.username}
                </span>
                <span style={{ color: COLORS.gray, fontSize: 12 }}>▾</span>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: '#141c2e',
                    border: `1px solid ${COLORS.navyBorder}`,
                    borderRadius: 12,
                    minWidth: 180,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    zIndex: 1000,
                    overflow: 'hidden',
                  }}>
                    <Link
                      to={`/profile/${user.username}`}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: COLORS.white,
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      👤 My Profile
                    </Link>
                    <Link
                      to="/avatar"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: COLORS.white,
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      🎮 Edit Avatar
                    </Link>
                    <div style={{ borderTop: `1px solid ${COLORS.navyBorder}` }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px 16px',
                        color: '#f87171',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Hamburger (mobile) */}
          <button
            className="plor-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              color: COLORS.white,
              fontSize: 22,
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          backgroundColor: COLORS.navyLight,
          borderTop: `1px solid ${COLORS.navyBorder}`,
          padding: '12px 20px',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                color: isActive(link.to) ? COLORS.blue : COLORS.gray,
                textDecoration: 'none',
                padding: '10px 0',
                fontWeight: isActive(link.to) ? 700 : 500,
                fontSize: 16,
                borderBottom: `1px solid ${COLORS.navyBorder}`,
              }}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              style={{
                marginTop: 8,
                color: '#f87171',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 500,
                padding: '10px 0',
              }}
            >
              Log Out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .plor-desktop-nav { display: none !important; }
          .plor-hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
