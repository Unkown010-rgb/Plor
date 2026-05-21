import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatNum(n) {
  if (!n && n !== 0) return '0'
  if (n >= 3600) return Math.floor(n / 3600) + 'h ' + Math.floor((n % 3600) / 60) + 'm'
  if (n >= 60) return Math.floor(n / 60) + 'm'
  return String(n)
}

/* ─── stat box ────────────────────────────────────────────── */
function StatBox({ icon, value, label }) {
  return (
    <div style={{
      flex: 1, minWidth: 110, textAlign: 'center',
      padding: '16px 12px',
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{label}</div>
    </div>
  )
}

/* ─── avatar display ──────────────────────────────────────── */
function AvatarShowcase({ username, avatarData }) {
  const bg = avatarColor(username)
  const body  = avatarData?.body  || '🟦'
  const head  = avatarData?.head  || '😊'
  const shirt = avatarData?.shirt || '👕'

  return (
    <div style={{
      width: 120, height: 170,
      background: `linear-gradient(160deg, ${bg}44, ${bg}22)`,
      border: `2px solid ${bg}66`,
      borderRadius: 16,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 2, position: 'relative', overflow: 'hidden',
    }}>
      {/* glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 30%, ${bg}33 0%, transparent 65%)`,
        pointerEvents: 'none',
      }} />
      {/* avatar stack */}
      <span style={{ fontSize: 32, lineHeight: 1, zIndex: 1 }}>{head}</span>
      <span style={{ fontSize: 28, lineHeight: 1, zIndex: 1 }}>{shirt}</span>
      <span style={{ fontSize: 20, lineHeight: 1, zIndex: 1 }}>{body}</span>

      {/* initial fallback overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: bg, fontWeight: 900, fontSize: 48,
        opacity: 0.12, zIndex: 0, userSelect: 'none',
      }}>
        {(username || 'P')[0].toUpperCase()}
      </div>
    </div>
  )
}

/* ─── small friend avatar ─────────────────────────────────── */
function MiniAvatar({ friend, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={friend.username}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        cursor: 'pointer', padding: '8px 6px', borderRadius: 8, width: 70, flexShrink: 0,
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          backgroundColor: avatarColor(friend.username),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 16,
        }}>
          {(friend.username || 'U')[0].toUpperCase()}
        </div>
        {friend.online && (
          <div style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: 'var(--success)', border: '2px solid var(--card-bg)',
          }} />
        )}
      </div>
      <div style={{
        color: 'var(--text-muted)', fontSize: 11, textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%',
      }}>
        {friend.username}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
export default function Profile() {
  const { username } = useParams()
  const { user: me, token, updateUser } = useAuth()
  const navigate = useNavigate()

  const [profile,      setProfile]      = useState(null)
  const [recentGames,  setRecentGames]  = useState([])
  const [friends,      setFriends]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [editingAbout, setEditingAbout] = useState(false)
  const [aboutDraft,   setAboutDraft]   = useState('')
  const [savingAbout,  setSavingAbout]  = useState(false)

  const isOwnProfile = me?.username === username
  const hdrs = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      axios.get(`/api/users/${username}`, hdrs),
      axios.get(`/api/users/${username}/games`, hdrs).catch(() => ({ data: [] })),
      axios.get(`/api/users/${username}/friends`, hdrs).catch(() => ({ data: [] })),
    ])
      .then(([profileRes, gamesRes, friendsRes]) => {
        const p = profileRes.data?.user || profileRes.data
        setProfile(p)
        setAboutDraft(p?.about || p?.bio || '')
        setRecentGames(gamesRes.data?.games || gamesRes.data || [])
        setFriends(friendsRes.data?.friends || friendsRes.data || [])
      })
      .catch(err => {
        console.error('Profile fetch error:', err)
        setError(
          err.response?.status === 404
            ? `User "${username}" not found.`
            : 'Failed to load profile. Please try again.'
        )
      })
      .finally(() => setLoading(false))
  }, [username]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveAbout = async () => {
    setSavingAbout(true)
    try {
      await axios.patch('/api/users/me', { about: aboutDraft }, hdrs)
      setProfile(prev => ({ ...prev, about: aboutDraft }))
      if (isOwnProfile) updateUser({ ...me, about: aboutDraft })
      setEditingAbout(false)
    } catch {
      /* silently ignore */
    } finally {
      setSavingAbout(false)
    }
  }

  /* ── Loading skeleton ────────────────────────────────── */
  if (loading) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: 'var(--dark)' }}>
        <Navbar />
        <div className="container" style={{ paddingTop: 40, paddingBottom: 48 }}>
          <ProfileSkeleton />
        </div>
      </div>
    )
  }

  /* ── Error state ─────────────────────────────────────── */
  if (error) {
    return (
      <div className="page-wrapper" style={{ backgroundColor: 'var(--dark)' }}>
        <Navbar />
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>😕</div>
          <h2 style={{ color: '#fff', marginBottom: 8 }}>{error}</h2>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const avatarBg  = avatarColor(profile?.username || '')
  const joinDate  = formatDate(profile?.created_at || profile?.join_date)
  const playtime  = formatNum(profile?.total_playtime_seconds ?? profile?.playtime ?? 0)
  const gamesPlayed  = profile?.games_played   ?? 0
  const achievements = profile?.achievements   ?? 0
  const friendsCount = profile?.friends_count  ?? friends.length

  return (
    <div className="page-wrapper" style={{ backgroundColor: 'var(--dark)' }}>
      <Navbar />

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>

        {/* ── Profile header banner ──────────────────────── */}
        <div style={{
          background: `linear-gradient(135deg, ${avatarBg}22 0%, #1a1a3a 60%, #0d0d1a 100%)`,
          border: `1px solid ${avatarBg}44`,
          borderRadius: 'var(--radius-lg)',
          padding: '32px 32px 28px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative gradient blob */}
          <div style={{
            position: 'absolute', top: -60, right: -60, width: 280, height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${avatarBg}28 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Avatar showcase */}
            <AvatarShowcase username={profile?.username} avatarData={profile?.avatar} />

            {/* Profile info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ margin: 0, color: '#fff', fontWeight: 900, fontSize: 28 }}>
                  {profile?.display_name || profile?.username}
                </h1>
                {profile?.is_verified && (
                  <span style={{
                    background: 'rgba(0,162,255,0.15)', color: 'var(--primary)',
                    border: '1px solid rgba(0,162,255,0.3)',
                    borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
                  }}>
                    ✓ Verified
                  </span>
                )}
              </div>

              {profile?.display_name && profile.display_name !== profile.username && (
                <div style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 6 }}>
                  @{profile.username}
                </div>
              )}

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  📅 Joined {joinDate}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  👥 {friendsCount} Friend{friendsCount !== 1 ? 's' : ''}
                </span>
                {profile?.location && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    📍 {profile.location}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {isOwnProfile ? (
                  <>
                    <button className="btn btn-primary btn-sm"
                      onClick={() => navigate('/avatar')}>
                      🧑‍🎤 Edit Avatar
                    </button>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setEditingAbout(true)}>
                      ✏️ Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary btn-sm">
                      👥 Add Friend
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      💬 Message
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatBox icon="⏱️" value={playtime}    label="Total Playtime" />
          <StatBox icon="🎮" value={gamesPlayed}  label="Games Played"  />
          <StatBox icon="🏆" value={achievements} label="Achievements"  />
          {profile?.robux_balance != null && (
            <StatBox icon="⭐" value={(profile.robux_balance || 0).toLocaleString()} label="Plor Coins" />
          )}
        </div>

        {/* ── Two-column layout ──────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Left column */}
          <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* About section */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <h3 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>About</h3>
                {isOwnProfile && !editingAbout && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEditingAbout(true); setAboutDraft(profile?.about || '') }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {editingAbout ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea
                    value={aboutDraft}
                    onChange={e => setAboutDraft(e.target.value)}
                    maxLength={300}
                    rows={4}
                    placeholder="Tell others about yourself…"
                    style={{
                      width: '100%', padding: '10px 12px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 8, color: '#fff', fontSize: 14,
                      resize: 'vertical', outline: 'none',
                      fontFamily: 'inherit', lineHeight: 1.5,
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {aboutDraft.length}/300
                    </span>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setEditingAbout(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary btn-sm"
                      onClick={handleSaveAbout}
                      disabled={savingAbout}>
                      {savingAbout ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                  {profile?.about || profile?.bio || (
                    <em style={{ opacity: 0.6 }}>
                      {isOwnProfile ? 'Add a description about yourself.' : 'This player hasn\'t added a bio yet.'}
                    </em>
                  )}
                </p>
              )}
            </div>

            {/* Friends section */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  Friends ({friendsCount})
                </h3>
              </div>

              {friends.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                  {isOwnProfile ? 'You haven\'t added any friends yet.' : 'No friends to display.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {friends.slice(0, 18).map(f => (
                    <MiniAvatar
                      key={f.id || f.username}
                      friend={f}
                      onClick={() => navigate(`/profile/${f.username}`)}
                    />
                  ))}
                  {friends.length > 18 && (
                    <div style={{
                      width: 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', fontSize: 12,
                    }}>
                      +{friends.length - 18} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ flex: 2, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Recent games */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                🎮 Recent Games
              </h3>

              {recentGames.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🕹️</div>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                    {isOwnProfile ? 'You haven\'t played any games yet.' : 'No recent games.'}
                  </p>
                  {isOwnProfile && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }}
                      onClick={() => navigate('/games')}>
                      Browse Games
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 14,
                }}>
                  {recentGames.slice(0, 6).map(g => <GameCard key={g.id} game={g} />)}
                </div>
              )}
            </div>

            {/* Achievements (if any) */}
            {achievements > 0 && profile?.achievement_list?.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                  🏆 Achievements
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {profile.achievement_list.slice(0, 12).map((ach, i) => (
                    <div key={i} title={ach.description || ach.name} style={{
                      background: 'rgba(255,170,0,0.1)',
                      border: '1px solid rgba(255,170,0,0.25)',
                      borderRadius: 8, padding: '6px 12px',
                      display: 'flex', alignItems: 'center', gap: 6,
                      cursor: 'default',
                    }}>
                      <span style={{ fontSize: 18 }}>{ach.icon || '🏅'}</span>
                      <span style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 600 }}>
                        {ach.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Loading skeleton layout ─────────────────────────────── */
function ProfileSkeleton() {
  const S = ({ w = '100%', h = 16, r = 8, style = {} }) => (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #1e2a42 25%, #26334f 50%, #1e2a42 75%)',
      backgroundSize: '200% 100%',
      animation: 'skel-shimmer 1.4s infinite',
      ...style,
    }} />
  )
  return (
    <>
      <style>{`
        @keyframes skel-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
      {/* header */}
      <div className="card" style={{ padding: '32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 28 }}>
          <S w={120} h={170} r={16} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <S w="50%" h={32} />
            <S w="30%" h={16} />
            <S w="60%" h={14} />
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <S w={100} h={34} r={8} />
              <S w={100} h={34} r={8} />
            </div>
          </div>
        </div>
      </div>
      {/* stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        {[1,2,3].map(i => <S key={i} h={90} r={10} style={{ flex: 1 }} />)}
      </div>
      {/* content */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <S h={140} r={16} />
          <S h={200} r={16} />
        </div>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <S h={280} r={16} />
        </div>
      </div>
    </>
  )
}
