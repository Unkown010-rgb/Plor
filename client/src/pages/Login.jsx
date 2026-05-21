import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import '../styles/global.css'

// Four colored logo blocks
const LOGO_BLOCKS = ['#00a2ff', '#ff6b35', '#00d084', '#ffaa00']

export default function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [identifier, setIdentifier] = useState('')  // email or username
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim()) {
      setError('Please enter your email or username.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', {
        identifier: identifier.trim(),
        password,
      })

      // Support both { token, user } and { token, data: { user } } shapes
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
        'Sign in failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [identifier, password, login, navigate])

  // Don't render until auth state is resolved
  if (authLoading) return null

  return (
    <div className="auth-page">
      {/* Decorative blurred blobs */}
      <div aria-hidden="true" style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(0,100,255,0.1)',
        filter: 'blur(80px)', top: '-10%', left: '-10%', pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', width: 350, height: 350,
        borderRadius: '50%', background: 'rgba(120,30,200,0.08)',
        filter: 'blur(70px)', bottom: '5%', right: '-5%', pointerEvents: 'none',
      }} />

      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-blocks">
            {LOGO_BLOCKS.map((color, i) => (
              <span key={i} style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="auth-logo-text">PLOR</div>
        </div>

        <h1 className="auth-title">Welcome back!</h1>
        <p className="auth-subtitle">Sign in to continue your adventure</p>

        {/* Error alert */}
        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
            <span aria-hidden="true">&#9888;</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label className="form-label" htmlFor="identifier">
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              className="form-input"
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError('') }}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="form-input-wrapper">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                disabled={loading}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="form-input-icon"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 16, pointerEvents: 'auto',
                }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPass ? '&#128065;' : '&#128065;'}
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider" style={{ marginTop: 20 }}>
          <span>or</span>
        </div>

        <p className="auth-guest-text">
          Continue as guest — browse games without an account
        </p>

        {/* Footer link */}
        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register">Sign Up</Link>
        </div>
      </div>
    </div>
  )
}
