import { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'
import api from '../store/axios'
import { useSocket } from '../store/SocketContext'

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px',
}

// Default center: Hyderabad
const defaultCenter = { lat: 17.385044, lng: 78.486671 }

export default function LiveMap() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  })

  const [riders, setRiders] = useState([])
  const socketRef = useSocket()

  const fetchRiders = async () => {
    try {
      const res = await api.get('/riders-api/')
      setRiders(res.data.filter((r) => r.currentLocation?.lat && r.currentLocation?.lng))
    } catch (err) {
      // silent fail, map just shows no markers
    }
  }

  useEffect(() => {
    fetchRiders()
  }, [])

  // Live location updates via socket
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const handleLocation = ({ riderId, lat, lng }) => {
      setRiders((prev) =>
        prev.map((r) => (r._id === riderId ? { ...r, currentLocation: { lat, lng } } : r))
      )
    }
    socket.on('rider:locationUpdated', handleLocation)

    return () => socket.off('rider:locationUpdated', handleLocation)
  }, [socketRef?.current])

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface rounded-lg">
        <p className="text-sm text-muted">Loading map...</p>
      </div>
    )
  }

  const center = riders.length > 0 ? riders[0].currentLocation : defaultCenter

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
      {riders.map((rider) => (
        <MarkerF
          key={rider._id}
          position={rider.currentLocation}
          title={rider.name}
          label={{
            text: rider.name.charAt(0).toUpperCase(),
            color: '#fff',
          }}
        />
      ))}
    </GoogleMap>
  )
}