import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { SocketProvider } from './store/SocketContext'
import { Toaster } from 'react-hot-toast'
import Login from './components/Login'
import Register from './components/Register'
import Dispatch from './components/Dispatch'
import Riders from './components/Riders'
import StorePage from './components/StorePage'
import OrderDetail from './components/OrderDetail'
import LiveMapPage from './components/LiveMapPage'
import RiderOrders from './components/RiderOrders'
import RiderEarnings from './components/RiderEarnings'
import ManagerLayout from './components/ManagerLayout'
import RiderLayout from './components/RiderLayout'
import ProtectedRoute from './components/ProtectedRoute'


function App() {
  const { checkAuth, isAuthenticated, user, isLoading } = useAuthStore()
 
  useEffect(() => {
    checkAuth()
  }, [])
 
  if (isLoading) {
    return <p className="text-sm text-muted p-6">Loading...</p>
  }
 
  return (
    <SocketProvider>
    <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'manager' ? '/dashboard' : '/rider'} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'manager' ? '/dashboard' : '/rider'} replace />
            ) : (
              <Register />
            )
          }
        />
 
        {/* Manager routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="manager">
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dispatch />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="map" element={<LiveMapPage />} />
          <Route path="riders" element={<Riders />} />
          <Route path="store" element={<StorePage />} />
        </Route>
 
        {/* Rider routes */}
        <Route
          path="/rider"
          element={
            <ProtectedRoute allowedRole="rider">
              <RiderLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RiderOrders />} />
          <Route path="earnings" element={<RiderEarnings />} />
        </Route>
 
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? (user?.role === 'manager' ? '/dashboard' : '/rider') : '/login'} replace />
          }
        />
      </Routes>
    </BrowserRouter>
    </SocketProvider>
  )
}
 
export default App