import React, { useState, useEffect, useCallback } from 'react'
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
  white:   '#f1f5f9',
  gray:    '#94a3b8',
  muted:   '#475569',
}

const CATEGORIES = [
  { id: 'all',       label: 'All',        icon: '🎮' },
  { id: 'popular',   label: 'Popular',    icon: '🔥' },
  { id: 'adventure', label: 'Adventure',  icon: '⚔️' },
  { id: 'obby',      label: 'Obby',       icon: '🏃' },
  { id: 'roleplay',  label: 'Roleplay',   icon: '🎭' },
  { id: 'fighting',  label: 'Fighting',   icon: '🥊' },
  { id: 'simulator', label: 'Simulator',  icon: '🌍' },
  { id: 'racing',    label: 'Racing',     icon: '🏎️' },
]

const SORT_OPTIONS = [
  { id: 'popular',  label: 'Most Popular' },
  { id: 'newest',   label: 'Newest' },
  { id: 'rating',   label: 'Top Rated' },
]

const PAGE_SIZE = 16

/* ─── skeleton card ───────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 14,
      overflow: 'hidden',
      border: `1px solid ${C.border}`,
    }}>
      <div style={{
        height: 120,
        background: 'linear-gradient(90deg, #1e2a3a 25%, #253347 50%, #1e2a3a 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }} />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 14, width: '70%', borderRadius: 6, background: 'linear-gradient(90deg, #1e2a3a 25%, #253347 50%, #1e2a3a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: 11, width: '45%', borderRadius: 6, background: 'linear-gradient(90deg, #1e2a3a 25%, #253347 50%, #1e2a3a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: 32, borderRadius: 8,  background: 'linear-gradient(90deg, #1e2a3a 25%, #253347 50%, #1e2a3a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginTop: 4 }} />
      </div>
    </div>
  )
}

/* ─── category tab ────────────────────────────────────────── */
function CategoryTab({ cat, active, onClick }) {
  return (
    <button
      onClick={() => onClick(cat.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 24,
        border: active ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
        backgroundColor: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? C.blue : C.gray,
        fontWeight: active ? 700 : 500,
        fontSize: 14,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          e.currentTarget.style.color = C.white
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = C.border
          e.currentTarget.style.color = C.gray
        }
      }}
    >
      <span style={{ fontSize: 16 }}>{cat.icon}</span>
      {cat.label}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Games() {
  const { token } = useAuth()
  const [games, setGames]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('all')
  const [sortBy, setSortBy]         = useState('popular')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

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

    axios.get(`/api/games?${params}`, authHeaders)
      .then(r => {
        const data = r.data
        const list = data?.games || data || []
        setGames(list)
        const total = data?.total ?? list.length
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)))
      })
      .catch(err => {
        console.error('Failed to fetch games:', err)
        setError('Failed to load games. Please try again.')
        setGames([])
      })
      .finally(() => setLoading(false))
  }, [category, sortBy, page, search, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  /* reset to page 1 when filters change */
  useEffect(() => { setPage(1) }, [category, sortBy, search])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const handleCategoryChange = (cat) => {
    setCategory(cat)
    if (cat === 'popular') setSortBy('popular')
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', color: C.white }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #475569; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px' }}>

        {/* Page header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: 32, color: C.white }}>Games</h1>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 14 }}>
              Discover and play thousands of community-made games
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search games…"
              style={{
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 16px',
                color: C.white,
                fontSize: 14,
                outline: 'none',
                width: 240,
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = C.blue}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button
              type="submit"
              style={{
                backgroundColor: C.blue,
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = C.blue}
            >
              🔍
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput('') }}
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: C.gray,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Filters bar */}
        <div style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            flex: 1,
            scrollbarWidth: 'none',
            paddingBottom: 2,
          }}>
            {CATEGORIES.map(cat => (
              <CategoryTab
                key={cat.id}
                cat={cat}
                active={category === cat.id}
                onClick={handleCategoryChange}
              />
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                backgroundColor: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '7px 12px',
                color: C.white,
                fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active search label */}
        {search && (
          <div style={{ marginBottom: 16, color: C.gray, fontSize: 14 }}>
            Results for <strong style={{ color: C.white }}>"{search}"</strong>
            {games.length > 0 && ` — ${games.length} game${games.length !== 1 ? 's' : ''}`}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#f87171',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{error}</span>
            <button
              onClick={fetchGames}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 700 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Games grid */}
        {loading ? (
          <div style={gridStyle}>
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : games.length > 0 ? (
          <div style={gridStyle}>
            {games.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        ) : (
          <div style={{
            backgroundColor: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🕹️</div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              No games found
            </div>
            <div style={{ color: C.muted, marginBottom: 20 }}>
              {search
                ? `No games match "${search}". Try a different search.`
                : 'No games available in this category yet.'}
            </div>
            <button
              onClick={() => { setCategory('all'); setSearch(''); setSearchInput('') }}
              style={{
                backgroundColor: C.blue,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontWeight: 700,
                padding: '10px 24px',
                cursor: 'pointer',
              }}
            >
              Browse All Games
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 32,
          }}>
            <PageBtn
              label="← Prev"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            />

            {/* page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) => n === '…'
                ? <span key={`ellipsis-${i}`} style={{ color: C.muted, padding: '0 4px' }}>…</span>
                : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: n === page ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
                      backgroundColor: n === page ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: n === page ? C.blue : C.gray,
                      fontWeight: n === page ? 700 : 400,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {n}
                  </button>
                )
              )
            }

            <PageBtn
              label="Next →"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
  gap: 18,
}

function PageBtn({ label, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: `1px solid ${disabled ? 'rgba(30,42,58,0.5)' : C.border}`,
        backgroundColor: 'transparent',
        color: disabled ? C.muted : C.gray,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = C.blue }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.borderColor = C.border }}
    >
      {label}
    </button>
  )
}
