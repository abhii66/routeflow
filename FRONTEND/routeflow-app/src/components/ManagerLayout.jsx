import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/dashboard', label: 'Dispatch', icon: 'layout-dashboard' },
  { to: '/dashboard/riders', label: 'Riders', icon: 'users' },
  { to: '/dashboard/store', label: 'Store', icon: 'building-store' },
]

export default function ManagerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex md:flex-col">
        <div className="px-4 py-4 md:py-5 flex items-center justify-between md:justify-start w-full">
          <p className="font-semibold text-base">RouteFlow</p>
          <span className="md:hidden text-xs text-muted">{user?.name}</span>
        </div>
        <nav className="hidden md:flex flex-col gap-1 px-3 pb-4 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
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
        <div className="hidden md:block px-3 pb-4">
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden order-last fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <i className={`ti ti-${item.icon} text-xl`} />
            {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted">
          <i className="ti ti-logout text-xl" />
          Log out
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
        <Outlet />
      </main>
    </div>
  )
}