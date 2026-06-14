import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../store/axios'
import Status from '../components/Status'
import NewOrderModal from '../components/NewOrderModal'
import AssignRiderModal from '../components/AssignRiderModal'
import { useSocket } from '../store/SocketContext'

const FILTERS = ['All', 'Pending', 'AwaitingAcceptance', 'Dispatched', 'Delivered', 'Cancelled']

export default function Dispatch() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noStore, setNoStore] = useState(false)
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [assignOrder, setAssignOrder] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const socketRef = useSocket()

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders-api/')
      setOrders(res.data)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load orders'
      if (message.includes('not linked to a store')) {
        setNoStore(true)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Listen for real-time order status updates from riders
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const handleUpdate = (order) => {
      toast(`${order.customer.name}'s order is now ${order.status}`)
      fetchOrders()
    }
    socket.on('orderUpdate', handleUpdate)

    return () => socket.off('orderUpdate', handleUpdate)
  }, [socketRef?.current])


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

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === 'All' || o.status === filter
    const query = search.trim().toLowerCase()
    const matchesSearch =
      query === '' ||
      o.customer.name.toLowerCase().startsWith(query) ||
      o.customer.phone.startsWith(query) ||
      o.customer.address.toLowerCase().startsWith(query)
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return <p className="text-sm text-muted">Loading...</p>
  }

  if (noStore) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4">
          <i className="ti ti-building-store text-2xl text-muted" />
        </div>
        <h2 className="text-lg font-medium mb-1">Set up your store</h2>
        <p className="text-sm text-muted mb-5 max-w-xs">
          You need to create a store before you can start creating and dispatching orders.
        </p>
        <Link
          to="/dashboard/store"
          className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-accent/90 transition-colors"
        >
          Create store
        </Link>
      </div>
    )
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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

      {/* Search + filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-muted text-base" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, address"
            className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm font-medium px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                filter === f ? 'bg-ink text-white' : 'text-muted hover:bg-surface'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {filteredOrders.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
          <p className="text-sm text-muted">
            {orders.length === 0 ? 'No orders yet. Create one to get started.' : 'No orders match your search.'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filteredOrders.map((order) => (
          <Link
            to={`/dashboard/orders/${order._id}`}
            key={order._id}
            className="bg-white border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-accent/30 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-medium text-sm">{order.customer.name}</p>
              <p className="text-xs text-muted mt-0.5">
                {order.customer.address} · {order.items.length} item{order.items.length > 1 ? 's' : ''} · ₹{order.totalAmount + order.deliveryFee}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Status status={order.status} />
              {(order.status === 'Pending' || order.status === 'Cancelled') && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setAssignOrder(order)
                  }}
                  className="text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-md hover:bg-surface transition-colors"
                >
                  {order.status === 'Cancelled' ? 'Reassign' : 'Offer'}
                </button>
              )}
              {order.status === 'AwaitingAcceptance' && (
                <span className="text-xs text-muted">Waiting for rider...</span>
              )}
              {order.assignedRider && order.status === 'Dispatched' && (
                <span className="text-sm text-muted">{order.assignedRider.name}</span>
              )}
            </div>
          </Link>
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