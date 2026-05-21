import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  // Wait for localStorage hydration before deciding
  if (loading) return null

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
