import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import GameCard from '../components/GameCard'
import { useAuth } from '../contexts/AuthContext'

/* ─── palette ─────────────────────────────────────────────── */
const C = {
  bg:      '#060d1a',
  surface: '#0d1526',
  card:    '#111827',
  border:  '#1e2a3a',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  green:   '#22c55e',
  yellow:  '#facc15',
  white:   '#f1f5f9',
  gray:    '#94a3b8',
  muted:   '#475569',
}

/* ─── helpers ─────────────────────────────────────────────── */
function avatarColor(username) {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4']
  if (!username) return colors[0]
  return colors[username.charCodeAt(0) % colors.length]
}

function formatNum(n) {
  if (!n && n !== 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

/* ─── skeleton ────────────────────────────────────────────── */
function Skeleton({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #1e2a3a 25%, #253347 50%, #1e2a3a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  )
}

function CardSkeleton() {
  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${C.border}`,
    }}>
      <Skeleton height={120} radius={0} />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={11} width="50%" />
        <Skeleton height={32} radius={8} style={{ marginTop: 4 }} />
      </div>
    </div>
  )
}

/* ─── stat card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      backgroundColor: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: color + '1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: C.white, fontWeight: 800, fontSize: 22, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

/* ─── section header ──────────────────────────────────────── */
function SectionHeader({ title, linkTo, linkLabel = 'See All' }) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ color: C.white, fontWeight: 800, fontSize: 20, margin: 0 }}>{title}</h2>
      {linkTo && (
        <button
          onClick={() => navigate(linkTo)}
          style={{
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            color: C.blue,
            fontSize: 13,
            fontWeight: 600,
            padding: '5px 14px',
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          {linkLabel} →
        </button>
      )}
    </div>
  )
}

/* ─── horizontal scroll ───────────────────────────────────── */
function HorizontalScroll({ children }) {
  const ref = useRef(null)
  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={ref}
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.border} transparent`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ─── friend card ─────────────────────────────────────────── */
function FriendItem({ friend }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/profile/${friend.username}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          backgroundColor: avatarColor(friend.username),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: 15,
        }}>
          {(friend.username || 'U')[0].toUpperCase()}
        </div>
        {friend.online && (
          <div style={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: C.green,
            border: `2px solid ${C.card}`,
          }} />
        )}
      </div>
      <div>
        <div style={{ color: C.white, fontWeight: 600, fontSize: 13 }}>{friend.username}</div>
        <div style={{ color: friend.online ? C.green : C.muted, fontSize: 11 }}>
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
  const [popularGames, setPopularGames]   = useState([])
  const [recentGames, setRecentGames]     = useState([])
  const [friends, setFriends]             = useState([])
  const [stats, setStats]                 = useState({ coins: 0, friendsOnline: 0, gamesPlayed: 0 })
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [loadingPopular, setLoadingPopular]   = useState(true)

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    /* featured games */
    axios.get('/api/games?featured=true&limit=6', authHeaders)
      .then(r => setFeaturedGames(r.data?.games || r.data || []))
      .catch(() => setFeaturedGames([]))
      .finally(() => setLoadingFeatured(false))

    /* popular games */
    axios.get('/api/games?sort=popular&limit=12', authHeaders)
      .then(r => setPopularGames(r.data?.games || r.data || []))
      .catch(() => setPopularGames([]))
      .finally(() => setLoadingPopular(false))

    /* recent / continue playing */
    axios.get('/api/users/me/recent-games', authHeaders)
      .then(r => setRecentGames(r.data?.games || r.data || []))
      .catch(() => setRecentGames([]))

    /* friends */
    axios.get('/api/friends', authHeaders)
      .then(r => {
        const list = r.data?.friends || r.data || []
        setFriends(list)
        setStats(prev => ({ ...prev, friendsOnline: list.filter(f => f.online).length }))
      })
      .catch(() => setFriends([]))

    /* user stats */
    if (user) {
      setStats(prev => ({
        ...prev,
        coins: user.robux_balance ?? user.coins ?? 0,
        gamesPlayed: user.games_played ?? 0,
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', color: C.white }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px', display: 'flex', gap: 24 }}>

        {/* ── Main content ──────────────────────────────── */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* Welcome banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0f2044 0%, #1a1040 50%, #0d1f3a 100%)',
            borderRadius: 18,
            padding: '28px 32px',
            border: `1px solid rgba(59,130,246,0.2)`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* decorative blobs */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            }} />
            <div style={{
              position: 'absolute', bottom: -20, left: 100,
              width: 150, height: 150, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
              {/* Avatar */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: avatarColor(user?.username),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 28,
                border: '3px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}>
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: C.gray, fontSize: 14, marginBottom: 4 }}>Welcome back,</div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 900,
                  background: 'linear-gradient(90deg, #f1f5f9, #93c5fd)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {user?.display_name || user?.username || 'Player'}!
                </div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                  Ready to explore new worlds?
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={() => navigate('/games')}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    padding: '12px 24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🎮 Browse Games
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatCard icon="💰" label="Plor Coins"      value={formatNum(stats.coins)}          color={C.yellow}  />
            <StatCard icon="👥" label="Friends Online"  value={formatNum(stats.friendsOnline)}   color={C.green}   />
            <StatCard icon="🎮" label="Games Played"    value={formatNum(stats.gamesPlayed)}     color={C.blue}    />
          </div>

          {/* Continue Playing */}
          {recentGames.length > 0 && (
            <section>
              <SectionHeader title="Continue Playing" />
              <HorizontalScroll>
                {recentGames.slice(0, 6).map(g => (
                  <div key={g.id} style={{ flexShrink: 0, width: 200 }}>
                    <GameCard game={g} />
                  </div>
                ))}
              </HorizontalScroll>
            </section>
          )}

          {/* Featured Games */}
          <section>
            <SectionHeader title="⭐ Featured Games" linkTo="/games" />
            {loadingFeatured ? (
              <HorizontalScroll>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ flexShrink: 0, width: 200 }}>
                    <CardSkeleton />
                  </div>
                ))}
              </HorizontalScroll>
            ) : featuredGames.length > 0 ? (
              <HorizontalScroll>
                {featuredGames.slice(0, 6).map(g => (
                  <div key={g.id} style={{ flexShrink: 0, width: 200 }}>
                    <GameCard game={g} />
                  </div>
                ))}
              </HorizontalScroll>
            ) : (
              <EmptyGamesState label="featured games" navigate={navigate} />
            )}
          </section>

          {/* Popular Games */}
          <section>
            <SectionHeader title="🔥 Popular Games" linkTo="/games?sort=popular" />
            {loadingPopular ? (
              <div style={gridStyle}>
                {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : popularGames.length > 0 ? (
              <div style={gridStyle}>
                {popularGames.slice(0, 12).map(g => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            ) : (
              <EmptyGamesState label="popular games" navigate={navigate} />
            )}
          </section>

        </main>

        {/* ── Sidebar ────────────────────────────────────── */}
        <aside style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }} className="plor-sidebar">
          <style>{`
            @media (max-width: 900px) { .plor-sidebar { display: none !important; } }
          `}</style>

          {/* Friends */}
          <div style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ margin: 0, color: C.white, fontWeight: 700, fontSize: 15 }}>
                👥 Your Friends
              </h3>
              {friends.length > 0 && (
                <span style={{
                  backgroundColor: C.green + '22',
                  color: C.green,
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {friends.filter(f => f.online).length} online
                </span>
              )}
            </div>
            <div>
              {friends.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👋</div>
                  <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
                    No friends yet — meet new players!
                  </div>
                  <button
                    onClick={() => navigate('/games')}
                    style={{
                      backgroundColor: C.blue,
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
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
          </div>

          {/* Quick links */}
          <div style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 16,
          }}>
            <h3 style={{ margin: '0 0 12px', color: C.white, fontWeight: 700, fontSize: 15 }}>
              Quick Links
            </h3>
            {[
              { icon: '🎮', label: 'All Games',       path: '/games' },
              { icon: '👤', label: 'My Profile',      path: `/profile/${user?.username}` },
              { icon: '🧑‍🎤', label: 'Edit Avatar',    path: '/avatar' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.gray,
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 2,
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = C.white
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = C.gray
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

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 16,
}

function EmptyGamesState({ label, navigate }) {
  return (
    <div style={{
      backgroundColor: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '40px 20px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
      <div style={{ color: C.muted, marginBottom: 16 }}>No {label} found</div>
      <button
        onClick={() => navigate('/games')}
        style={{
          backgroundColor: C.blue,
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontWeight: 700,
          padding: '10px 20px',
          cursor: 'pointer',
        }}
      >
        Browse All Games
      </button>
    </div>
  )
}
