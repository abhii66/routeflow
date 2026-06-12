import { useEffect, useState } from 'react'
import api from '../store/axios.js'
import StatusPill from '../components/Status.jsx'
import NewOrderModal from '../components/NewOrderModal.jsx'
import AssignRiderModal from '../components/AssignRiderModal.jsx'

export default function Dispatch() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [assignOrder, setAssignOrder] = useState(null)

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders-api/')
      setOrders(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const counts = {
    Pending: orders.filter((o) => o.status === 'Pending').length,
    Dispatched: orders.filter((o) => o.status === 'Dispatched').length,
    Delivered: orders.filter((o) => {
      if (o.status !== 'Delivered' || !o.deliveredAt) return false
      const today = new Date()
      const delivered = new Date(o.deliveredAt)
      return delivered.toDateString() === today.toDateString()
    }).length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-medium">Orders</h1>
        <button
          onClick={() => setShowNewOrder(true)}
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-accent/90 transition-colors flex items-center gap-1.5"
        >
          <i className="ti ti-plus text-base" />
          New order
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-muted mb-1">Pending</p>
          <p className="text-2xl font-medium">{counts.Pending}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-muted mb-1">Dispatched</p>
          <p className="text-2xl font-medium">{counts.Dispatched}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-muted mb-1">Delivered today</p>
          <p className="text-2xl font-medium">{counts.Delivered}</p>
        </div>
      </div>

      {loading && <p className="text-sm text-muted">Loading orders...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && orders.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
          <p className="text-sm text-muted">No orders yet. Create one to get started.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <p className="font-medium text-sm">{order.customer.name}</p>
              <p className="text-xs text-muted mt-0.5">
                {order.customer.address} · {order.items.length} item{order.items.length > 1 ? 's' : ''} · ₹{order.totalAmount}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusPill status={order.status} />
              {order.status === 'Pending' && (
                <button
                  onClick={() => setAssignOrder(order)}
                  className="text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-md hover:bg-surface transition-colors"
                >
                  Assign
                </button>
              )}
              {order.assignedRider && order.status !== 'Pending' && (
                <span className="text-sm text-muted">{order.assignedRider.name}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={() => {
            setShowNewOrder(false)
            fetchOrders()
          }}
        />
      )}

      {assignOrder && (
        <AssignRiderModal
          order={assignOrder}
          onClose={() => setAssignOrder(null)}
          onAssigned={() => {
            setAssignOrder(null)
            fetchOrders()
          }}
        />
      )}
    </div>
  )
}