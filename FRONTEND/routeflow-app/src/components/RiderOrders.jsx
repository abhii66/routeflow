import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../store/axios'
import Status from '../components/Status'
import { useSocket } from '../store/SocketContext'

export default function RiderOrders() {
  const [orders, setOrders] = useState([])
  const [offers, setOffers] = useState([])     // pending order offers to accept/decline
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const socketRef = useSocket()

  const fetchOrders = async () => {
    try {
      const res = await api.get('/riders-api/my-orders')
      // separate offers (AwaitingAcceptance) from active/past orders
      setOffers(res.data.filter((o) => o.status === 'AwaitingAcceptance'))
      setOrders(res.data.filter((o) => o.status !== 'AwaitingAcceptance'))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    // New offer from manager
    const handleOffer = (order) => {
      toast(`New delivery offer: ${order.customer.name}`, { icon: '🛵' })
      fetchOrders()
    }
    socket.on('orderOffer', handleOffer)

    // Order was taken by another rider
    const handleTaken = ({ orderId }) => {
      setOffers((prev) => prev.filter((o) => o._id !== orderId))
      toast('An order was taken by another rider', { icon: 'ℹ️' })
    }
    socket.on('orderTaken', handleTaken)

    // Order cancelled by manager
    const handleCancelled = (order) => {
      toast.error(`Order for ${order.customer.name} was cancelled`)
      fetchOrders()
    }
    socket.on('orderCancelled', handleCancelled)

    return () => {
      socket.off('orderOffer', handleOffer)
      socket.off('orderTaken', handleTaken)
      socket.off('orderCancelled', handleCancelled)
    }
  }, [socketRef?.current])

  const handleAccept = async (orderId) => {
    setUpdating(orderId)
    try {
      await api.put(`/orders-api/${orderId}/accept`)
      toast.success('Order accepted!')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept order')
    } finally {
      setUpdating(null)
    }
  }

  const handleDecline = async (orderId) => {
    setUpdating(orderId)
    try {
      await api.put(`/orders-api/${orderId}/decline`)
      setOffers((prev) => prev.filter((o) => o._id !== orderId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline order')
    } finally {
      setUpdating(null)
    }
  }

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(orderId)
    try {
      await api.put(`/orders-api/${orderId}/status`, { status })
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order')
    } finally {
      setUpdating(null)
    }
  }

  const activeOrders = orders.filter((o) => o.status === 'Dispatched')
  const pastOrders = orders.filter((o) => o.status === 'Delivered' || o.status === 'Cancelled')

  return (
    <div>
      <h1 className="text-xl font-medium mb-5">Your orders</h1>

      {loading && <p className="text-sm text-muted">Loading orders...</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Incoming offers */}
      {offers.length > 0 && (
        <>
          <p className="text-sm font-medium mb-2">Incoming offers</p>
          <div className="flex flex-col gap-3 mb-6">
            {offers.map((order) => (
              <div key={order._id} className="bg-white border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{order.customer.name}</p>
                  <Status status={order.status} />
                </div>
                <p className="text-sm text-muted mb-1">{order.customer.address}</p>
                <p className="text-sm text-muted mb-3">📞 {order.customer.phone}</p>

                <div className="border-t border-gray-100 pt-3 mb-3">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-sm text-muted">
                      {item.qty} × {item.name}
                    </p>
                  ))}
                  <p className="text-sm font-medium mt-1">
                    Total: ₹{order.totalAmount + order.deliveryFee} · You earn: ₹{order.deliveryFee + Math.round(order.totalAmount * 0.05)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(order._id)}
                    disabled={updating === order._id}
                    className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(order._id)}
                    disabled={updating === order._id}
                    className="text-sm font-medium border border-gray-200 px-4 py-2 rounded-md hover:bg-surface transition-colors disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Active deliveries */}
      {!loading && activeOrders.length === 0 && offers.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center mb-6">
          <p className="text-sm text-muted">No active deliveries right now.</p>
        </div>
      )}

      {activeOrders.length > 0 && (
        <div className="flex flex-col gap-3 mb-6">
          {activeOrders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{order.customer.name}</p>
                <Status status={order.status} />
              </div>
              <p className="text-sm text-muted mb-1">{order.customer.address}</p>
              <p className="text-sm text-muted mb-3">📞 {order.customer.phone}</p>

              <div className="border-t border-gray-100 pt-3 mb-3">
                {order.items.map((item, i) => (
                  <p key={i} className="text-sm text-muted">
                    {item.qty} × {item.name}
                  </p>
                ))}
                <p className="text-sm font-medium mt-1">Total: ₹{order.totalAmount}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                  disabled={updating === order._id}
                  className="flex-1 bg-success text-white text-sm font-medium py-2 rounded-md hover:bg-success/90 transition-colors disabled:opacity-60"
                >
                  Mark delivered
                </button>
                <button
                  onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                  disabled={updating === order._id}
                  className="text-sm font-medium border border-gray-200 px-4 py-2 rounded-md hover:bg-surface transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pastOrders.length > 0 && (
        <>
          <p className="text-sm font-medium text-muted mb-2">History</p>
          <div className="flex flex-col gap-2">
            {pastOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{order.customer.name}</p>
                  <p className="text-xs text-muted mt-0.5">{order.customer.address}</p>
                </div>
                <Status status={order.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}