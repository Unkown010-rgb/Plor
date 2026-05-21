import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

// Deterministic avatar background color derived from username
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

// Four colored blocks that make up the PLOR logo mark
const LOGO_BLOCKS = ['#00a2ff', '#ff6b35', '#00d084', '#ffaa00']

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside of it
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
    { label: 'Store',  to: '/store', comingSoon: true },
  ]

  const initial = (user?.username || user?.displayName || 'P').charAt(0).toUpperCase()
  const bgColor  = avatarColor(user?.username || '')
  const robux    = user?.robux_balance ?? user?.robux ?? user?.coins ?? 0
  const username = user?.displayName || user?.username || 'Player'

  return (
    <>
      <nav className="navbar">
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
          {navLinks.map((link) =>
            link.comingSoon ? (
              <span
                key={link.label}
                className="navbar-link coming-soon"
                title="Coming Soon"
              >
                {link.label}
              </span>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className={`navbar-link${isActive(link.to) ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            )
          )}
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
                <div className="navbar-dropdown" role="menu">
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
        {navLinks.map((link) =>
          link.comingSoon ? (
            <span
              key={link.label}
              className="navbar-link coming-soon"
              style={{ opacity: 0.4 }}
            >
              {link.label} <small>(Soon)</small>
            </span>
          ) : (
            <Link
              key={link.label}
              to={link.to}
              className={`navbar-link${isActive(link.to) ? ' active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          )
        )}

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
