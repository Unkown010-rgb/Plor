import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

// Decorative floating shapes rendered behind the hero
const SHAPES = [
  { size: 60,  top: '12%',  left: '8%',   color: '#00a2ff', delay: '0s',   dur: '7s'  },
  { size: 40,  top: '70%',  left: '5%',   color: '#a855f7', delay: '1.5s', dur: '9s'  },
  { size: 80,  top: '20%',  right: '6%',  color: '#ff6b35', delay: '0.5s', dur: '11s' },
  { size: 30,  top: '55%',  right: '12%', color: '#00d084', delay: '2s',   dur: '8s'  },
  { size: 50,  top: '80%',  left: '30%',  color: '#ffaa00', delay: '1s',   dur: '10s' },
  { size: 25,  top: '35%',  left: '18%',  color: '#00a2ff', delay: '3s',   dur: '6s'  },
  { size: 70,  top: '60%',  right: '28%', color: '#a855f7', delay: '0.8s', dur: '12s' },
  { size: 20,  top: '10%',  left: '55%',  color: '#ff6b35', delay: '2.5s', dur: '7.5s'},
]

const FEATURES = [
  {
    icon: '🎮',
    title: 'Play Thousands of Games',
    desc: 'Dive into an ever-growing library of player-created games — from intense adventures to chill simulators. There\'s something for everyone.',
    color: '#00a2ff',
  },
  {
    icon: '👤',
    title: 'Create Your Avatar',
    desc: 'Express yourself with a fully customisable avatar. Mix and match styles, outfits, and accessories to stand out from the crowd.',
    color: '#a855f7',
  },
  {
    icon: '👥',
    title: 'Play with Friends',
    desc: 'Invite friends, join public servers, and make new ones. Plor is better together — real-time multiplayer in every game.',
    color: '#00d084',
  },
]

const STATS = [
  { value: '50M+',  label: 'Players' },
  { value: '1M+',   label: 'Games' },
  { value: 'Free',  label: 'to Play' },
]

export default function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  // Redirect authenticated users straight to the home feed
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  // While checking auth, render nothing to avoid flash
  if (loading) return null

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Minimal top bar ─────────────────────────────── */}
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 'var(--navbar-h)',
        background: 'rgba(13,13,26,0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#00a2ff','#ff6b35','#00d084','#ffaa00'].map((c, i) => (
              <span key={i} style={{
                display: 'block', width: 10, height: 10,
                borderRadius: 2, backgroundColor: c,
              }} />
            ))}
          </div>
          <span style={{
            fontSize: 22, fontWeight: 900, letterSpacing: 2,
            background: 'linear-gradient(135deg,#00a2ff,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>PLOR</span>
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login"    className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary   btn-sm">Get Started Free</Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="landing-hero">
        {/* Floating background shapes */}
        <div className="landing-shapes" aria-hidden="true">
          {SHAPES.map((s, i) => (
            <div
              key={i}
              className="landing-shape"
              style={{
                width: s.size,
                height: s.size,
                top: s.top,
                left: s.left,
                right: s.right,
                backgroundColor: s.color,
                animationDuration: s.dur,
                animationDelay: s.delay,
              }}
            />
          ))}
        </div>

        <div className="landing-hero-content">
          {/* Eyebrow badge */}
          <div className="landing-eyebrow">
            <span>&#127775;</span>
            The #1 Community Gaming Platform
          </div>

          {/* Main headline */}
          <h1 className="landing-title">
            Imagine,{' '}
            <span className="landing-title-gradient">Create,</span>
            <br />
            Play.
          </h1>

          {/* Subtitle */}
          <p className="landing-subtitle">
            Join millions of players in Plor — the ultimate gaming platform
            where creativity meets adventure. Build worlds, play games,
            make friends.
          </p>

          {/* CTA buttons */}
          <div className="landing-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              &#9658; Start Playing — It&apos;s Free
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Explore Games
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────── */}
      <section className="landing-stats">
        <div className="landing-stats-inner">
          {STATS.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <div className="landing-stat-divider" aria-hidden="true" />}
              <div className="landing-stat">
                <div className="landing-stat-value">{stat.value}</div>
                <div className="landing-stat-label">{stat.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section>
        <div className="landing-features">
          <h2 className="landing-features-title">
            Everything you need to{' '}
            <span style={{
              background: 'linear-gradient(135deg,#00a2ff,#a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              have fun
            </span>
          </h2>

          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <span
                  className="landing-feature-icon"
                  role="img"
                  aria-label={f.title}
                >
                  {f.icon}
                </span>
                <h3
                  className="landing-feature-title"
                  style={{ color: f.color }}
                >
                  {f.title}
                </h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────── */}
      <section style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, rgba(0,80,180,0.15), rgba(100,30,200,0.12))',
        borderTop: '1px solid var(--border)',
      }}>
        <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, marginBottom: 14 }}>
          Ready to play?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28 }}>
          Create your free account in seconds. No credit card required.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Free Account
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="landing-footer">
        <p>&copy; 2024 Plor. All rights reserved.</p>
      </footer>
    </div>
  )
}
