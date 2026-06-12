import { create } from 'zustand'
import api from './axios.js'

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Called on app load to check if session is valid
  checkAuth: async () => {
    try {
      const res = await api.get('/auth-api/check-auth')
      set({ user: res.data.payload, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth-api/login', { email, password })
    set({ user: res.data.payload, isAuthenticated: true })
    return res.data
  },

  register: async (payload) => {
    const res = await api.post('/auth-api/register', payload)
    return res.data
  },

  logout: async () => {
    await api.get('/auth-api/logout')
    set({ user: null, isAuthenticated: false })
  },
}))