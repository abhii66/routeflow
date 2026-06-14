import { useEffect, useState } from 'react'
import api from '../store/axios'

export default function RiderEarnings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await api.get('/riders-api/earnings')
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load earnings')
      } finally {
        setLoading(false)
      }
    }
    fetchEarnings()
  }, [])

  if (loading) return <p className="text-sm text-muted">Loading...</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>

  const maxEarning = Math.max(...data.last7Days.map((d) => d.dailyEarnings), 1)

  return (
    <div>
      <h1 className="text-xl font-medium mb-5">Earnings</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-muted mb-1">Total earnings</p>
          <p className="text-2xl font-medium">₹{data.totalEarnings}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-muted mb-1">Total deliveries</p>
          <p className="text-2xl font-medium">{data.totalDeliveries}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-muted mb-1">Today's deliveries</p>
          <p className="text-2xl font-medium">{data.todayDeliveries}</p>
        </div>
      </div>

      <p className="text-sm font-medium mb-3">Last 7 days</p>
      {data.last7Days.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
          <p className="text-sm text-muted">No deliveries in the last 7 days.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg p-4 flex flex-col gap-3">
          {data.last7Days.map((day) => (
            <div key={day._id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted">{day._id}</span>
                <span className="font-medium">₹{day.dailyEarnings} · {day.deliveries} orders</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${(day.dailyEarnings / maxEarning) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}