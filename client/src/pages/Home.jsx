import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import GameCard from '../components/GameCard'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

/* ─── avatar color (matches Navbar) ──────────────────────── */
function avatarColor(str = '') {
  const palette = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
    '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
    '#00bcd4', '#ff5722', '#8bc34a', '#673ab7',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function formatNum(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

/* ─── skeleton ────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="card" style={{ minWidth: 200, flexShrink: 0 }}>
      <div className="skel" style={{ height: 120, borderRadius: 0 }} />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skel" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="skel" style={{ height: 11, width: '50%', borderRadius: 6 }} />
        <div className="skel" style={{ height: 32, borderRadius: 8, marginTop: 4 }} />
      </div>
      <style>{`
        .skel {
          background: linear-gradient(90deg, #1e2a42 25%, #26334f 50%, #1e2a42 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.4s infinite;
        }
        @keyframes skel-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}

/* ─── stat card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 130,
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        backgroundColor: accent + '22',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{value}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

/* ─── section header ──────────────────────────────────────── */
function SectionHeader({ title, linkTo }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
      {linkTo && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(linkTo)}
        >
          See All →
        </button>
      )}
    </div>
  )
}

/* ─── horizontal scroll ───────────────────────────────────── */
function HScroll({ children }) {
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      overflowX: 'auto',
      paddingBottom: 8,
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--border) transparent',
    }}>
      {children}
    </div>
  )
}

/* ─── friend item ─────────────────────────────────────────── */
function FriendItem({ friend }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/profile/${friend.username}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          backgroundColor: avatarColor(friend.username),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 15,
        }}>
          {(friend.username || 'U')[0].toUpperCase()}
        </div>
        {friend.online && (
          <div style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: 'var(--success)',
            border: '2px solid var(--card-bg)',
          }} />
        )}
      </div>
      <div>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{friend.username}</div>
        <div style={{ color: friend.online ? 'var(--success)' : 'var(--text-muted)', fontSize: 11 }}>
          {friend.online ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [featuredGames, setFeaturedGames] = useState([])
  const [popularGames,  setPopularGames]  = useState([])
  const [recentGames,   setRecentGames]   = useState([])
  const [friends,       setFriends]       = useState([])
  const [stats, setStats] = useState({ coins: 0, friendsOnline: 0, gamesPlayed: 0 })
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingPopular,  setLoadingPopular]  = useState(true)

  const hdrs = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    axios.get('/api/games?featured=true&limit=6', hdrs)
      .then(r => setFeaturedGames(r.data?.games || r.data || []))
      .catch(() => setFeaturedGames([]))
      .finally(() => setLoadingFeatured(false))

    axios.get('/api/games?sort=popular&limit=12', hdrs)
      .then(r => setPopularGames(r.data?.games || r.data || []))
      .catch(() => setPopularGames([]))
      .finally(() => setLoadingPopular(false))

    axios.get('/api/users/me/recent-games', hdrs)
      .then(r => setRecentGames(r.data?.games || r.data || []))
      .catch(() => setRecentGames([]))

    axios.get('/api/friends', hdrs)
      .then(r => {
        const list = r.data?.friends || r.data || []
        setFriends(list)
        setStats(prev => ({ ...prev, friendsOnline: list.filter(f => f.online).length }))
      })
      .catch(() => setFriends([]))

    if (user) {
      setStats(prev => ({
        ...prev,
        coins:       user.robux_balance ?? user.coins ?? 0,
        gamesPlayed: user.games_played  ?? 0,
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const username = user?.display_name || user?.username || 'Player'

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--dark)' }}>
      <Navbar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px', display: 'flex', gap: 24 }}>

        {/* ── Main ──────────────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* Welcome banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0f1e40 0%, #180f38 50%, #0c1d38 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 32px',
            border: '1px solid rgba(0,162,255,0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 220, height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: 120, width: 160, height: 160,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,162,255,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                backgroundColor: avatarColor(user?.username || ''),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 28,
                border: '3px solid rgba(255,255,255,0.15)',
              }}>
                {(user?.username || 'P')[0].toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 3 }}>Welcome back,</div>
                <div style={{
                  fontSize: 28, fontWeight: 900, lineHeight: 1.1,
                  background: 'linear-gradient(90deg, #fff, #93c5fd)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {username}!
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  Ready to explore new worlds today?
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => navigate('/games')}
                style={{ flexShrink: 0 }}
              >
                🎮 Browse Games
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <StatCard icon="⭐" label="Plor Coins"     value={formatNum(stats.coins)}         accent="#ffaa00" />
            <StatCard icon="👥" label="Friends Online" value={formatNum(stats.friendsOnline)}  accent="#00d084" />
            <StatCard icon="🎮" label="Games Played"   value={formatNum(stats.gamesPlayed)}    accent="#00a2ff" />
          </div>

          {/* Continue Playing */}
          {recentGames.length > 0 && (
            <section>
              <SectionHeader title="▶ Continue Playing" />
              <HScroll>
                {recentGames.slice(0, 6).map(g => (
                  <div key={g.id} style={{ width: 200, flexShrink: 0 }}>
                    <GameCard game={g} />
                  </div>
                ))}
              </HScroll>
            </section>
          )}

          {/* Featured Games */}
          <section>
            <SectionHeader title="⭐ Featured Games" linkTo="/games" />
            {loadingFeatured ? (
              <HScroll>
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </HScroll>
            ) : featuredGames.length > 0 ? (
              <HScroll>
                {featuredGames.slice(0, 6).map(g => (
                  <div key={g.id} style={{ width: 200, flexShrink: 0 }}>
                    <GameCard game={g} />
                  </div>
                ))}
              </HScroll>
            ) : (
              <EmptyState label="featured games" onBrowse={() => navigate('/games')} />
            )}
          </section>

          {/* Popular Games */}
          <section>
            <SectionHeader title="🔥 Popular Games" linkTo="/games?sort=popular" />
            {loadingPopular ? (
              <div className="games-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card" style={{ overflow: 'hidden' }}>
                    <div className="skel" style={{ height: 120, borderRadius: 0 }} />
                    <div style={{ padding: 12 }}>
                      <div className="skel" style={{ height: 14, width: '65%', borderRadius: 6, marginBottom: 8 }} />
                      <div className="skel" style={{ height: 32, borderRadius: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : popularGames.length > 0 ? (
              <div className="games-grid">
                {popularGames.slice(0, 12).map(g => <GameCard key={g.id} game={g} />)}
              </div>
            ) : (
              <EmptyState label="popular games" onBrowse={() => navigate('/games')} />
            )}
          </section>
        </main>

        {/* ── Sidebar ────────────────────────────────────── */}
        <aside style={{ width: 252, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 18 }}
          className="home-sidebar"
        >
          <style>{`.home-sidebar { } @media(max-width:900px){ .home-sidebar{display:none!important} }`}</style>

          {/* Friends panel */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 15 }}>
                👥 Your Friends
              </h3>
              {friends.length > 0 && (
                <span style={{
                  background: 'rgba(0,208,132,0.15)', color: 'var(--success)',
                  borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700,
                }}>
                  {friends.filter(f => f.online).length} online
                </span>
              )}
            </div>

            {friends.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
                  No friends yet — meet new players!
                </div>
                <button className="btn btn-primary btn-sm btn-full" onClick={() => navigate('/games')}>
                  Find Friends
                </button>
              </div>
            ) : (
              <div style={{ padding: '6px 0', maxHeight: 300, overflowY: 'auto' }}>
                {friends.slice(0, 10).map(f => (
                  <FriendItem key={f.id || f.username} friend={f} />
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', color: '#fff', fontWeight: 700, fontSize: 15 }}>
              Quick Links
            </h3>
            {[
              { icon: '🎮', label: 'All Games',    path: '/games' },
              { icon: '👤', label: 'My Profile',   path: `/profile/${user?.username}` },
              { icon: '🧑‍🎤', label: 'Edit Avatar', path: '/avatar' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
                  marginBottom: 2, transition: 'all 0.15s', textAlign: 'left',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function EmptyState({ label, onBrowse }) {
  return (
    <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
      <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No {label} found</div>
      <button className="btn btn-primary btn-sm" onClick={onBrowse}>Browse All Games</button>
    </div>
  )
}
