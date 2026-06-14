import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../store/axios'
import Status from '../components/Status'
import AssignRiderModal from '../components/AssignRiderModal'
import { useSocket } from '../store/SocketContext'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const socketRef = useSocket()

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders-api/${id}`)
      setOrder(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  // Refresh this order in real-time if its status changes
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const handleUpdate = (updatedOrder) => {
      if (updatedOrder._id === id) fetchOrder()
    }
    socket.on('orderUpdate', handleUpdate)

    return () => socket.off('orderUpdate', handleUpdate)
  }, [socketRef?.current, id])

  const handleCancel = async () => {
    if (!confirm('Cancel this order? This cannot be undone.')) return
    setCancelling(true)
    try {
      await api.put(`/orders-api/${id}/cancel`)
      toast.success('Order cancelled')
      fetchOrder()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading...</p>

  if (error || !order) {
    return (
      <div>
        <Link to="/dashboard" className="text-sm text-accent font-medium flex items-center gap-1 mb-4">
          <i className="ti ti-arrow-left text-base" /> Back to orders
        </Link>
        <p className="text-sm text-red-600">{error || 'Order not found'}</p>
      </div>
    )
  }

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : '—'

  return (
    <div className="max-w-2xl">
      <Link to="/dashboard" className="text-sm text-accent font-medium flex items-center gap-1 mb-4">
        <i className="ti ti-arrow-left text-base" /> Back to orders
      </Link>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-medium mb-1">{order.customer.name}</h1>
          <p className="text-sm text-muted">Order placed {formatDate(order.createdAt)}</p>
        </div>
        <Status status={order.status} />
      </div>

      <div className="flex gap-2 mb-5">
        {(order.status === 'Pending' || order.status === 'Cancelled') && (
          <button
            onClick={() => setShowAssign(true)}
            className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-accent/90 transition-colors"
          >
            {order.status === 'Cancelled' ? 'Reassign rider' : 'Assign rider'}
          </button>
        )}

        {(order.status === 'Pending' || order.status === 'Dispatched') && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm font-medium border border-gray-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {cancelling ? 'Cancelling...' : 'Cancel order'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Customer details */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Customer</p>
          <div className="flex flex-col gap-2 text-sm">
            <p className="flex items-center gap-2 text-muted">
              <i className="ti ti-phone text-base" /> {order.customer.phone}
            </p>
            <p className="flex items-center gap-2 text-muted">
              <i className="ti ti-map-pin text-base" /> {order.customer.address}
            </p>
          </div>
        </div>

        {/* Rider / delivery details */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Delivery</p>
          {order.assignedRider ? (
            <div className="flex flex-col gap-2 text-sm">
              <p className="flex items-center gap-2 text-muted">
                <i className="ti ti-user text-base" /> {order.assignedRider.name}
              </p>
              {order.assignedRider.phone && (
                <p className="flex items-center gap-2 text-muted">
                  <i className="ti ti-phone text-base" /> {order.assignedRider.phone}
                </p>
              )}
              <p className="flex items-center gap-2 text-muted">
                <i className="ti ti-clock text-base" /> Dispatched {formatDate(order.dispatchedAt)}
              </p>
              {order.deliveredAt && (
                <p className="flex items-center gap-2 text-muted">
                  <i className="ti ti-check text-base" /> Delivered {formatDate(order.deliveredAt)}
                </p>
              )}
              {order.riderEarning != null ? (
                <p className="flex items-center gap-2 text-muted">
                  <i className="ti ti-coin text-base" /> Rider earned ₹{order.riderEarning}
                </p>
              ) : (
                <p className="flex items-center gap-2 text-muted">
                  <i className="ti ti-coin text-base" /> Rider will earn ₹{order.deliveryFee + Math.round(order.totalAmount * 0.05)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">No rider assigned yet</p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Items</p>
        <div className="flex flex-col gap-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <p>{item.qty} × {item.name}</p>
              <p className="text-muted">₹{item.qty * item.price}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between text-sm">
          <p className="text-muted">Delivery fee</p>
          <p className="text-muted">₹{order.deliveryFee}</p>
        </div>
        <div className="flex items-center justify-between text-sm font-medium mt-1">
          <p>Total</p>
          <p>₹{order.totalAmount + order.deliveryFee}</p>
        </div>
      </div>

      {showAssign && (
        <AssignRiderModal
          order={order}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            setShowAssign(false)
            fetchOrder()
          }}
        />
      )}
    </div>
  )
}