import { useEffect, useState } from 'react'
import api from '../store/axios'

export default function StorePage() {
  const [store, setStore] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'pharmacy', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/store-api/my')
        setStore(res.data)
        setForm({ name: res.data.name, type: res.data.type, address: res.data.address })
      } catch (err) {
        // no store yet, that's fine
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      if (store) {
        const res = await api.put('/store-api/my', form)
        setStore(res.data.store)
        setSuccess('Store updated')
      } else {
        const res = await api.post('/store-api/', form)
        setStore(res.data.store)
        setSuccess('Store created')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading...</p>

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-medium mb-1">Store</h1>
      <p className="text-sm text-muted mb-5">
        {store ? 'Manage your store details' : 'Set up your store to start creating orders'}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Store name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Abhiii Pharmacy"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {['pharmacy', 'grocery', 'other'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type }))}
                className={`text-sm py-2 rounded-md border transition-colors capitalize ${
                  form.type === type
                    ? 'border-accent bg-accent/5 text-accent font-medium'
                    : 'border-gray-200 text-muted'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Address</label>
          <input
            required
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Hyderabad, Telangana"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-white rounded-md py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : store ? 'Save changes' : 'Create store'}
        </button>
      </form>
    </div>
  )
}