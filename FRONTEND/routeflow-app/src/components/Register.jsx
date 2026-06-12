import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'manager',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-semibold text-xl mb-1">RouteFlow</p>
        <p className="text-sm text-muted mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2">
            {['manager', 'rider'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((f) => ({ ...f, role }))}
                className={`text-sm py-2 rounded-md border transition-colors capitalize ${
                  form.role === role
                    ? 'border-accent bg-accent/5 text-accent font-medium'
                    : 'border-gray-200 text-muted'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Full name</label>
            <input
              required
              value={form.name}
              onChange={update('name')}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="Abhiii"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="you@store.com"
            />
          </div>

          {form.role === 'rider' && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={update('phone')}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                placeholder="9999999999"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={update('password')}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white rounded-md py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}