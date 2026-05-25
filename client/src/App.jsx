import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Games from './pages/Games'
import GamePlay from './pages/GamePlay'
import Avatar from './pages/Avatar'
import Profile from './pages/Profile'
import Store from './pages/Store'
import Robux from './pages/Robux'
import CreateGame from './pages/CreateGame'

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/games"
              element={
                <ProtectedRoute>
                  <Games />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:id"
              element={
                <ProtectedRoute>
                  <GamePlay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/avatar"
              element={
                <ProtectedRoute>
                  <Avatar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store"
              element={
                <ProtectedRoute>
                  <Store />
                </ProtectedRoute>
              }
            />
            <Route
              path="/robux"
              element={
                <ProtectedRoute>
                  <Robux />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateGame />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
