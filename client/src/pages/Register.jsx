import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

// Four colored logo blocks
const LOGO_BLOCKS = ['#00a2ff', '#ff6b35', '#00d084', '#ffaa00']

// Birth-year options — same pattern as Roblox (last 100 years)
const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS  = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i)

// Regex: 3–20 characters, alphanumeric + underscore only
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export default function Register() {
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Form fields
  const [username,     setUsername]     = useState('')
  const [displayName,  setDisplayName]  = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [birthYear,    setBirthYear]    = useState('')
  const [agreedTerms,  setAgreedTerms]  = useState(false)
  const [showPass,     setShowPass]     = useState(false)

  // UI state
  const [formError,    setFormError]    = useState('')
  const [loading,      setLoading]      = useState(false)

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState('idle')
  // idle | checking | available | taken | invalid
  const usernameDebounceRef = useRef(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  // Debounced username availability check
  useEffect(() => {
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current)
    }

    if (!username) {
      setUsernameStatus('idle')
      return
    }

    if (!USERNAME_RE.test(username)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        await axios.get(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
        // 200 → available
        setUsernameStatus('available')
      } catch (err) {
        if (err.response?.status === 409 || err.response?.status === 400) {
          setUsernameStatus('taken')
        } else {
          // Network / server error — don't block the user
          setUsernameStatus('idle')
        }
      }
    }, 500)

    return () => clearTimeout(usernameDebounceRef.current)
  }, [username])

  // Per-field validation used at submit time
  const validateForm = useCallback(() => {
    if (!username.trim())                    return 'Username is required.'
    if (!USERNAME_RE.test(username))         return 'Username must be 3–20 characters: letters, numbers, underscores only.'
    if (usernameStatus === 'taken')          return 'That username is already taken.'
    if (!displayName.trim())                 return 'Display name is required.'
    if (displayName.trim().length > 50)      return 'Display name must be 50 characters or fewer.'
    if (!email.trim())                       return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    if (!password)                           return 'Password is required.'
    if (password.length < 8)                 return 'Password must be at least 8 characters.'
    if (password !== confirmPass)            return 'Passwords do not match.'
    if (!birthYear)                          return 'Please select your birth year.'
    if (!agreedTerms)                        return 'You must agree to the Terms of Service.'
    return null
  }, [username, displayName, email, password, confirmPass, birthYear, agreedTerms, usernameStatus])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setFormError('')

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/register', {
        username:    username.trim(),
        displayName: displayName.trim(),
        email:       email.trim().toLowerCase(),
        password,
        birthYear:   Number(birthYear),
      })

      const token = data.token
      const user  = data.user || data.data?.user

      if (!token || !user) {
        throw new Error('Invalid response from server.')
      }

      login(token, user)
      navigate('/home', { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please try again.'
      setFormError(msg)
    } finally {
      setLoading(false)
    }
  }, [username, displayName, email, password, confirmPass, birthYear, agreedTerms,
      validateForm, login, navigate])

  // Username indicator helpers
  const usernameInputClass = () => {
    if (usernameStatus === 'available') return 'form-input success'
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return 'form-input error'
    return 'form-input'
  }

  const usernameIndicator = () => {
    switch (usernameStatus) {
      case 'checking':   return <span style={{ color: 'var(--text-muted)' }}>&#10230; Checking…</span>
      case 'available':  return <span className="form-success">&#10003; Available!</span>
      case 'taken':      return <span className="form-error">&#10007; Already taken</span>
      case 'invalid':
        return <span className="form-error">3–20 chars, letters/numbers/underscore only</span>
      default:           return null
    }
  }

  // Password strength
  const passwordStrength = () => {
    if (!password) return null
    const score = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['', 'var(--danger)', 'var(--warning)', 'var(--primary)', 'var(--success)']
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= score ? colors[score] : 'var(--border)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>
          {labels[score]}
        </span>
      </div>
    )
  }

  if (authLoading) return null

  return (
    <div className="auth-page">
      {/* Decorative blobs */}
      <div aria-hidden="true" style={{
        position: 'absolute', width: 450, height: 450,
        borderRadius: '50%', background: 'rgba(0,100,255,0.09)',
        filter: 'blur(90px)', top: '-15%', right: '-10%', pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', width: 350, height: 350,
        borderRadius: '50%', background: 'rgba(120,30,200,0.07)',
        filter: 'blur(70px)', bottom: '0%', left: '-8%', pointerEvents: 'none',
      }} />

      <div className="auth-card" style={{ maxWidth: 460 }}>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-blocks">
            {LOGO_BLOCKS.map((color, i) => (
              <span key={i} style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="auth-logo-text">PLOR</div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join millions of players today — it&apos;s free!</p>

        {/* Form-level error */}
        {formError && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
            <span aria-hidden="true">&#9888;</span>
            <span>{formError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <div className="form-input-wrapper">
              <input
                id="reg-username"
                type="text"
                className={usernameInputClass()}
                placeholder="e.g. cool_player_99"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFormError('') }}
                autoComplete="username"
                autoFocus
                disabled={loading}
                maxLength={20}
                style={{ paddingRight: 36 }}
              />
              {usernameStatus === 'available' && (
                <span className="form-input-icon" style={{ color: 'var(--success)' }}>&#10003;</span>
              )}
              {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                <span className="form-input-icon" style={{ color: 'var(--danger)' }}>&#10007;</span>
              )}
              {usernameStatus === 'checking' && (
                <span className="form-input-icon">
                  <span className="spinner spinner-primary" style={{ width: 14, height: 14 }} />
                </span>
              )}
            </div>
            <div style={{ minHeight: 18 }}>{usernameIndicator()}</div>
          </div>

          {/* Display name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-displayname">Display Name</label>
            <input
              id="reg-displayname"
              type="text"
              className="form-input"
              placeholder="Your name as others will see it"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setFormError('') }}
              autoComplete="name"
              disabled={loading}
              maxLength={50}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFormError('') }}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="form-input-wrapper">
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError('') }}
                autoComplete="new-password"
                disabled={loading}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16,
                }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {passwordStrength()}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="form-input-wrapper">
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                className={`form-input${
                  confirmPass && confirmPass !== password ? ' error' : ''
                }${confirmPass && confirmPass === password && password ? ' success' : ''}`}
                placeholder="Re-enter your password"
                value={confirmPass}
                onChange={(e) => { setConfirmPass(e.target.value); setFormError('') }}
                autoComplete="new-password"
                disabled={loading}
                style={{ paddingRight: 36 }}
              />
              {confirmPass && confirmPass === password && password && (
                <span className="form-input-icon" style={{ color: 'var(--success)' }}>&#10003;</span>
              )}
              {confirmPass && confirmPass !== password && (
                <span className="form-input-icon" style={{ color: 'var(--danger)' }}>&#10007;</span>
              )}
            </div>
            {confirmPass && confirmPass !== password && (
              <span className="form-error">Passwords do not match</span>
            )}
          </div>

          {/* Birth year */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-birthyear">Birth Year</label>
            <select
              id="reg-birthyear"
              className="form-select"
              value={birthYear}
              onChange={(e) => { setBirthYear(e.target.value); setFormError('') }}
              disabled={loading}
            >
              <option value="" disabled>Select your birth year</option>
              {BIRTH_YEARS.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Terms checkbox */}
          <label className="form-checkbox-group" htmlFor="reg-terms">
            <input
              id="reg-terms"
              type="checkbox"
              className="form-checkbox"
              checked={agreedTerms}
              onChange={(e) => { setAgreedTerms(e.target.checked); setFormError('') }}
              disabled={loading}
            />
            <span className="form-checkbox-label">
              I agree to the{' '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)' }}>
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--primary)' }}>
                Privacy Policy
              </a>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || usernameStatus === 'checking' || usernameStatus === 'taken'}
            style={{ marginTop: 4 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
