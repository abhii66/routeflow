import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RiderLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-base">RouteFlow</p>
          <p className="text-xs text-muted">{user?.name}</p>
        </div>
        <button onClick={handleLogout} className="text-muted">
          <i className="ti ti-logout text-xl" />
        </button>
      </header>

      <main className="flex-1 p-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2">
        <NavLink
          to="/rider"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${isActive ? 'text-accent' : 'text-muted'}`
          }
        >
          <i className="ti ti-package text-xl" />
          Orders
        </NavLink>
        <NavLink
          to="/rider/earnings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${isActive ? 'text-accent' : 'text-muted'}`
          }
        >
          <i className="ti ti-wallet text-xl" />
          Earnings
        </NavLink>
      </nav>
    </div>
  )
}