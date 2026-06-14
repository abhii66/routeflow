import { useEffect, useState } from 'react'
import api from '../store/axios'

export default function AssignRiderModal({ order, onClose, onAssigned }) {
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const res = await api.get('/riders-api/')
        setRiders(res.data.filter((r) => r.isAvailable))
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load riders')
      } finally {
        setLoading(false)
      }
    }
    fetchRiders()
  }, [])

  const toggleRider = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const handleAssign = async () => {
    if (selected.length === 0) return
    setAssigning(true)
    setError('')
    try {
      await api.put(`/orders-api/${order._id}/assign`, { riderIds: selected })
      onAssigned()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to offer order')
      setAssigning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-medium text-lg">Offer order to riders</h2>
          <button onClick={onClose} className="text-muted">
            <i className="ti ti-x text-xl" />
          </button>
        </div>
        <p className="text-sm text-muted mb-4">
          {order.customer.name} · {order.customer.address}
        </p>
        <p className="text-xs text-muted mb-3">
          Select one or more available riders — first to accept gets the order.
        </p>

        {loading && <p className="text-sm text-muted">Loading riders...</p>}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        {!loading && riders.length === 0 && (
          <p className="text-sm text-muted">No available riders right now.</p>
        )}

        <div className="flex flex-col gap-2 mb-4">
          {riders.map((rider) => (
            <label
              key={rider._id}
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer transition-colors ${
                selected.includes(rider._id)
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(rider._id)}
                  onChange={() => toggleRider(rider._id)}
                  className="accent-accent w-4 h-4"
                />
                <div>
                  <p className="text-sm font-medium">{rider.name}</p>
                  <p className="text-xs text-muted">{rider.phone || 'No phone'}</p>
                </div>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-100 text-green-800">
                Available
              </span>
            </label>
          ))}
        </div>

        <button
          onClick={handleAssign}
          disabled={selected.length === 0 || assigning}
          className="w-full bg-accent text-white text-sm font-medium py-2 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60"
        >
          {assigning
            ? 'Offering...'
            : `Offer to ${selected.length > 0 ? selected.length : ''} rider${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}