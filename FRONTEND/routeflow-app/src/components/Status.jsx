const styles = {
  Pending: 'bg-amber-100 text-amber-800',
  Dispatched: 'bg-blue-100 text-blue-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
}

const dotStyles = {
  Pending: 'bg-amber-500',
  Dispatched: 'bg-blue-500',
  Delivered: 'bg-green-500',
  Cancelled: 'bg-red-500',
}

export default function Status({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  )
}