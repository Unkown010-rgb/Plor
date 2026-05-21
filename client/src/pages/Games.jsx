import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import GameCard from '../components/GameCard'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

const CATEGORIES = [
  { id: 'all',       label: 'All',       icon: '🎮' },
  { id: 'popular',   label: 'Popular',   icon: '🔥' },
  { id: 'adventure', label: 'Adventure', icon: '⚔️' },
  { id: 'obby',      label: 'Obby',      icon: '🏃' },
  { id: 'roleplay',  label: 'Roleplay',  icon: '🎭' },
  { id: 'fighting',  label: 'Fighting',  icon: '🥊' },
  { id: 'simulator', label: 'Simulator', icon: '🌍' },
  { id: 'racing',    label: 'Racing',    icon: '🏎️' },
]

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest',  label: 'Newest' },
  { id: 'rating',  label: 'Top Rated' },
]

const PAGE_SIZE = 16

/* ─── skeleton card ───────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{
        height: 120,
        background: 'linear-gradient(90deg, #1e2a42 25%, #26334f 50%, #1e2a42 75%)',
        backgroundSize: '200% 100%',
        animation: 'skel-shimmer 1.4s infinite',
      }} />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, width: '65%', borderRadius: 6, background: 'linear-gradient(90deg, #1e2a42 25%, #26334f 50%, #1e2a42 75%)', backgroundSize: '200% 100%', animation: 'skel-shimmer 1.4s infinite' }} />
        <div style={{ height: 11, width: '40%', borderRadius: 6, background: 'linear-gradient(90deg, #1e2a42 25%, #26334f 50%, #1e2a42 75%)', backgroundSize: '200% 100%', animation: 'skel-shimmer 1.4s infinite' }} />
        <div style={{ height: 32, borderRadius: 8,  background: 'linear-gradient(90deg, #1e2a42 25%, #26334f 50%, #1e2a42 75%)', backgroundSize: '200% 100%', animation: 'skel-shimmer 1.4s infinite', marginTop: 4 }} />
      </div>
    </div>
  )
}

/* ─── category tab ────────────────────────────────────────── */
function CatTab({ cat, active, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={() => onClick(cat.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 24, flexShrink: 0,
        border: active
          ? '1px solid var(--primary)'
          : hover ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)',
        backgroundColor: active
          ? 'rgba(0,162,255,0.15)'
          : hover ? 'rgba(255,255,255,0.05)' : 'transparent',
        color: active ? 'var(--primary)' : hover ? '#fff' : 'var(--text-muted)',
        fontWeight: active ? 700 : 500,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 14 }}>{cat.icon}</span>
      {cat.label}
    </button>
  )
}

/* ─── pagination button ───────────────────────────────────── */
function PageBtn({ label, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn btn-secondary btn-sm"
      style={{ opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {label}
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

  const hdrs = { headers: { Authorization: `Bearer ${token}` } }

  const fetchGames = useCallback(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, sort: sortBy })
    if (category !== 'all' && category !== 'popular') params.set('category', category)
    if (category === 'popular') params.set('sort', 'popular')
    if (search) params.set('search', search)

    axios.get(`/api/games?${params}`, hdrs)
      .then(r => {
        const data = r.data
        const list = data?.games || data || []
        setGames(list)
        const total = data?.total ?? list.length
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
      })
      .catch(err => {
        console.error('Games fetch error:', err)
        setError('Failed to load games.')
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
    <div className="page-wrapper" style={{ backgroundColor: 'var(--dark)' }}>
      <style>{`
        @keyframes skel-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .games-grid { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
      `}</style>

      <Navbar />

      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>

        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 28, gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: 32, color: '#fff' }}>Games</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Discover and play thousands of community-made games
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="form-input-wrapper" style={{ width: 240 }}>
              <input
                className="form-input"
                style={{ height: 40, paddingRight: 40, borderRadius: 24 }}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search games…"
              />
              <span className="form-input-icon" style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={handleSearch}>🔍</span>
            </div>
            {search && (
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setSearchInput('') }}>
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 8, flex: 1,
              overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2,
            }}>
              {CATEGORIES.map(cat => (
                <CatTab
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

            {/* Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sort:</span>
              <select
                className="form-select"
                style={{ height: 36, width: 'auto', minWidth: 130, fontSize: 13 }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Active search label */}
        {search && !loading && (
          <div style={{ marginBottom: 14, color: 'var(--text-muted)', fontSize: 14 }}>
            Results for <strong style={{ color: '#fff' }}>"{search}"</strong>
            {games.length > 0 && ` — ${games.length} game${games.length !== 1 ? 's' : ''}`}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <span>{error}</span>
            <button
              onClick={fetchGames}
              style={{ marginLeft: 'auto', background: 'none', border: 'none',
                color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
            >
              Retry
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
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🕹️</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              No games found
            </div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              {search
                ? `No games match "${search}". Try a different search.`
                : 'No games available in this category yet.'}
            </div>
            <button
              className="btn btn-primary btn-sm"
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
            gap: 8, marginTop: 32, flexWrap: 'wrap',
          }}>
            <PageBtn label="← Prev" disabled={page === 1} onClick={() => setPage(p => p - 1)} />

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '…'
                  ? <span key={`e${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                  : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 36, height: 36, borderRadius: 8, fontSize: 14,
                        border: n === page ? '1px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: n === page ? 'rgba(0,162,255,0.15)' : 'transparent',
                        color: n === page ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: n === page ? 700 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {n}
                    </button>
                  )
              )
            }

            <PageBtn label="Next →" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
          </div>
        )}
      </div>
    </div>
  )
}
