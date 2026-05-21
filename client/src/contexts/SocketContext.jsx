import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect and clean up if no longer authenticated
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    // Create socket connection with auth token
    const newSocket = io('/', {
      auth: { token },
      autoConnect: true,
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
    }
  }, [isAuthenticated, token])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
