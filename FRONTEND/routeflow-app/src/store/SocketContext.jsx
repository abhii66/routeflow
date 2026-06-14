import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuthStore()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const socket = io('https://routeflow-backend-9l4m.onrender.com', {
      withCredentials: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      if (user.role === 'rider') {
        socket.emit('rider:joinRoom', { riderId: user._id })
      } else if (user.role === 'manager' && user.storeId) {
        const storeId = user.storeId._id || user.storeId
        socket.emit('manager:joinRoom', { storeId })
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated, user?._id])

  return <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>
}

export function useSocket() {
  return useContext(SocketContext)
}