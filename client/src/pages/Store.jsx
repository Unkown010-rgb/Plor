import React, { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

/* ─── Static mock data (rendered instantly; API calls supplement) ─── */
const MOCK_ITEMS = [
  { id: 1,  name: 'Neon Visor',        category: 'Hats',        rarity: 'Rare',     price: 250,  icon: '🕶️',  description: 'A sleek neon-lit visor from the future.' },
  { id: 2,  name: 'Pixel Crown',       category: 'Hats',        rarity: 'Epic',     price: 1200, icon: '👑',  description: 'An 8-bit crown forged in the pixel realm.' },
  { id: 3,  name: 'Happy Face',        category: 'Faces',       rarity: 'Common',   price: 50,   icon: '😊',  description: 'A cheerful face for every occasion.' },
  { id: 4,  name: 'Cool Shades',       category: 'Faces',       rarity: 'Uncommon', price: 120,  icon: '😎',  description: 'Look effortlessly cool wherever you go.' },
  { id: 5,  name: 'Dragon Sword',      category: 'Accessories', rarity: 'Epic',     price: 2500, icon: '⚔️',  description: 'A legendary blade said to slay dragons.' },
  { id: 6,  name: 'Magic Staff',       category: 'Accessories', rarity: 'Rare',     price: 800,  icon: '🪄',  description: 'Channel arcane forces with this mystical staff.' },
  { id: 7,  name: 'Classic Tee',       category: 'Clothing',    rarity: 'Common',   price: 30,   icon: '👕',  description: 'A timeless shirt for your avatar.' },
  { id: 8,  name: 'Space Jacket',      category: 'Clothing',    rarity: 'Uncommon', price: 180,  icon: '🥼',  description: 'Designed for interstellar adventures.' },
  { id: 9,  name: 'Ninja Hood',        category: 'Hats',        rarity: 'Uncommon', price: 150,  icon: '🥷',  description: 'Move in silence with this shinobi hood.' },
  { id: 10, name: 'Golden Wings',      category: 'Accessories', rarity: 'Epic',     price: 5000, icon: '🦋',  description: 'Ascend beyond mortal limits.' },
  { id: 11, name: 'Wizard Hat',        category: 'Hats',        rarity: 'Rare',     price: 400,  icon: '🧙',  description: 'Cast spells in style.' },
  { id: 12, name: 'Flame Mask',        category: 'Faces',       rarity: 'Epic',     price: 1800, icon: '🔥',  description: 'Your face is literally on fire.' },
  { id: 13, name: 'Camo Pants',        category: 'Clothing',    rarity: 'Common',   price: 45,   icon: '👖',  description: 'Blend into any jungle.' },
  { id: 14, name: 'Rainbow Scarf',     category: 'Accessories', rarity: 'Uncommon', price: 200,  icon: '🌈',  description: 'Wear every color at once.' },
  { id: 15, name: 'Cyber Helmet',      category: 'Hats',        rarity: 'Rare',     price: 600,  icon: '⛑️',  description: 'Head protection from the year 2100.' },
  { id: 16, name: 'Angel Wings',       category: 'Accessories', rarity: 'Rare',     price: 900,  icon: '😇',  description: 'Soar above the competition.' },
]

const MOCK_GAMEPASSES = [
  { id: 'gp1', name: 'Speed Boost',     game: 'Obby Madness',  price: 100,  icon: '⚡', benefits: ['2x movement speed', 'Faster jumping', 'Special trail effect'] },
  { id: 'gp2', name: 'VIP Access',      game: 'Tycoon World',  price: 300,  icon: '🏆', benefits: ['Exclusive VIP room', 'Daily coin bonus', 'Special VIP badge'] },
  { id: 'gp3', name: 'Double XP',       game: 'Battle Arena',  price: 250,  icon: '✨', benefits: ['2x XP gain', 'Faster leveling', 'Exclusive title'] },
  { id: 'gp4', name: 'Mega Builder',    game: 'Build World',   price: 500,  icon: '🏗️', benefits: ['Unlimited blocks', 'Rare building materials', 'Builder title'] },
  { id: 'gp5', name: 'Pet Companion',   game: 'Pet Simulator', price: 200,  icon: '🐾', benefits: ['Rare starter pet', '2x pet XP', 'Exclusive pet skin'] },
  { id: 'gp6', name: 'Infinite Lives',  game: 'Obby Madness',  price: 150,  icon: '♾️', benefits: ['Never run out of lives', 'Checkpoints saved', 'Ghost mode'] },
]

const FEATURED_IDS = [5, 10, 2, 12, 6, 16]

const CATEGORIES = [
  { id: 'all',        label: 'All Items',   icon: '🛒' },
  { id: 'Featured',   label: 'Featured',    icon: '⭐' },
  { id: 'Hats',       label: 'Hats',        icon: '🎩' },
  { id: 'Faces',      label: 'Faces',       icon: '😊' },
  { id: 'Accessories',label: 'Accessories', icon: '⚔️' },
  { id: 'Clothing',   label: 'Clothing',    icon: '👕' },
  { id: 'Gamepasses', label: 'Gamepasses',  icon: '⭐' },
  { id: 'Bundles',    label: 'Bundles',     icon: '📦' },
]

const RARITY_CONFIG = {
  Common:   { color: '#8888aa', gradient: 'linear-gradient(135deg,#3a3a55,#28283e)', glow: 'rgba(136,136,170,0.3)', badge: '#8888aa' },
  Uncommon: { color: '#00d084', gradient: 'linear-gradient(135deg,#003a22,#00281a)', glow: 'rgba(0,208,132,0.3)',   badge: '#00d084' },
  Rare:     { color: '#00a2ff', gradient: 'linear-gradient(135deg,#003660,#001f40)', glow: 'rgba(0,162,255,0.35)', badge: '#00a2ff' },
  Epic:     { color: '#a855f7', gradient: 'linear-gradient(135deg,#2d0a5a,#1a0a3a)', glow: 'rgba(168,85,247,0.4)', badge: '#a855f7' },
}

/* ─── Small helper components ─── */

function RarityBadge({ rarity }) {
  const cfg = RARITY_CONFIG[rarity] || RARITY_CONFIG.Common
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: '#fff', backgroundColor: cfg.badge, padding: '2px 8px', borderRadius: 20,
      whiteSpace: 'nowrap',
    }}>
      {rarity}
    </span>
  )
}

function CoinIcon({ size = 14 }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#ffcc00,#ff9900)',
      fontSize: size * 0.6, lineHeight: 1, flexShrink: 0,
    }}>
      ✦
    </span>
  )
}

/* ─── Item card ─── */
function ItemCard({ item, onBuy, featured = false }) {
  const cfg = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.Common
  const isEpic = item.rarity === 'Epic'

  return (
    <div
      onClick={() => onBuy(item)}
      style={{
        background: cfg.gradient,
        border: `1.5px solid ${isEpic ? 'rgba(168,85,247,0.6)' : 'rgba(46,46,82,0.8)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        position: 'relative',
        ...(featured ? { minWidth: 180, flexShrink: 0 } : {}),
      }}
      className="store-item-card"
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
        e.currentTarget.style.boxShadow = `0 16px 40px ${cfg.glow}`
        e.currentTarget.style.borderColor = cfg.color
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = isEpic ? 'rgba(168,85,247,0.6)' : 'rgba(46,46,82,0.8)'
      }}
    >
      {/* Epic shimmer overlay */}
      {isEpic && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'linear-gradient(120deg,transparent 30%,rgba(168,85,247,0.07) 50%,transparent 70%)',
          animation: 'shimmer 2.5s linear infinite',
        }} />
      )}

      {/* Thumbnail */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: featured ? 120 : 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: featured ? 52 : 44,
        background: 'rgba(0,0,0,0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {item.icon}
        {/* Glow ring behind icon */}
        <div style={{
          position: 'absolute', width: 64, height: 64, borderRadius: '50%',
          background: cfg.glow, filter: 'blur(20px)', zIndex: -1,
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: featured ? '12px 14px' : '10px 12px', position: 'relative', zIndex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <RarityBadge rarity={item.rarity} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, fontSize: 13, color: '#ffcc00' }}>
            <CoinIcon size={13} />
            {item.price.toLocaleString()}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onBuy(item) }}
          style={{
            marginTop: 8, width: '100%', padding: '7px 0',
            background: 'linear-gradient(135deg,var(--primary),#0077dd)',
            border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700,
            fontSize: 12, cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,162,255,0.3)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Buy
        </button>
      </div>
    </div>
  )
}

/* ─── Purchase modal ─── */
function PurchaseModal({ item, onClose, onConfirm, balance, purchasing, success }) {
  const canAfford = balance >= item.price
  const cfg = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.Common

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card-bg)',
        border: `1.5px solid ${cfg.color}44`,
        borderRadius: 20,
        padding: '32px 28px',
        width: '100%', maxWidth: 420,
        boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 0 40px ${cfg.glow}`,
        animation: 'modal-in 0.2s ease',
        position: 'relative',
      }}>
        {success ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 72, marginBottom: 16, animation: 'bounce-in 0.4s ease' }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: 'var(--success)' }}>
              Purchase Successful!
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              <strong style={{ color: 'var(--text)' }}>{item.name}</strong> has been added to your inventory.
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 24, padding: '10px 32px',
                background: 'linear-gradient(135deg,var(--success),#009960)',
                border: 'none', borderRadius: 10, color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Awesome!
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.08)', border: 'none',
                borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 88, height: 88, borderRadius: 16, margin: '0 auto 14px',
                background: cfg.gradient,
                border: `2px solid ${cfg.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 46,
                boxShadow: `0 8px 24px ${cfg.glow}`,
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{item.name}</div>
              <RarityBadge rarity={item.rarity} />
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {item.description}
              </div>
            </div>

            {/* Price row */}
            <div style={{
              background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.2)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Price</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, fontSize: 18, color: '#ffcc00' }}>
                <CoinIcon size={18} />
                {item.price.toLocaleString()}
              </span>
            </div>

            {/* Balance row */}
            <div style={{
              background: canAfford ? 'rgba(0,208,132,0.08)' : 'rgba(255,59,48,0.08)',
              border: `1px solid ${canAfford ? 'rgba(0,208,132,0.25)' : 'rgba(255,59,48,0.25)'}`,
              borderRadius: 10, padding: '10px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Your balance</span>
              <span style={{ fontWeight: 700, color: canAfford ? 'var(--success)' : 'var(--danger)' }}>
                {balance.toLocaleString()} Plor Coins
              </span>
            </div>

            {!canAfford && (
              <div style={{
                background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: '#ff6b6b', textAlign: 'center',
              }}>
                ⚠️ You need {(item.price - balance).toLocaleString()} more Plor Coins.{' '}
                <a href="/robux" style={{ color: 'var(--primary)', fontWeight: 700 }}>Get more</a>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px 0',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, color: 'var(--text)',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!canAfford || purchasing}
                style={{
                  flex: 2, padding: '11px 0',
                  background: canAfford
                    ? 'linear-gradient(135deg,var(--primary),#0077dd)'
                    : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 10,
                  color: canAfford ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 14,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  boxShadow: canAfford ? '0 4px 16px rgba(0,162,255,0.35)' : 'none',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (canAfford) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { if (canAfford) e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {purchasing ? (
                  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : null}
                {purchasing ? 'Purchasing…' : 'Confirm Purchase'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Main Store component ─── */
export default function Store() {
  const { user, token, updateUser } = useAuth()

  const [items, setItems] = useState(MOCK_ITEMS)
  const [gamepasses, setGamepasses] = useState(MOCK_GAMEPASSES)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [priceFilter, setPriceFilter] = useState('any')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [sort, setSort] = useState('featured')

  const [selectedItem, setSelectedItem] = useState(null)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const balance = user?.robux_balance ?? user?.robux ?? user?.coins ?? 0

  /* Fetch from API (non-blocking – mock data already shown) */
  useEffect(() => {
    async function fetchItems() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const [itemsRes, gpRes] = await Promise.all([
          fetch('/api/store/items', { headers }),
          fetch('/api/store/gamepasses', { headers }),
        ])
        if (itemsRes.ok) {
          const data = await itemsRes.json()
          if (Array.isArray(data) && data.length) setItems(data)
        }
        if (gpRes.ok) {
          const data = await gpRes.json()
          if (Array.isArray(data) && data.length) setGamepasses(data)
        }
      } catch {
        /* Silently fall back to mock data */
      }
    }
    fetchItems()
  }, [token])

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimerRef.current)
    setToast({ msg, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 3500)
  }, [])

  /* Filtered + sorted items */
  const filteredItems = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    if (category === 'Featured') return FEATURED_IDS.includes(item.id)
    if (category !== 'all' && category !== 'Gamepasses' && category !== 'Bundles') {
      if (item.category !== category) return false
    }
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false
    if (priceFilter === 'under100' && item.price >= 100) return false
    if (priceFilter === '100-500' && (item.price < 100 || item.price > 500)) return false
    if (priceFilter === '500+' && item.price <= 500) return false
    return true
  }).sort((a, b) => {
    if (sort === 'price-asc')  return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    if (sort === 'newest')     return b.id - a.id
    return 0 // best-selling / featured default
  })

  const featuredItems = items.filter(i => FEATURED_IDS.includes(i.id))

  const handleBuy = useCallback((item) => {
    setSelectedItem(item)
    setPurchaseSuccess(false)
  }, [])

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedItem) return
    setPurchasing(true)
    try {
      let bought = false
      if (token) {
        const res = await fetch('/api/store/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ itemId: selectedItem.id }),
        })
        if (res.ok) {
          const data = await res.json()
          bought = true
          if (data.newBalance !== undefined && user) {
            updateUser({ ...user, robux_balance: data.newBalance, coins: data.newBalance })
          }
        }
      }
      if (!bought && user) {
        // Optimistic local deduction (demo mode)
        const newBal = balance - selectedItem.price
        updateUser({ ...user, robux_balance: newBal, coins: newBal })
      }
      setPurchaseSuccess(true)
    } catch {
      showToast('Purchase failed. Please try again.', 'error')
      setSelectedItem(null)
    } finally {
      setPurchasing(false)
    }
  }, [selectedItem, token, user, balance, updateUser, showToast])

  return (
    <>
      {/* Keyframe injections */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes bounce-in {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes featured-shimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .store-item-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .featured-scroll::-webkit-scrollbar { height: 4px; }
        .featured-scroll::-webkit-scrollbar-track { background: transparent; }
        .featured-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .sidebar-cat-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .sidebar-cat-btn.active-cat { background: rgba(0,162,255,0.12) !important; border-color: rgba(0,162,255,0.4) !important; color: var(--primary) !important; }
      `}</style>

      <Navbar />

      <div className="page-wrapper" style={{ background: 'radial-gradient(ellipse at 20% 10%, rgba(0,80,180,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(120,30,220,0.1) 0%, transparent 50%), var(--dark)' }}>

        {/* ── Page header ── */}
        <div style={{ borderBottom: '1px solid var(--border)', background: 'rgba(30,30,58,0.5)', backdropFilter: 'blur(8px)', padding: '28px 0 24px' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 32 }}>🛒</span>
                  <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, background: 'linear-gradient(135deg,var(--primary),#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    Catalog
                  </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                  Browse thousands of items for your avatar
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.25)', borderRadius: 12, padding: '10px 16px' }}>
                <CoinIcon size={20} />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Balance</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#ffcc00' }}>{Number(balance).toLocaleString()} Plor</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '28px 20px' }}>

          {/* ── Featured strip ── */}
          {category === 'all' && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>✨</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Featured Items</h2>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  background: 'linear-gradient(135deg,#ffaa00,#ff6b35)',
                  color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>HOT</span>
              </div>
              <div
                className="featured-scroll"
                style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}
              >
                {featuredItems.map(item => (
                  <div key={item.id} style={{ position: 'relative' }}>
                    {/* Gold shimmer border wrapper */}
                    <div style={{
                      padding: 2, borderRadius: 16,
                      background: 'linear-gradient(120deg,#ffaa00,#ff6b35,#a855f7,#00a2ff,#ffaa00)',
                      backgroundSize: '200% 200%',
                      animation: 'featured-shimmer 3s linear infinite',
                    }}>
                      <ItemCard item={item} onBuy={handleBuy} featured />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Main 2-column layout ── */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            {/* ── Sidebar ── */}
            <aside style={{
              width: 220, flexShrink: 0, position: 'sticky', top: 'calc(var(--navbar-h) + 16px)',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 36, height: 40, fontSize: 13 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
              </div>

              {/* Categories */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>
                  Categories
                </div>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`sidebar-cat-btn${category === cat.id ? ' active-cat' : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '9px 14px', background: 'none', border: 'none',
                      borderLeft: '2px solid transparent',
                      color: category === cat.id ? 'var(--primary)' : 'var(--text)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Price filter */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>
                  Price
                </div>
                {[
                  { value: 'any',     label: 'Any Price' },
                  { value: 'under100',label: 'Under 100' },
                  { value: '100-500', label: '100 – 500' },
                  { value: '500+',    label: '500+' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPriceFilter(opt.value)}
                    className={`sidebar-cat-btn${priceFilter === opt.value ? ' active-cat' : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '9px 14px', background: 'none', border: 'none',
                      borderLeft: '2px solid transparent',
                      color: priceFilter === opt.value ? 'var(--primary)' : 'var(--text)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Rarity filter */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>
                  Rarity
                </div>
                {['all', 'Common', 'Uncommon', 'Rare', 'Epic'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRarityFilter(r)}
                    className={`sidebar-cat-btn${rarityFilter === r ? ' active-cat' : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '9px 14px', background: 'none', border: 'none',
                      borderLeft: '2px solid transparent',
                      color: rarityFilter === r ? 'var(--primary)' : 'var(--text)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {r !== 'all' && (
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: RARITY_CONFIG[r]?.badge, flexShrink: 0,
                      }} />
                    )}
                    {r === 'all' ? 'All Rarities' : r}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>
                  Sort By
                </div>
                {[
                  { value: 'featured',   label: 'Best Selling' },
                  { value: 'newest',     label: 'Newest' },
                  { value: 'price-asc',  label: 'Price: Low to High' },
                  { value: 'price-desc', label: 'Price: High to Low' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`sidebar-cat-btn${sort === opt.value ? ' active-cat' : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '9px 14px', background: 'none', border: 'none',
                      borderLeft: '2px solid transparent',
                      color: sort === opt.value ? 'var(--primary)' : 'var(--text)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </aside>

            {/* ── Items grid ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Result count + active filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                </span>
                {search && (
                  <span style={{ fontSize: 12, background: 'rgba(0,162,255,0.12)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                    "{search}" ✕
                  </span>
                )}
              </div>

              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>No items found</div>
                  <div style={{ fontSize: 13 }}>Try adjusting your filters or search term.</div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 14,
                }}>
                  {filteredItems.map(item => (
                    <ItemCard key={item.id} item={item} onBuy={handleBuy} />
                  ))}
                </div>
              )}

              {/* ── Gamepasses section ── */}
              {(category === 'all' || category === 'Gamepasses') && (
                <div style={{ marginTop: 48 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: 22 }}>⭐</span>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Game Passes</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {gamepasses.map(gp => (
                      <div
                        key={gp.id}
                        style={{
                          background: 'linear-gradient(135deg,#1a1040,#0a1a40)',
                          border: '1.5px solid rgba(168,85,247,0.25)',
                          borderRadius: 14, padding: 20, cursor: 'pointer',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-3px)'
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(168,85,247,0.25)'
                          e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                          e.currentTarget.style.borderColor = 'rgba(168,85,247,0.25)'
                        }}
                        onClick={() => handleBuy({ ...gp, rarity: 'Rare', description: `Game pass for ${gp.game}. Includes: ${gp.benefits.join(', ')}.`, icon: gp.icon })}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{
                            width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                            background: 'linear-gradient(135deg,#2d0a5a,#1a0a3a)',
                            border: '1.5px solid rgba(168,85,247,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 26,
                          }}>
                            {gp.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gp.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{gp.game}</div>
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          {gp.benefits.map((b, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                              <span style={{ color: 'var(--success)', fontSize: 10 }}>✓</span>
                              {b}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, fontSize: 16, color: '#ffcc00' }}>
                            <CoinIcon size={16} />
                            {gp.price.toLocaleString()}
                          </div>
                          <button
                            style={{
                              padding: '7px 18px',
                              background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                              border: 'none', borderRadius: 8, color: '#fff',
                              fontWeight: 700, fontSize: 12, cursor: 'pointer',
                              boxShadow: '0 2px 10px rgba(168,85,247,0.4)',
                            }}
                          >
                            Get Pass
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Purchase modal ── */}
      {selectedItem && (
        <PurchaseModal
          item={selectedItem}
          balance={balance}
          purchasing={purchasing}
          success={purchaseSuccess}
          onClose={() => { setSelectedItem(null); setPurchaseSuccess(false) }}
          onConfirm={handleConfirmPurchase}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            {toast.msg}
          </div>
        </div>
      )}
    </>
  )
}
