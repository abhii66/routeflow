import { useEffect, useState } from 'react'
import api from '../store/axios'
import { useSocket } from '../store/SocketContext'

export default function Riders() {
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const socketRef = useSocket()

  const fetchRiders = async () => {
    try {
      const res = await api.get('/riders-api/')
      setRiders(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load riders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiders()
  }, [])

  // Refresh rider availability when an order status changes
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const handleUpdate = () => fetchRiders()
    socket.on('orderUpdate', handleUpdate)

    return () => socket.off('orderUpdate', handleUpdate)
  }, [socketRef?.current])

  return (
    <div>
      <h1 className="text-xl font-medium mb-5">Riders</h1>

      {loading && <p className="text-sm text-muted">Loading riders...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && riders.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
          <p className="text-sm text-muted">No riders registered yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {riders.map((rider) => (
          <div
            key={rider._id}
            className="bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-sm font-medium text-muted">
                {rider.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{rider.name}</p>
                <p className="text-xs text-muted mt-0.5">{rider.phone || 'No phone'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted">Deliveries</p>
                <p className="text-sm font-medium">{rider.completedDeliveries ?? 0}</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                  rider.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {rider.isAvailable ? 'Available' : 'Busy'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}