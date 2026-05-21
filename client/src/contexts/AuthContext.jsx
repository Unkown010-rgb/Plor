import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auto-load from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('plor_token')
    const storedUser = localStorage.getItem('plor_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('plor_token')
        localStorage.removeItem('plor_user')
      }
    }

    setLoading(false)
  }, [])

  const login = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('plor_token', newToken)
    localStorage.setItem('plor_user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('plor_token')
    localStorage.removeItem('plor_user')
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('plor_user', JSON.stringify(updatedUser))
  }

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
