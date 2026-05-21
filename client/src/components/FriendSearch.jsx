import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

function avatarColor(str = '') {
  const palette = [
    '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
    '#1abc9c', '#3498db', '#9b59b6', '#e91e63',
    '#00bcd4', '#ff5722', '#8bc34a', '#673ab7',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

/**
 * FriendSearch – modal to search for a player and send a friend request.
 * Props:
 *   onClose  () => void
 */
export default function FriendSearch({ onClose }) {
  const { token } = useAuth()

  const [query,   setQuery]   = useState('')
  const [result,  setResult]  = useState(null)   // found user object
  const [status,  setStatus]  = useState('idle')  // idle | loading | found | not-found | error
  const [sendState, setSend]  = useState('idle')  // idle | sending | sent | friends | error

  const inputRef   = useRef(null)
  const debounceId = useRef(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const doSearch = useCallback(async (q) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResult(null)
      setStatus('idle')
      return
    }

    setStatus('loading')
    setSend('idle')
    setResult(null)

    try {
      // Try exact username lookup first; fall back to search endpoint
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(trimmed)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!res.ok) {
        setStatus('not-found')
        return
      }

      const data = await res.json()
      // Accept either an array (search) or single object (profile lookup)
      const users = Array.isArray(data) ? data : (data.users ?? (data.id ? [data] : []))

      if (users.length === 0) {
        setStatus('not-found')
      } else {
        setResult(users[0])
        setStatus('found')
        // Pre-check if already friends
        if (users[0].is_friend) setSend('friends')
        if (users[0].request_sent) setSend('sent')
      }
    } catch {
      setStatus('error')
    }
  }, [token])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceId.current)
    debounceId.current = setTimeout(() => doSearch(val), 400)
  }

  async function handleAddFriend() {
    if (!result || !token) return
    setSend('sending')
    try {
      const res = await fetch('/api/users/friends/request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: result.username }),
      })

      if (res.ok) {
        setSend('sent')
      } else {
        const body = await res.json().catch(() => ({}))
        if (body.message?.toLowerCase().includes('already')) {
          setSend('friends')
        } else {
          setSend('error')
        }
      }
    } catch {
      setSend('error')
    }
  }

  // ── Derived display values ──────────────────────────────────────────────────
  const bgColor  = avatarColor(result?.username ?? '')
  const initial  = (result?.username ?? 'P').charAt(0).toUpperCase()
  const dispName = result?.displayName || result?.display_name || result?.username || ''

  function addFriendLabel() {
    switch (sendState) {
      case 'sending': return 'Sending...'
      case 'sent':    return 'Request sent! ✓'
      case 'friends': return 'Already friends'
      case 'error':   return 'Try again'
      default:        return 'Add Friend'
    }
  }

  const addFriendDisabled = sendState === 'sending' || sendState === 'sent' || sendState === 'friends'

  return (
    <>
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: 400,
            background: 'rgba(18, 18, 40, 0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,162,255,0.12)',
            borderRadius: 18,
            overflow: 'hidden',
            animation: 'modal-in 0.22s ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '18px 20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: 0.3 }}>
                👥 Find a Friend
              </h2>
              <p style={{ color: '#8888aa', fontSize: 12, margin: '4px 0 0' }}>
                Search by username to add friends
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#8888aa',
                width: 30,
                height: 30,
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,59,48,0.15)'
                e.currentTarget.style.color = '#ff3b30'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = '#8888aa'
              }}
            >
              ✕
            </button>
          </div>

          {/* Search input */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8888aa',
                fontSize: 15,
                pointerEvents: 'none',
              }}>
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Enter username..."
                style={{
                  width: '100%',
                  height: 42,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 14,
                  padding: '0 14px 0 38px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,162,255,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              {status === 'loading' && (
                <span style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.15)',
                  borderTopColor: '#00a2ff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                  display: 'block',
                }} />
              )}
            </div>
          </div>

          {/* Result area */}
          <div style={{ padding: '0 20px 20px', minHeight: 80 }}>
            {status === 'found' && result && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '12px 14px',
                animation: 'modal-in 0.18s ease',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: `0 0 0 2px ${bgColor}55`,
                }}>
                  {initial}
                </div>

                {/* Name info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {dispName}
                  </div>
                  {dispName !== result.username && (
                    <div style={{ color: '#8888aa', fontSize: 12 }}>
                      @{result.username}
                    </div>
                  )}
                </div>

                {/* Add Friend button */}
                <button
                  onClick={handleAddFriend}
                  disabled={addFriendDisabled}
                  style={{
                    background: sendState === 'sent'
                      ? 'rgba(0,208,132,0.15)'
                      : sendState === 'friends'
                        ? 'rgba(255,255,255,0.06)'
                        : 'linear-gradient(135deg, #00a2ff, #0070cc)',
                    color: sendState === 'sent'
                      ? '#00d084'
                      : sendState === 'friends'
                        ? '#8888aa'
                        : '#fff',
                    border: sendState === 'sent'
                      ? '1px solid rgba(0,208,132,0.3)'
                      : sendState === 'friends'
                        ? '1px solid rgba(255,255,255,0.1)'
                        : 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: addFriendDisabled ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    opacity: sendState === 'sending' ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!addFriendDisabled) e.currentTarget.style.opacity = '0.85'
                  }}
                  onMouseLeave={e => {
                    if (!addFriendDisabled) e.currentTarget.style.opacity = '1'
                  }}
                >
                  {addFriendLabel()}
                </button>
              </div>
            )}

            {status === 'not-found' && (
              <div style={{
                textAlign: 'center',
                padding: '20px 0 8px',
                color: '#8888aa',
                fontSize: 13,
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔎</div>
                No player found for <strong style={{ color: '#fff' }}>"{query}"</strong>
              </div>
            )}

            {status === 'error' && (
              <div style={{ textAlign: 'center', padding: '20px 0 8px', color: '#ff3b30', fontSize: 13 }}>
                Something went wrong. Please try again.
              </div>
            )}

            {status === 'idle' && (
              <div style={{ textAlign: 'center', padding: '12px 0 4px', color: '#555577', fontSize: 12 }}>
                Type a username above to search
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
