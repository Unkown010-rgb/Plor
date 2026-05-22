import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import GameCard from '../components/GameCard'
import FriendSearch from '../components/FriendSearch'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

/* ─── helpers ─────────────────────────────────────────────── */
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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ─── category config ─────────────────────────────────────── */
const CATEGORIES = [
  { key: 'adventure', label: 'Adventure', emoji: '⚔️', gradient: 'linear-gradient(135deg,#1d3a6e,#2563eb)', count: '2.4K' },
  { key: 'obby',      label: 'Obby',      emoji: '🏃', gradient: 'linear-gradient(135deg,#7c2d12,#ea580c)', count: '1.8K' },
  { key: 'roleplay',  label: 'Roleplay',  emoji: '🎭', gradient: 'linear-gradient(135deg,#4c1d95,#7c3aed)', count: '3.1K' },
  { key: 'fighting',  label: 'Fighting',  emoji: '🥊', gradient: 'linear-gradient(135deg,#7f1d1d,#dc2626)', count: '900' },
  { key: 'simulator', label: 'Simulator', emoji: '🌍', gradient: 'linear-gradient(135deg,#14532d,#16a34a)', count: '1.2K' },
  { key: 'racing',    label: 'Racing',    emoji: '🏎️', gradient: 'linear-gradient(135deg,#78350f,#d97706)', count: '640' },
]

/* ─── skeletons ───────────────────────────────────────────── */
function GameCardSkeleton({ width }) {
  return (
    <div style={{
      width: width || '100%', flexShrink: 0,
      background: 'var(--card-bg)', border: '1px solid var(--card-border)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 32, borderRadius: 8, marginTop: 4 }} />
      </div>
    </div>
  )
}

/* ─── section header ──────────────────────────────────────── */
function SectionHeader({ title, tag, linkTo }) {
  const navigate = useNavigate()
  return (
    <div className="home-section-header">
      <div className="home-section-title">
        {title}
        {tag && <span className="home-section-tag">{tag}</span>}
      </div>
      {linkTo && (
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(linkTo)}>
          See All →
        </button>
      )}
    </div>
  )
}

/* ─── featured spotlight ──────────────────────────────────── */
const CAT_GRADIENTS = {
  adventure: 'linear-gradient(135deg, #0a1a4a 0%, #1d4ed8 60%, #312e81 100%)',
  obby:      'linear-gradient(135deg, #3b0a00 0%, #c2410c 60%, #f97316 100%)',
  roleplay:  'linear-gradient(135deg, #2e1065 0%, #6d28d9 60%, #8b5cf6 100%)',
  fighting:  'linear-gradient(135deg, #450a0a 0%, #b91c1c 60%, #ef4444 100%)',
  simulator: 'linear-gradient(135deg, #052e16 0%, #15803d 60%, #22c55e 100%)',
  racing:    'linear-gradient(135deg, #431407 0%, #b45309 60%, #f59e0b 100%)',
  default:   'linear-gradient(135deg, #0a0a2e 0%, #0d1b8a 50%, #1d4ed8 100%)',
}

function FeaturedSpotlight({ game, onPlay }) {
  if (!game) return null
  const cat = (game.category || 'default').toLowerCase()
  const bg = CAT_GRADIENTS[cat] || CAT_GRADIENTS.default
  const icons = { adventure:'⚔️', obby:'🏃', roleplay:'🎭', fighting:'🥊', simulator:'🌍', racing:'🏎️', default:'🎮' }
  const icon = icons[cat] || icons.default

  return (
    <div className="featured-spotlight" style={{ background: bg }} onClick={onPlay}>
      {/* Decorative bokeh circles */}
      <div style={{ position:'absolute', top:'-40px', right:'60px', width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'30px', right:'200px', width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-20px', left:'30%', width:300, height:300, borderRadius:'50%', background:'rgba(0,0,0,0.2)', pointerEvents:'none' }} />

      {/* Game icon centered */}
      <div style={{
        position:'absolute', top:'50%', right:'15%', transform:'translateY(-60%)',
        fontSize:96, opacity:0.25, filter:'blur(2px)', pointerEvents:'none', userSelect:'none',
      }}>
        {icon}
      </div>
      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)',
        fontSize:120, filter:'drop-shadow(0 12px 40px rgba(0,0,0,0.6))',
        pointerEvents:'none', userSelect:'none', zIndex:1,
      }}>
        {icon}
      </div>

      <div className="featured-spotlight-gradient" />

      <div className="featured-spotlight-content">
        <div>
          <div className="featured-spotlight-badge">
            ⭐ Featured Game
          </div>
          <div className="featured-spotlight-title">{game.title || 'Untitled Game'}</div>
          <div className="featured-spotlight-meta">
            <span className="live-badge">
              <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--success)', display:'inline-block', animation:'pulse-glow 2s infinite' }} />
              {formatNum(game.players_online || 0)} playing now
            </span>
            <span style={{ color:'var(--text-muted)', fontSize:12 }}>
              🎮 {formatNum(game.plays || 0)} total plays
            </span>
            {game.rating > 0 && (
              <span style={{ color:'#ffab00', fontSize:12 }}>★ {Number(game.rating).toFixed(1)}</span>
            )}
          </div>
        </div>
        <button className="featured-spotlight-play" onClick={onPlay}>
          ▶ Play Now
        </button>
      </div>
    </div>
  )
}

/* ─── friend row ──────────────────────────────────────────── */
function FriendRow({ friend, onClick }) {
  return (
    <div className="friend-row" onClick={onClick}>
      <div className="friend-avatar">
        <div className="friend-avatar-circle" style={{ background: avatarColor(friend.username || '') }}>
          {(friend.username || 'U')[0].toUpperCase()}
        </div>
        {friend.online && <div className="friend-online-dot" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="friend-name">{friend.display_name || friend.username}</div>
        <div className={`friend-status ${friend.online ? 'online' : ''}`}>
          {friend.online ? (friend.current_game ? `Playing ${friend.current_game}` : 'Online') : 'Offline'}
        </div>
      </div>
    </div>
  )
}

/* ─── empty state ─────────────────────────────────────────── */
function EmptyState({ label, onBrowse }) {
  return (
    <div className="card" style={{ padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🎮</div>
      <div style={{ color:'var(--text-muted)', marginBottom:16 }}>No {label} found</div>
      <button className="btn btn-primary btn-sm" onClick={onBrowse}>Browse All Games</button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [featuredGames,    setFeaturedGames]    = useState([])
  const [popularGames,     setPopularGames]     = useState([])
  const [recentGames,      setRecentGames]      = useState([])
  const [friends,          setFriends]          = useState([])
  const [stats,            setStats]            = useState({ coins: 0, friendsOnline: 0, gamesPlayed: 0 })
  const [loadingFeatured,  setLoadingFeatured]  = useState(true)
  const [loadingPopular,   setLoadingPopular]   = useState(true)
  const [showFriendSearch, setShowFriendSearch] = useState(false)

  const hdrs = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    // Featured games
    axios.get('/api/games?featured=true&limit=8', hdrs)
      .then(r => setFeaturedGames(r.data?.games || r.data || []))
      .catch(() => setFeaturedGames([]))
      .finally(() => setLoadingFeatured(false))

    // Popular / trending games
    axios.get('/api/games?sort=popular&limit=12', hdrs)
      .then(r => setPopularGames(r.data?.games || r.data || []))
      .catch(() => setPopularGames([]))
      .finally(() => setLoadingPopular(false))

    // Recently played (fallback: localStorage IDs)
    axios.get('/api/users/me/recent-games', hdrs)
      .then(r => setRecentGames(r.data?.games || r.data || []))
      .catch(() => {
        // Try to load from localStorage
        try {
          const ids = JSON.parse(localStorage.getItem('plor_recent_games') || '[]')
          if (ids.length > 0) {
            setRecentGames(ids.map(id => ({ id, title: 'Recent Game', category: 'default' })))
          }
        } catch { /* noop */ }
      })

    // Friends list
    axios.get('/api/friends', hdrs)
      .then(r => {
        const list = r.data?.friends || r.data || []
        setFriends(list)
        setStats(prev => ({ ...prev, friendsOnline: list.filter(f => f.online).length }))
      })
      .catch(() => setFriends([]))

    // User stats
    if (user) {
      setStats(prev => ({
        ...prev,
        coins:       user.robux_balance ?? user.coins ?? 0,
        gamesPlayed: user.games_played  ?? 0,
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = user?.display_name || user?.username || 'Player'
  const greeting    = getGreeting()
  const avatarBg    = avatarColor(user?.username || '')

  const spotlightGame = featuredGames[0] || null
  const trendingGames = popularGames.slice(0, 8)
  const gridGames     = popularGames.slice(0, 12)

  // Pick 3 random games for quick play (from popular list)
  const quickPlayGames = popularGames.length >= 3
    ? popularGames.slice(0, 3)
    : popularGames.slice(0, Math.min(3, popularGames.length))

  const handleSpotlightPlay = useCallback(() => {
    if (spotlightGame?.id) navigate(`/game/${spotlightGame.id}`)
  }, [spotlightGame, navigate])

  return (
    <div style={{ background: 'var(--dark-900)', minHeight: '100vh', paddingTop: 'var(--navbar-h)' }}>
      <Navbar />

      {/* ── Sidebar + Main layout ──────────────────────────────── */}
      <div style={{
        maxWidth: 1360, margin: '0 auto', padding: '28px 20px',
        display: 'flex', gap: 24, alignItems: 'flex-start',
      }}>

        {/* ══ MAIN CONTENT ═══════════════════════════════════════ */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 40 }}>

          {/* ── 1. Greeting bar ──────────────────────────────── */}
          <div className="greeting-bar" style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              position: 'relative', zIndex: 1, flexWrap: 'wrap',
            }}>
              {/* Avatar */}
              <div className="greeting-avatar" style={{ background: avatarBg }}>
                {(user?.username || 'P')[0].toUpperCase()}
              </div>

              {/* Greeting text */}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 2 }}>
                  {greeting},
                </div>
                <div style={{
                  fontSize: 30, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.5px',
                  background: 'linear-gradient(90deg, #fff 30%, #93c5fd 80%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {displayName} 👋
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 5 }}>
                  Ready to jump into a new world?
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
                <div className="greeting-quick-stat">
                  <span className="qs-icon">💰</span>
                  <div>
                    <div className="qs-value" style={{ color: 'var(--robux-gold)' }}>{formatNum(stats.coins)}</div>
                    <div className="qs-label">Coins</div>
                  </div>
                </div>
                <div className="greeting-quick-stat">
                  <span className="qs-icon">👥</span>
                  <div>
                    <div className="qs-value" style={{ color: 'var(--success)' }}>{formatNum(stats.friendsOnline)}</div>
                    <div className="qs-label">Online</div>
                  </div>
                </div>
                <div className="greeting-quick-stat">
                  <span className="qs-icon">🎮</span>
                  <div>
                    <div className="qs-value">{formatNum(stats.gamesPlayed)}</div>
                    <div className="qs-label">Played</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                className="btn btn-primary"
                onClick={() => navigate('/games')}
                style={{ flexShrink: 0 }}
              >
                Browse Games
              </button>
            </div>
          </div>

          {/* ── 2. Featured spotlight ──────────────────────────── */}
          {!loadingFeatured && spotlightGame && (
            <section style={{ animation: 'fadeIn 0.5s ease 0.1s both' }}>
              <SectionHeader title="Featured" tag="SPOTLIGHT" />
              <FeaturedSpotlight game={spotlightGame} onPlay={handleSpotlightPlay} />
            </section>
          )}
          {loadingFeatured && (
            <div className="skeleton" style={{ borderRadius: 20, aspectRatio: '21/9' }} />
          )}

          {/* ── 3. Continue Playing ────────────────────────────── */}
          {recentGames.length > 0 && (
            <section style={{ animation: 'fadeIn 0.5s ease 0.15s both' }}>
              <SectionHeader title="Continue Playing" tag="RECENT" />
              <div className="h-scroll-row">
                {recentGames.slice(0, 6).map(g => (
                  <div key={g.id} style={{ width: 210, flexShrink: 0 }}>
                    <GameCard game={g} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 4. Trending Now ────────────────────────────────── */}
          <section style={{ animation: 'fadeIn 0.5s ease 0.2s both' }}>
            <SectionHeader title="Trending Now" tag="HOT" linkTo="/games?sort=popular" />
            {loadingPopular ? (
              <div className="h-scroll-row">
                {Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} width={210} />)}
              </div>
            ) : trendingGames.length > 0 ? (
              <div className="h-scroll-row">
                {trendingGames.map(g => (
                  <div key={g.id} style={{ width: 210, flexShrink: 0 }}>
                    <GameCard game={g} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="trending games" onBrowse={() => navigate('/games')} />
            )}
          </section>

          {/* ── 5. Explore Categories ──────────────────────────── */}
          <section style={{ animation: 'fadeIn 0.5s ease 0.25s both' }}>
            <SectionHeader title="Explore Categories" />
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <div
                  key={cat.key}
                  className="category-pill"
                  style={{ background: cat.gradient }}
                  onClick={() => navigate(`/games?category=${cat.key}`)}
                >
                  <span className="cat-emoji">{cat.emoji}</span>
                  <div className="cat-name">{cat.label}</div>
                  <div className="cat-count">{cat.count} games</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. Popular Games grid ──────────────────────────── */}
          <section style={{ animation: 'fadeIn 0.5s ease 0.3s both' }}>
            <SectionHeader title="Popular Games" tag="TOP PICKS" linkTo="/games?sort=popular" />
            {loadingPopular ? (
              <div className="games-grid">
                {Array.from({ length: 8 }).map((_, i) => <GameCardSkeleton key={i} />)}
              </div>
            ) : gridGames.length > 0 ? (
              <div className="games-grid">
                {gridGames.map(g => <GameCard key={g.id} game={g} />)}
              </div>
            ) : (
              <EmptyState label="popular games" onBrowse={() => navigate('/games')} />
            )}
          </section>
        </main>

        {/* ══ SIDEBAR ════════════════════════════════════════════ */}
        <aside style={{
          width: 280, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 16,
        }} className="home-sidebar">
          <style>{`
            .home-sidebar { }
            @media (max-width: 900px) { .home-sidebar { display: none !important; } }
          `}</style>

          {/* ── Friends panel ──────────────────────────────── */}
          <div className="home-sidebar-card" style={{ animation: 'fadeIn 0.5s ease 0.35s both' }}>
            <div className="home-sidebar-header">
              <span className="home-sidebar-title">Friends</span>
              {friends.length > 0 && (
                <span style={{
                  background: 'rgba(0,230,118,0.12)', color: 'var(--success)',
                  borderRadius: 20, padding: '2px 9px', fontSize: 12, fontWeight: 700,
                  border: '1px solid rgba(0,230,118,0.2)',
                }}>
                  {friends.filter(f => f.online).length} online
                </span>
              )}
            </div>

            {friends.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
                  No friends yet.<br />Start adding players!
                </div>
                <button
                  className="btn btn-primary btn-sm btn-full"
                  onClick={() => setShowFriendSearch(true)}
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {/* Online friends first */}
                  {[...friends]
                    .sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0))
                    .slice(0, 10)
                    .map(f => (
                      <FriendRow
                        key={f.id || f.username}
                        friend={f}
                        onClick={() => navigate(`/profile/${f.username}`)}
                      />
                    ))
                  }
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    className="btn btn-secondary btn-sm btn-full"
                    onClick={() => setShowFriendSearch(true)}
                  >
                    + Find Friends
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Quick Play ─────────────────────────────────── */}
          {quickPlayGames.length > 0 && (
            <div className="home-sidebar-card" style={{ animation: 'fadeIn 0.5s ease 0.45s both' }}>
              <div className="home-sidebar-header">
                <span className="home-sidebar-title">Quick Play</span>
              </div>
              <div style={{ padding: '12px 12px 6px' }}>
                {quickPlayGames.map(g => {
                  const cat = (g.category || 'default').toLowerCase()
                  const icons = { adventure:'⚔️', obby:'🏃', roleplay:'🎭', fighting:'🥊', simulator:'🌍', racing:'🏎️', default:'🎮' }
                  const icon = icons[cat] || icons.default
                  return (
                    <button
                      key={g.id}
                      className="quick-play-btn"
                      onClick={() => g.id && navigate(`/game/${g.id}`)}
                    >
                      <div className="quick-play-icon">{icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="quick-play-title">{g.title || 'Untitled'}</div>
                        <div className="quick-play-sub">
                          {formatNum(g.players_online || 0)} playing
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>▶</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Discover more ──────────────────────────────── */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0a1535 0%, #12103a 100%)',
              border: '1px solid rgba(0,102,255,0.2)',
              borderRadius: 16, padding: '20px 18px', cursor: 'pointer',
              transition: 'all 0.2s', animation: 'fadeIn 0.5s ease 0.55s both',
              position: 'relative', overflow: 'hidden',
            }}
            onClick={() => navigate('/games')}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.45)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:'rgba(124,58,237,0.12)', pointerEvents:'none' }} />
            <div style={{ fontSize: 28, marginBottom: 8 }}>🚀</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 4 }}>
              Discover More Games
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Browse thousands of user-created worlds across every genre.
            </div>
            <div style={{
              marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: '#5599ff',
            }}>
              Explore all →
            </div>
          </div>
        </aside>
      </div>

      {/* ── FriendSearch modal ──────────────────────────────────── */}
      {showFriendSearch && (
        <FriendSearch onClose={() => setShowFriendSearch(false)} />
      )}
    </div>
  )
}
