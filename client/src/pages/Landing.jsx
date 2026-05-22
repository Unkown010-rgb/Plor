import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

/* ── Floating background shapes ──────────────────────────── */
const SHAPES = [
  { size: 80,  top: '10%',  left: '6%',   color: '#0066ff', delay: '0s',   dur: '8s'  },
  { size: 50,  top: '68%',  left: '4%',   color: '#7c3aed', delay: '1.5s', dur: '10s' },
  { size: 100, top: '18%',  right: '5%',  color: '#ff6b00', delay: '0.5s', dur: '12s' },
  { size: 36,  top: '55%',  right: '10%', color: '#00e676', delay: '2s',   dur: '9s'  },
  { size: 64,  top: '78%',  left: '28%',  color: '#ffab00', delay: '1s',   dur: '11s' },
  { size: 30,  top: '32%',  left: '16%',  color: '#0066ff', delay: '3s',   dur: '7s'  },
  { size: 88,  top: '58%',  right: '26%', color: '#7c3aed', delay: '0.8s', dur: '13s' },
  { size: 24,  top: '8%',   left: '52%',  color: '#ff6b00', delay: '2.5s', dur: '8s'  },
]

/* ── Floating hero preview cards ──────────────────────────── */
const HERO_CARDS = [
  {
    title: 'Neon Obby',
    players: '14.2K playing',
    gradient: 'linear-gradient(135deg, #c2410c, #f97316)',
    icon: '🏃',
  },
  {
    title: 'Galaxy Wars',
    players: '42.8K playing',
    gradient: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
    icon: '🚀',
  },
  {
    title: 'Block Builder',
    players: '8.5K playing',
    gradient: 'linear-gradient(135deg, #15803d, #22c55e)',
    icon: '🏗️',
  },
]

/* ── Stats ────────────────────────────────────────────────── */
const STATS = [
  { icon: '🟢', value: '47,382', label: 'Online Now' },
  { icon: '🎮', value: '1M+',    label: 'Games' },
  { icon: '👥', value: '50M+',   label: 'Players' },
  { icon: '⭐', value: 'Free',   label: 'to Play' },
]

/* ── Trending carousel ────────────────────────────────────── */
const TRENDING = [
  { title: 'Neon Obby Rush',      players: '42.8K', gradient: 'linear-gradient(135deg, #c2410c, #f97316, #fb923c)', icon: '🏃' },
  { title: 'Galaxy Wars RPG',     players: '31.2K', gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)', icon: '🚀' },
  { title: 'Island Tycoon',       players: '18.7K', gradient: 'linear-gradient(135deg, #15803d, #22c55e, #4ade80)', icon: '🌴' },
  { title: 'Shadow Fighters',     players: '27.4K', gradient: 'linear-gradient(135deg, #991b1b, #ef4444, #f87171)', icon: '🥊' },
  { title: 'Wizard Academy',      players: '11.9K', gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6, #a78bfa)', icon: '🧙' },
  { title: 'Speed Circuit',       players: '9.3K',  gradient: 'linear-gradient(135deg, #92400e, #d97706, #facc15)', icon: '🏎️' },
]

/* ── Features ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🎮',
    title: 'Infinite Games',
    desc: 'Dive into an ever-growing library of millions of player-created experiences. From intense RPGs to chill simulators — there\'s something for everyone.',
    color: 'rgba(0,102,255,0.15)',
    glow: 'rgba(0,102,255,0.3)',
  },
  {
    icon: '🏗️',
    title: 'Build Anything',
    desc: 'Powerful creation tools put the universe in your hands. Design worlds, script gameplay, and share your creations with 50 million players.',
    color: 'rgba(255,107,0,0.12)',
    glow: 'rgba(255,107,0,0.25)',
  },
  {
    icon: '👥',
    title: 'Play with Friends',
    desc: 'Real-time multiplayer in every game. Invite your crew, join public servers, and make new friends in the ultimate social gaming universe.',
    color: 'rgba(0,230,118,0.1)',
    glow: 'rgba(0,230,118,0.22)',
  },
]

/* ── Showcase ─────────────────────────────────────────────── */
const SHOWCASE = [
  { gradient: 'linear-gradient(135deg, #0f1e4d 0%, #1d4ed8 50%, #7c3aed 100%)', icon: '🏙️', label: 'Neon City' },
  { gradient: 'linear-gradient(135deg, #14402a 0%, #15803d 60%, #4ade80 100%)', icon: '🌴', label: 'Jungle Isle' },
  { gradient: 'linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #ef4444 100%)', icon: '🌋', label: 'Lava World' },
  { gradient: 'linear-gradient(135deg, #1e1a40 0%, #6d28d9 60%, #a78bfa 100%)', icon: '🌌', label: 'Galaxy' },
]

/* ── Stat counter animation ────────────────────────────────── */
function useCountUp(target, duration = 1200, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    const isNum = typeof target === 'number'
    if (!isNum) { setCount(target); return }
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start]) // eslint-disable-line react-hooks/exhaustive-deps
  return count
}

/* ── Stats bar item ────────────────────────────────────────── */
function StatItem({ icon, value, label, visible }) {
  return (
    <div className="landing-stat">
      <div className="landing-stat-value">
        <span className="landing-stat-icon">{icon}</span>
        {value}
      </div>
      <div className="landing-stat-label">{label}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const statsRef = useRef(null)
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  /* Observe stats bar for count-up trigger */
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (loading) return null

  return (
    <div style={{ background: 'var(--dark-900)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Header ──────────────────────────────────── */}
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 'var(--navbar-h)',
        background: 'rgba(5,5,16,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 30px rgba(0,0,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        zIndex: 100,
        animation: 'slide-down 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#0066ff', '#ff6b00', '#00e676', '#ffab00'].map((c, i) => (
              <span key={i} style={{
                display: 'block', width: 10, height: 10,
                borderRadius: 2, backgroundColor: c,
                boxShadow: `0 0 6px ${c}88`,
              }} />
            ))}
          </div>
          <span style={{
            fontSize: 23, fontWeight: 900, letterSpacing: 3,
            background: 'linear-gradient(135deg, #0066ff, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>PLOR</span>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 4, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          className="landing-nav-links">
          {['Games', 'Create', 'Community'].map(link => (
            <span key={link} style={{
              padding: '6px 14px',
              color: 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
            >{link}</span>
          ))}
        </nav>

        {/* Auth buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="landing-hero" style={{ paddingTop: 'var(--navbar-h)' }}>
        {/* Floating shapes */}
        <div className="landing-shapes" aria-hidden="true">
          {SHAPES.map((s, i) => (
            <div key={i} className="landing-shape" style={{
              width: s.size, height: s.size,
              top: s.top, left: s.left, right: s.right,
              backgroundColor: s.color,
              animationDuration: s.dur,
              animationDelay: s.delay,
            }} />
          ))}
        </div>

        <div className="landing-hero-content">
          {/* Eyebrow badge */}
          <div className="landing-eyebrow">
            <span>🎮</span>
            New · Season 3 is Live!
          </div>

          {/* Headline */}
          <h1 className="landing-title">
            The Next Generation<br />
            <span className="landing-title-gradient">Gaming Universe</span>
          </h1>

          {/* Subtitle */}
          <p className="landing-subtitle">
            Create, play, and share experiences with 50 million players worldwide.
            Your adventure starts here.
          </p>

          {/* CTA buttons */}
          <div className="landing-cta">
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: 15, padding: '15px 36px' }}>
              ▶ Start Playing Free
            </Link>
            <Link to="/games" className="btn btn-secondary btn-lg" style={{ fontSize: 15, padding: '15px 32px' }}>
              <span style={{ fontSize: 18 }}>▷</span> Watch Trailer
            </Link>
          </div>

          {/* Floating game cards */}
          <div className="landing-hero-cards" aria-hidden="true">
            {HERO_CARDS.map((card, i) => (
              <div key={i} className="landing-hero-card">
                <div className="landing-hero-card-thumb" style={{ background: card.gradient }}>
                  {card.icon}
                </div>
                <div className="landing-hero-card-info">
                  <div className="landing-hero-card-title">{card.title}</div>
                  <div className="landing-hero-card-players">
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      display: 'inline-block',
                      animation: 'pulse-glow 2s infinite',
                    }} />
                    {card.players}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">Scroll to explore</div>
      </section>

      {/* ── Live Stats Bar ──────────────────────────────── */}
      <section ref={statsRef} className="landing-stats">
        <div className="landing-stats-inner">
          {STATS.map((stat) => (
            <StatItem
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              visible={statsVisible}
            />
          ))}
        </div>
      </section>

      {/* ── Trending Now Carousel ───────────────────────── */}
      <section style={{ padding: '72px 0 60px', maxWidth: 1240, margin: '0 auto', width: '100%', paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 className="landing-carousel-title">
            🔥 Trending Now
          </h2>
          <Link to="/games" className="btn btn-secondary btn-sm">View All →</Link>
        </div>
        <div className="landing-carousel-track">
          {TRENDING.map((g, i) => (
            <div key={i} className="landing-carousel-card" onClick={() => navigate('/games')}>
              <div className="landing-carousel-thumb" style={{ background: g.gradient }}>
                <span style={{ fontSize: 40, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>
                  {g.icon}
                </span>
                {/* Players badge */}
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 20, padding: '3px 9px',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                    display: 'inline-block',
                  }} />
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>
                    {g.players}
                  </span>
                </div>
              </div>
              <div className="landing-carousel-info">
                <div className="landing-carousel-name">{g.title}</div>
                <div className="landing-carousel-players">● {g.players} playing</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Plor section ────────────────────────────── */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="landing-features">
          <h2 className="landing-features-title">
            Why millions choose{' '}
            <span className="landing-title-gradient">Plor</span>
          </h2>

          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon-wrap" style={{
                  background: f.color,
                  boxShadow: `0 8px 24px ${f.glow}`,
                }}>
                  <span style={{ fontSize: 32 }}>{f.icon}</span>
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screenshot Showcase ─────────────────────────── */}
      <section>
        <div className="landing-showcase">
          <h2 style={{
            fontSize: 'clamp(26px, 4vw, 40px)',
            fontWeight: 900,
            textAlign: 'center',
            marginBottom: 48,
            letterSpacing: '-0.03em',
          }}>
            See the worlds players have{' '}
            <span className="landing-title-gradient">built</span>
          </h2>
          <div className="landing-showcase-grid">
            {SHOWCASE.map((item, i) => (
              <div
                key={i}
                className="landing-showcase-item"
                style={{ background: item.gradient }}
              >
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                  <div style={{ fontSize: 52, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 800,
                    fontSize: 16,
                    letterSpacing: '-0.01em',
                  }}>
                    {item.label}
                  </div>
                </div>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.3))',
                  pointerEvents: 'none',
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ────────────────────────────────────── */}
      <section className="landing-cta-band">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,102,255,0.1)',
          border: '1px solid rgba(0,102,255,0.25)',
          borderRadius: 20, padding: '6px 16px',
          marginBottom: 24,
          color: '#7db8ff', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          🚀 Join the Revolution
        </div>
        <h2 style={{
          fontSize: 'clamp(30px, 5vw, 52px)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          marginBottom: 16,
          lineHeight: 1.1,
        }}>
          Ready to play?
        </h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 17,
          marginBottom: 36,
          maxWidth: 480,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Create your free account in seconds. No credit card required.
          Join 50 million players today.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: 16, padding: '16px 40px' }}>
            Create Free Account
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg" style={{ fontSize: 16 }}>
            Sign In
          </Link>
        </div>
        {/* Platform icons */}
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center',
          color: 'var(--text-muted)', fontSize: 12,
        }}>
          {['💻 Browser', '📱 Mobile', '🖥️ Desktop'].map(p => (
            <span key={p} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '5px 14px',
              fontWeight: 600,
            }}>{p}</span>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#0066ff', '#ff6b00', '#00e676', '#ffab00'].map((c, i) => (
              <span key={i} style={{
                display: 'block', width: 8, height: 8,
                borderRadius: 2, backgroundColor: c,
              }} />
            ))}
          </div>
          <span style={{
            fontSize: 18, fontWeight: 900, letterSpacing: 2,
            background: 'linear-gradient(135deg, #0066ff, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>PLOR</span>
        </div>

        <div className="landing-footer-links">
          {['About', 'Careers', 'Blog', 'Support', 'Privacy', 'Terms'].map(link => (
            <a key={link} href="#">{link}</a>
          ))}
        </div>

        {/* Social icons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
          {['𝕏', '📘', '📺', '💬'].map((icon, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,102,255,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            >
              {icon}
            </div>
          ))}
        </div>

        <p>&copy; 2025 Plor. All rights reserved.</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .landing-nav-links { display: none !important; }
        }
      `}</style>
    </div>
  )
}
