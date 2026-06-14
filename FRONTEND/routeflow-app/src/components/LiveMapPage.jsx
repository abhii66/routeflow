import LiveMap from '../components/LiveMap'

export default function LiveMapPage() {
  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-medium mb-5">Live Map</h1>
      <div className="rounded-lg overflow-hidden border border-gray-100" style={{ height: '500px' }}>
        <LiveMap />
      </div>
    </div>
  )
}