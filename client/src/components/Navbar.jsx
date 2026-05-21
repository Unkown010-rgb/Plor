import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarColor(str = '') {
  const palette = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
    '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
    '#00bcd4', '#ff5722', '#8bc34a', '#673ab7',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function notifIcon(type) {
  switch (type) {
    case 'friend_request':  return '👥'
    case 'friend_accepted': return '✅'
    case 'purchase':        return '🛒'
    case 'game':            return '🎮'
    default:                return '⭐'
  }
}

const LOGO_BLOCKS = ['#00a2ff', '#ff6b35', '#00d084', '#ffaa00']

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationBell({ token }) {
  const [open, setOpen]               = useState(false)
  const [notifications, setNotifs]    = useState([])
  const [loading, setLoading]         = useState(false)
  const panelRef                      = useRef(null)

  const unread = notifications.filter(n => !n.read).length

  const fetchNotifs = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifs(Array.isArray(data) ? data : (data.notifications ?? []))
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial fetch + 30-second auto-refresh
  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Close panel on outside click
  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleBellClick() {
    setOpen(v => !v)
    if (!open) fetchNotifs()
  }

  async function markAllRead() {
    if (!token) return
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    } catch { /* silent */ }
  }

  async function acceptFriend(notif) {
    if (!token) return
    try {
      await fetch('/api/users/friends/accept', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendship_id: notif.data?.friendship_id }),
      })
      setNotifs(prev => prev.map(n =>
        n.id === notif.id ? { ...n, data: { ...n.data, accepted: true }, read: true } : n
      ))
    } catch { /* silent */ }
  }

  async function declineFriend(notif) {
    if (!token) return
    try {
      await fetch('/api/users/friends/decline', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendship_id: notif.data?.friendship_id }),
      })
      setNotifs(prev => prev.map(n =>
        n.id === notif.id ? { ...n, data: { ...n.data, declined: true }, read: true } : n
      ))
    } catch { /* silent */ }
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        aria-label="Notifications"
        aria-expanded={open}
        style={{
          position: 'relative',
          background: open ? 'rgba(0,162,255,0.15)' : 'transparent',
          border: `1px solid ${open ? 'rgba(0,162,255,0.4)' : 'transparent'}`,
          borderRadius: 8,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            minWidth: 16,
            height: 16,
            background: '#ff3b30',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1,
            boxShadow: '0 0 0 2px #0d0d1a',
            animation: 'badge-pop 0.3s ease',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: 300,
          maxHeight: 400,
          background: 'rgba(18, 18, 38, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,162,255,0.1)',
          overflow: 'hidden',
          zIndex: 3000,
          animation: 'dropdown-in 0.18s ease',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
              Notifications {unread > 0 && <span style={{ color: '#ff3b30' }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00a2ff',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,162,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#8888aa', fontSize: 13 }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <div style={{ color: '#8888aa', fontSize: 13 }}>No notifications</div>
              </div>
            ) : (
              notifications.map(notif => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onAccept={acceptFriend}
                  onDecline={declineFriend}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotifItem({ notif, onAccept, onDecline }) {
  const isFriendReq = notif.type === 'friend_request'
  const accepted    = notif.data?.accepted
  const declined    = notif.data?.declined

  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: notif.read ? 'transparent' : 'rgba(0,162,255,0.06)',
      transition: 'background 0.15s',
      cursor: 'default',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(0,162,255,0.06)'}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Icon */}
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{notifIcon(notif.type)}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {notif.title}
            </span>
            {!notif.read && (
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#00a2ff',
                flexShrink: 0,
              }} />
            )}
          </div>

          <p style={{
            color: '#8888aa',
            fontSize: 12,
            lineHeight: 1.4,
            margin: 0,
            marginBottom: 4,
          }}>
            {notif.message}
          </p>

          <span style={{ color: '#555577', fontSize: 11 }}>
            {notif.created_at ? timeAgo(notif.created_at) : ''}
          </span>

          {/* Friend request action buttons */}
          {isFriendReq && !accepted && !declined && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button
                onClick={() => onAccept(notif)}
                style={{
                  background: 'linear-gradient(135deg, #00a2ff, #0080cc)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Accept
              </button>
              <button
                onClick={() => onDecline(notif)}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: '#8888aa',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,59,48,0.15)'
                  e.currentTarget.style.color = '#ff3b30'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.color = '#8888aa'
                }}
              >
                Decline
              </button>
            </div>
          )}

          {isFriendReq && accepted && (
            <span style={{ color: '#00d084', fontSize: 12, fontWeight: 600, marginTop: 4, display: 'block' }}>
              ✓ Friend added
            </span>
          )}

          {isFriendReq && declined && (
            <span style={{ color: '#8888aa', fontSize: 12, marginTop: 4, display: 'block' }}>
              Declined
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Navbar component ────────────────────────────────────────────────────

export default function Navbar() {
  const { user, logout, isAuthenticated, token } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const dropdownRef = useRef(null)

  // Close user dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  const handleLogout = useCallback(() => {
    setDropdownOpen(false)
    setMobileOpen(false)
    logout()
    navigate('/')
  }, [logout, navigate])

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const navLinks = [
    { label: 'Home',   to: '/home' },
    { label: 'Games',  to: '/games' },
    { label: 'Avatar', to: '/avatar' },
    { label: 'Store',  to: '/store' },
  ]

  const initial  = (user?.username || user?.displayName || 'P').charAt(0).toUpperCase()
  const bgColor  = avatarColor(user?.username || '')
  const robux    = user?.robux_balance ?? user?.robux ?? user?.coins ?? 0
  const username = user?.displayName || user?.username || 'Player'

  return (
    <>
      {/* ── Keyframe definitions ──────────────────────────────── */}
      <style>{`
        @keyframes badge-pop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--navbar-h)',
        background: 'rgba(10, 10, 22, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: '0 1px 0 rgba(0,162,255,0.18), 0 4px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        zIndex: 1000,
      }}>
        {/* ── Brand ─────────────────────────────────── */}
        <Link to={isAuthenticated ? '/home' : '/'} className="navbar-brand">
          <div className="navbar-brand-logo-blocks">
            {LOGO_BLOCKS.map((color, i) => (
              <span key={i} style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="navbar-brand-text">PLOR</span>
        </Link>

        {/* ── Desktop nav links ─────────────────────── */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`navbar-link${isActive(link.to) ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Search bar ────────────────────────────── */}
        <div className="navbar-search">
          <input type="text" placeholder="Search games, players..." aria-label="Search" />
          <span className="navbar-search-icon">&#128269;</span>
        </div>

        {/* ── Authenticated right side ──────────────── */}
        {isAuthenticated && (
          <div className="navbar-user">
            {/* Robux / coin balance */}
            <div className="navbar-robux" title="Your balance">
              <span className="navbar-robux-icon">&#9733;</span>
              <span>{Number(robux).toLocaleString()}</span>
            </div>

            {/* Notification bell */}
            <NotificationBell token={token} />

            {/* Avatar button + dropdown */}
            <div className="navbar-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="navbar-avatar-btn"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="Open user menu"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                <div
                  className="navbar-avatar"
                  style={{ backgroundColor: bgColor }}
                  aria-hidden="true"
                >
                  {initial}
                </div>
                <span className="navbar-username">{username}</span>
                <span
                  className={`navbar-dropdown-arrow${dropdownOpen ? ' open' : ''}`}
                  aria-hidden="true"
                >
                  &#9660;
                </span>
              </button>

              {dropdownOpen && (
                <div
                  className="navbar-dropdown"
                  role="menu"
                  style={{
                    background: 'rgba(18, 18, 38, 0.97)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                  }}
                >
                  <Link
                    to={`/profile/${user?.username}`}
                    className="navbar-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span aria-hidden="true">&#128100;</span> Profile
                  </Link>
                  <Link
                    to="/avatar"
                    className="navbar-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span aria-hidden="true">&#128084;</span> Avatar
                  </Link>
                  <Link
                    to="/robux"
                    className="navbar-dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    style={{ color: '#ffaa00' }}
                  >
                    <span aria-hidden="true">&#9733;</span> Get Plor Coins
                  </Link>
                  <div className="navbar-dropdown-divider" role="separator" />
                  <button
                    className="navbar-dropdown-item danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span aria-hidden="true">&#128682;</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Guest right side ──────────────────────── */}
        {!isAuthenticated && (
          <div className="navbar-user">
            <Link to="/login"    className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary   btn-sm">Sign Up</Link>
          </div>
        )}

        {/* ── Hamburger (mobile) ────────────────────── */}
        <button
          className="navbar-hamburger"
          aria-label="Toggle mobile menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* ── Mobile drop-down menu ─────────────────────── */}
      <div className={`navbar-mobile-menu${mobileOpen ? ' open' : ''}`} role="navigation">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className={`navbar-link${isActive(link.to) ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        {/* Mobile search */}
        <div style={{ marginTop: 8 }}>
          <input
            type="text"
            placeholder="Search..."
            className="form-input"
            style={{ height: 36, fontSize: 13 }}
            aria-label="Search"
          />
        </div>

        {!isAuthenticated && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Link
              to="/login"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn btn-primary btn-sm"
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => setMobileOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <button
            className="btn btn-danger btn-sm"
            style={{ marginTop: 8, width: '100%' }}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        )}
      </div>
    </>
  )
}
