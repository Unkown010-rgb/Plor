import React, { useState, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import '../styles/global.css'

/* ─── Package data ─── */
const PACKAGES = [
  {
    id: 'pkg_400',
    coins: 400,
    bonus: null,
    price: '$4.99',
    priceNum: 4.99,
    gradient: 'linear-gradient(135deg,#0044aa,#0088ff)',
    glow: 'rgba(0,136,255,0.35)',
    icon: '💎',
    bestValue: false,
  },
  {
    id: 'pkg_800',
    coins: 800,
    bonus: '+10% Bonus!',
    price: '$9.99',
    priceNum: 9.99,
    gradient: 'linear-gradient(135deg,#0055cc,#2288ff)',
    glow: 'rgba(34,136,255,0.35)',
    icon: '💎',
    bestValue: false,
  },
  {
    id: 'pkg_1700',
    coins: 1700,
    bonus: '+25% Bonus!',
    price: '$19.99',
    priceNum: 19.99,
    gradient: 'linear-gradient(135deg,#1a00cc,#7700ff)',
    glow: 'rgba(119,0,255,0.4)',
    icon: '🔷',
    bestValue: true,
  },
  {
    id: 'pkg_4500',
    coins: 4500,
    bonus: '+50% Bonus!',
    price: '$49.99',
    priceNum: 49.99,
    gradient: 'linear-gradient(135deg,#5500cc,#a855f7)',
    glow: 'rgba(168,85,247,0.45)',
    icon: '🌟',
    bestValue: false,
  },
  {
    id: 'pkg_10000',
    coins: 10000,
    bonus: '+100% Bonus!',
    price: '$99.99',
    priceNum: 99.99,
    gradient: 'linear-gradient(135deg,#aa0066,#ff4499)',
    glow: 'rgba(255,68,153,0.45)',
    icon: '👑',
    bestValue: false,
  },
]

const FEATURES = [
  { icon: '⭐', title: 'Buy Gamepasses', desc: 'Unlock special abilities, VIP rooms, and game-exclusive perks with Plor Coins.' },
  { icon: '🎩', title: 'Get Avatar Items', desc: 'Deck out your character with rare hats, faces, accessories, and epic gear.' },
  { icon: '🔓', title: 'Unlock Premium Features', desc: 'Access exclusive content, early releases, and premium platform features.' },
]

const PREMIUM_BENEFITS = [
  { icon: '🪙', text: '450 Plor Coins monthly stipend' },
  { icon: '💰', text: '10% bonus on all Coin purchases' },
  { icon: '🏅', text: 'Premium badge on your profile' },
  { icon: '🎁', text: 'Access to exclusive catalog items' },
  { icon: '⚡', text: 'Early access to new features' },
]

/* ─── Animated coin component ─── */
function AnimatedCoin() {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
      <style>{`
        @keyframes coin-spin {
          0%   { transform: rotateY(0deg)   scale(1); }
          25%  { transform: rotateY(90deg)  scale(0.85); }
          50%  { transform: rotateY(180deg) scale(1); }
          75%  { transform: rotateY(270deg) scale(0.85); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        @keyframes coin-glow-pulse {
          0%,100% { box-shadow: 0 0 30px 8px rgba(255,204,0,0.4),  0 0 60px 16px rgba(255,153,0,0.2); }
          50%      { box-shadow: 0 0 50px 16px rgba(255,204,0,0.7), 0 0 90px 28px rgba(255,153,0,0.35); }
        }
        @keyframes orbit-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes coin-bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes shimmer-badge {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pkg-hover-glow {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes float-particle {
          0%   { transform: translateY(0)    rotate(0deg);   opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(-80px) rotate(360deg); opacity: 0; }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.9) translateY(16px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>

      {/* Orbit ring */}
      <div style={{
        position: 'absolute', width: 130, height: 130, borderRadius: '50%',
        border: '2px dashed rgba(255,204,0,0.25)',
        animation: 'orbit-ring 8s linear infinite',
      }} />

      {/* Main coin */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'conic-gradient(from 0deg,#ffcc00,#ff9900,#ffcc00,#ffdd44,#ff9900,#ffcc00)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44,
        animation: 'coin-bounce 2s ease-in-out infinite, coin-glow-pulse 2s ease-in-out infinite',
        position: 'relative', zIndex: 2,
        boxShadow: '0 0 30px 8px rgba(255,204,0,0.4)',
      }}>
        ✦
      </div>
    </div>
  )
}

/* ─── Package card ─── */
function PackageCard({ pkg, onBuy }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        position: 'relative',
        padding: 2,
        borderRadius: 18,
        background: hovered
          ? `linear-gradient(135deg,${pkg.gradient.match(/#[\w]+/g)?.[0] ?? '#007fff'},${pkg.gradient.match(/#[\w]+/g)?.[1] ?? '#8800ff'})`
          : 'var(--border)',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 16px 48px ${pkg.glow}` : 'none',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: pkg.gradient,
        borderRadius: 16,
        padding: '28px 20px 24px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)',
          backgroundSize: '200% 100%',
          animation: hovered ? 'shimmer-badge 1.5s linear infinite' : 'none',
        }} />

        {/* Best value badge */}
        {pkg.bestValue && (
          <div style={{
            position: 'absolute', top: -1, right: 20,
            background: 'linear-gradient(135deg,#ffcc00,#ff9900)',
            color: '#000', fontSize: 10, fontWeight: 900,
            padding: '5px 14px', borderRadius: '0 0 10px 10px',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            boxShadow: '0 4px 12px rgba(255,204,0,0.5)',
            zIndex: 2,
          }}>
            Best Value ⭐
          </div>
        )}

        {/* Coin icon */}
        <div style={{ fontSize: 52, marginBottom: 10, lineHeight: 1, position: 'relative', zIndex: 1 }}>
          {pkg.icon}
        </div>

        {/* Coin amount */}
        <div style={{
          fontSize: 40, fontWeight: 900, lineHeight: 1, marginBottom: 4,
          color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.4)',
          position: 'relative', zIndex: 1,
        }}>
          {pkg.coins.toLocaleString()}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12, fontWeight: 600, position: 'relative', zIndex: 1 }}>
          Plor Coins
        </div>

        {/* Bonus badge */}
        {pkg.bonus && (
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 20, padding: '3px 12px',
            fontSize: 12, fontWeight: 800,
            color: '#fff', marginBottom: 16,
            position: 'relative', zIndex: 1,
          }}>
            🎁 {pkg.bonus}
          </div>
        )}
        {!pkg.bonus && <div style={{ marginBottom: 16 }} />}

        {/* Price */}
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          {pkg.price}
        </div>

        {/* Buy button */}
        <button
          onClick={() => onBuy(pkg)}
          style={{
            width: '100%', padding: '12px 0',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            borderRadius: 10, color: '#fff', fontWeight: 800,
            fontSize: 15, cursor: 'pointer',
            transition: 'background 0.15s, transform 0.15s',
            position: 'relative', zIndex: 1,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  )
}

/* ─── Toast ─── */
function Toast({ message, onDone }) {
  return (
    <div className="toast-container">
      <div className="toast toast-info" style={{ minWidth: 320, fontSize: 14 }}>
        <span style={{ fontSize: 20 }}>🚀</span>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Coming Soon!</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{message}</div>
        </div>
        <button
          onClick={onDone}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/* ─── Main Robux page ─── */
export default function Robux() {
  const [toast, setToast] = useState(false)
  const timerRef = useRef(null)

  const handleBuy = useCallback(() => {
    clearTimeout(timerRef.current)
    setToast(true)
    timerRef.current = setTimeout(() => setToast(false), 5000)
  }, [])

  return (
    <>
      <style>{`
        @keyframes coin-bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes coin-glow-pulse {
          0%,100% { box-shadow: 0 0 30px 8px rgba(255,204,0,0.4),  0 0 60px 16px rgba(255,153,0,0.2); }
          50%      { box-shadow: 0 0 50px 16px rgba(255,204,0,0.7), 0 0 90px 28px rgba(255,153,0,0.35); }
        }
        @keyframes orbit-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer-badge {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes hero-gradient {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes float-up {
          0%   { transform: translateY(0) scale(1);    opacity: 0.8; }
          100% { transform: translateY(-40px) scale(0); opacity: 0; }
        }
        .pkg-card-wrap { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .feature-card-inner:hover { border-color: var(--primary) !important; transform: translateY(-4px) !important; box-shadow: 0 16px 40px rgba(0,162,255,0.15) !important; }
      `}</style>

      <Navbar />

      <div className="page-wrapper" style={{ background: 'var(--dark)' }}>

        {/* ── Hero section ── */}
        <div style={{
          background: 'linear-gradient(135deg,#0a0a1a 0%,#0d0030 40%,#0a1a40 70%,#0a0a1a 100%)',
          backgroundSize: '300% 300%',
          animation: 'hero-gradient 8s ease infinite',
          padding: '56px 20px 64px',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative glows */}
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,204,0,0.04)', filter: 'blur(80px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 600, height: 300, borderRadius: '50%', background: 'rgba(0,100,255,0.06)', filter: 'blur(100px)', top: 0, left: '20%', pointerEvents: 'none' }} />

          {/* Coin icon */}
          <div style={{ marginBottom: 24, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
            <AnimatedCoin />
          </div>

          <h1 style={{
            fontSize: 'clamp(32px,6vw,56px)', fontWeight: 900, lineHeight: 1.1,
            margin: '0 auto 12px', maxWidth: 600,
            background: 'linear-gradient(135deg,#ffcc00,#ff9900,#ffcc00)',
            backgroundSize: '200% 200%',
            animation: 'shimmer-badge 3s linear infinite',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            position: 'relative', zIndex: 1,
          }}>
            Get Plor Coins
          </h1>
          <p style={{
            fontSize: 17, color: 'var(--text-muted)', maxWidth: 480,
            margin: '0 auto 32px', lineHeight: 1.6, position: 'relative', zIndex: 1,
          }}>
            Power up your experience. Buy avatar items, unlock game passes, and access exclusive premium features.
          </p>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {[
              { label: '5 Packages', icon: '📦' },
              { label: 'Instant Delivery', icon: '⚡' },
              { label: 'Secure Checkout', icon: '🔒' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600,
              }}>
                {s.icon} {s.label}
              </div>
            ))}
          </div>
        </div>

        <div className="container" style={{ padding: '48px 20px 80px' }}>

          {/* ── Packages grid ── */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Choose Your Package</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All packages include instant delivery to your account.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 64,
          }}>
            {PACKAGES.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} onBuy={handleBuy} />
            ))}
          </div>

          {/* ── Premium membership ── */}
          <div style={{
            background: 'linear-gradient(135deg,#1a1000,#2a1a00,#3a2000)',
            border: '2px solid rgba(255,204,0,0.35)',
            borderRadius: 20, padding: '36px 32px',
            position: 'relative', overflow: 'hidden',
            marginBottom: 64,
            boxShadow: '0 8px 40px rgba(255,170,0,0.15)',
          }}>
            {/* Shimmer */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(120deg,transparent 30%,rgba(255,204,0,0.04) 50%,transparent 70%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-badge 3s linear infinite',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'linear-gradient(135deg,#ffcc00,#ff9900)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, boxShadow: '0 4px 16px rgba(255,204,0,0.5)',
                  }}>
                    👑
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#ffcc00' }}>Plor Premium</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,204,0,0.7)', fontWeight: 600 }}>Membership Plan</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
                  {PREMIUM_BENEFITS.map((b, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.15)',
                      borderRadius: 8, padding: '8px 12px',
                      fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{b.icon}</span>
                      {b.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: 'rgba(255,204,0,0.7)', marginBottom: 4, fontWeight: 600 }}>Starting at</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#ffcc00', lineHeight: 1 }}>$4.99</div>
                <div style={{ fontSize: 13, color: 'rgba(255,204,0,0.6)', marginBottom: 20 }}>/month</div>
                <button
                  onClick={handleBuy}
                  style={{
                    padding: '14px 36px',
                    background: 'linear-gradient(135deg,#ffcc00,#ff9900)',
                    border: 'none', borderRadius: 12,
                    color: '#000', fontWeight: 900, fontSize: 16,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 6px 24px rgba(255,204,0,0.5)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 10px 32px rgba(255,204,0,0.7)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,204,0,0.5)'
                  }}
                >
                  Get Premium
                </button>
                <div style={{ fontSize: 11, color: 'rgba(255,204,0,0.5)', marginTop: 8 }}>Cancel anytime</div>
              </div>
            </div>
          </div>

          {/* ── How to spend section ── */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>How to Spend Plor Coins</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your coins go further than you think.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 64 }}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card-inner"
                style={{
                  background: 'var(--card-bg)', border: '1.5px solid var(--border)',
                  borderRadius: 16, padding: '32px 24px', textAlign: 'center',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg,rgba(0,162,255,0.15),rgba(168,85,247,0.15))',
                  border: '1.5px solid rgba(0,162,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* ── FAQ strip ── */}
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px 32px',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>❓</span> Frequently Asked Questions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              {[
                { q: 'Are Plor Coins refundable?', a: 'All coin purchases are final. Please review your package before completing your purchase.' },
                { q: 'How fast are coins delivered?', a: 'Coins are added to your account instantly upon successful payment processing.' },
                { q: 'Can I gift coins to friends?', a: 'Gifting will be available soon. Stay tuned for the gifting feature launch!' },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{item.q}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message="Payment processing will be available shortly. Check back soon!"
          onDone={() => setToast(false)}
        />
      )}
    </>
  )
}
