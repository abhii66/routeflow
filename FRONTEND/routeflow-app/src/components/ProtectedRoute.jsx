import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) return <p className="text-sm text-muted p-6">Loading...</p>

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'manager' ? '/dashboard' : '/rider'} replace />
  }

  return children
}