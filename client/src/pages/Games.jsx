import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import GameCard from '../components/GameCard'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

const CATEGORIES = [
  { id: 'all',       label: 'All Games',  icon: '🎮' },
  { id: 'popular',   label: 'Popular',    icon: '🔥' },
  { id: 'adventure', label: 'Adventure',  icon: '⚔️' },
  { id: 'obby',      label: 'Obby',       icon: '🏃' },
  { id: 'roleplay',  label: 'Roleplay',   icon: '🎭' },
  { id: 'fighting',  label: 'Fighting',   icon: '🥊' },
  { id: 'simulator', label: 'Simulator',  icon: '🌍' },
  { id: 'racing',    label: 'Racing',     icon: '🏎️' },
]

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest',  label: 'Newest First' },
  { id: 'rating',  label: 'Top Rated' },
]

const PAGE_SIZE = 16

/* ── Shimmer skeleton card ───────────────────────────────── */
function CardSkeleton() {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* Thumb skeleton */}
      <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9' }} />
      {/* Info skeletons */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '45%', borderRadius: 6 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 28, width: '32%', borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}

/* ── Category pill ───────────────────────────────────────── */
function CatPill({ cat, active, onClick }) {
  return (
    <button
      onClick={() => onClick(cat.id)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 18px',
        borderRadius: 24,
        flexShrink: 0,
        border: active
          ? '1px solid rgba(0,102,255,0.55)'
          : '1px solid rgba(255,255,255,0.08)',
        background: active
          ? 'rgba(0,102,255,0.15)'
          : 'rgba(255,255,255,0.04)',
        color: active ? '#7db8ff' : 'var(--text-muted)',
        fontWeight: active ? 700 : 500,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.color = '#fff'
          e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-muted)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        }
      }}
    >
      <span style={{ fontSize: 15 }}>{cat.icon}</span>
      {cat.label}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Games() {
  const { token } = useAuth()
  const [games, setGames]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory]       = useState('all')
  const [sortBy, setSortBy]           = useState('popular')
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [totalCount, setTotalCount]   = useState(0)

  const hdrs = { headers: { Authorization: `Bearer ${token}` } }

  const fetchGames = useCallback(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      sort: sortBy,
    })
    if (category !== 'all' && category !== 'popular') params.set('category', category)
    if (category === 'popular') params.set('sort', 'popular')
    if (search) params.set('search', search)

    axios.get(`/api/games?${params}`, hdrs)
      .then(r => {
        const data = r.data
        const list = data?.games || data || []
        setGames(list)
        const total = data?.total ?? list.length
        setTotalCount(total)
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
      })
      .catch(err => {
        console.error('Games fetch error:', err)
        setError('Failed to load games. Please try again.')
        setGames([])
      })
      .finally(() => setLoading(false))
  }, [category, sortBy, page, search, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchGames() }, [fetchGames])
  useEffect(() => { setPage(1) }, [category, sortBy, search])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  return (
    <div className="page-wrapper">
      <style>{`
        @keyframes skel-shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
      `}</style>
      <Navbar />

      {/* ── Hero banner with search ──────────────────── */}
      <div style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 50%, rgba(0,66,204,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 80% 30%, rgba(124,58,237,0.15) 0%, transparent 50%),
          var(--dark-800)
        `,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '52px 0 44px',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,102,255,0.1)',
              border: '1px solid rgba(0,102,255,0.25)',
              borderRadius: 20, padding: '6px 16px',
              color: '#7db8ff', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 18,
            }}>
              🎮 Game Library
            </div>
            <h1 style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#fff',
              lineHeight: 1.1,
              marginBottom: 12,
            }}>
              Discover Your Next<br />
              <span style={{
                background: 'var(--blue-gradient)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Favorite Game
              </span>
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 15,
              maxWidth: 480,
              margin: '0 auto',
            }}>
              Browse millions of community-created experiences
            </p>
          </div>

          {/* Embedded search bar */}
          <form
            onSubmit={handleSearch}
            style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}
          >
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 18, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18, color: 'var(--text-muted)',
                pointerEvents: 'none', zIndex: 1,
              }}>🔍</span>
              <input
                className="form-input"
                style={{
                  height: 52, paddingLeft: 50, paddingRight: search ? 120 : 60,
                  borderRadius: 28, fontSize: 15,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search games, genres, creators..."
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSearchInput('') }}
                  style={{
                    position: 'absolute', right: 80, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    fontSize: 16, padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{
                  position: 'absolute', right: 8, top: '50%',
                  transform: 'translateY(-50%)',
                  borderRadius: 22, padding: '8px 20px', fontSize: 13,
                }}
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>

        {/* ── Category pills + sort ────────────────────── */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 16,
          padding: '14px 18px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* Scrollable category pills */}
          <div style={{
            display: 'flex', gap: 8, flex: 1, minWidth: 0,
            overflowX: 'auto', scrollbarWidth: 'none',
            paddingBottom: 2,
          }}>
            {CATEGORIES.map(cat => (
              <CatPill
                key={cat.id}
                cat={cat}
                active={category === cat.id}
                onClick={(id) => {
                  setCategory(id)
                  if (id === 'popular') setSortBy('popular')
                }}
              />
            ))}
          </div>

          {/* Sort dropdown */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)',
            paddingLeft: 16,
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>Sort:</span>
            <select
              className="form-select"
              style={{ height: 36, width: 'auto', minWidth: 138, fontSize: 13 }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Count / search label */}
        {!loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 22,
          }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {search
                ? <>Results for <strong style={{ color: '#fff' }}>"{search}"</strong> — <strong style={{ color: '#fff' }}>{totalCount}</strong> game{totalCount !== 1 ? 's' : ''} found</>
                : <><strong style={{ color: '#fff' }}>{totalCount}</strong> games in {CATEGORIES.find(c => c.id === category)?.label || 'All'}</>
              }
            </div>
            {search && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setSearchInput(''); setCategory('all') }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            <span>⚠️ {error}</span>
            <button
              onClick={fetchGames}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'inherit', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}
            >
              Retry →
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="games-grid">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : games.length > 0 ? (
          <div className="games-grid">
            {games.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        ) : (
          /* Empty state */
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 20,
            padding: '72px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'rgba(0,102,255,0.1)',
              border: '1px solid rgba(0,102,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 24px',
            }}>
              🕹️
            </div>
            <div style={{
              color: '#fff', fontWeight: 800, fontSize: 20, marginBottom: 10,
              letterSpacing: '-0.02em',
            }}>
              No games found
            </div>
            <div style={{
              color: 'var(--text-muted)', marginBottom: 28, fontSize: 14,
              maxWidth: 340, margin: '0 auto 28px',
            }}>
              {search
                ? `No games match "${search}". Try a different search term or category.`
                : 'No games are available in this category yet. Check back soon!'}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { setCategory('all'); setSearch(''); setSearchInput('') }}
            >
              Browse All Games
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 6, marginTop: 40, flexWrap: 'wrap',
          }}>
            {/* Prev */}
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="btn btn-secondary btn-sm"
              style={{ opacity: page === 1 ? 0.4 : 1, gap: 4 }}
            >
              ← Prev
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px', fontSize: 14 }}>…</span>
                  : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 38, height: 38,
                        borderRadius: 10,
                        fontSize: 13, fontWeight: n === page ? 700 : 500,
                        border: n === page
                          ? '1px solid rgba(0,102,255,0.5)'
                          : '1px solid rgba(255,255,255,0.07)',
                        background: n === page
                          ? 'rgba(0,102,255,0.18)'
                          : 'rgba(255,255,255,0.03)',
                        color: n === page ? '#7db8ff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                      }}
                      onMouseEnter={e => {
                        if (n !== page) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                          e.currentTarget.style.color = '#fff'
                        }
                      }}
                      onMouseLeave={e => {
                        if (n !== page) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                          e.currentTarget.style.color = 'var(--text-muted)'
                        }
                      }}
                    >
                      {n}
                    </button>
                  )
              )
            }

            {/* Next */}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="btn btn-secondary btn-sm"
              style={{ opacity: page === totalPages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
