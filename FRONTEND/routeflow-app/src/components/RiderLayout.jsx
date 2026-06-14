import { useState, useEffect } from 'react'
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../store/SocketContext'

const navItems = [
  { to: '/rider', label: 'Orders', icon: 'package', end: true },
  { to: '/rider/earnings', label: 'Earnings', icon: 'wallet', end: false },
]

export default function RiderLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const socketRef = useSocket()
  const [menuOpen, setMenuOpen] = useState(false)

  // Share live location with the server every 10 seconds
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket || !user?._id) return
    if (!navigator.geolocation) return

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          socket.emit('rider:updateLocation', {
            riderId: user._id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        },
        () => {}, // ignore permission errors silently
        { enableHighAccuracy: true }
      )
    }

    sendLocation()
    const interval = setInterval(sendLocation, 10000)
    return () => clearInterval(interval)
  }, [socketRef?.current, user?._id])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const currentLabel =
    navItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    )?.label || 'RouteFlow'

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 h-full bg-white border-r border-gray-200 flex-col">
        <div className="px-4 py-5">
          <p className="font-semibold text-base">RouteFlow</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-4 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-surface text-ink font-medium'
                    : 'text-muted hover:bg-surface hover:text-ink'
                }`
              }
            >
              <i className={`ti ti-${item.icon} text-lg`} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-muted hover:bg-surface hover:text-ink transition-colors"
          >
            <i className="ti ti-logout text-lg" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-20">
        <button onClick={() => setMenuOpen(true)} className="text-ink">
          <i className="ti ti-menu-2 text-2xl" />
        </button>
        <p className="font-semibold text-base">{currentLabel}</p>
      </header>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg flex flex-col">
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <p className="font-semibold text-base">RouteFlow</p>
              <button onClick={() => setMenuOpen(false)} className="text-muted">
                <i className="ti ti-x text-xl" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-3 py-3 flex-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-surface text-ink font-medium'
                        : 'text-muted hover:bg-surface hover:text-ink'
                    }`
                  }
                >
                  <i className={`ti ti-${item.icon} text-lg`} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 pb-4 border-t border-gray-100 pt-3">
              <div className="px-3 py-2 mb-2">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-muted hover:bg-surface hover:text-ink transition-colors"
              >
                <i className="ti ti-logout text-lg" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 pt-20 md:pt-6 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}