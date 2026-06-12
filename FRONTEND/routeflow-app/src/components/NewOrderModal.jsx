import { useState } from 'react'
import api from '../store/axios.jsx'

export default function NewOrderModal({ onClose, onCreated }) {
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' })
  const [items, setItems] = useState([{ name: '', qty: 1, price: '' }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
  }

  const addItem = () => setItems((prev) => [...prev, { name: '', qty: 1, price: '' }])
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index))

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/orders-api/', {
        customer,
        items: items.map((i) => ({ name: i.name, qty: Number(i.qty), price: Number(i.price) })),
        totalAmount,
      })
      onCreated()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-lg">New order</h2>
          <button onClick={onClose} className="text-muted">
            <i className="ti ti-x text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Customer details</p>
            <div className="flex flex-col gap-2">
              <input
                required
                placeholder="Name"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <input
                required
                placeholder="Phone"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
              <input
                required
                placeholder="Delivery address"
                value={customer.address}
                onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Items</p>
              <button type="button" onClick={addItem} className="text-xs text-accent font-medium">
                + Add item
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    required
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) => updateItem(i, 'qty', e.target.value)}
                    className="w-16 border border-gray-200 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateItem(i, 'price', e.target.value)}
                    className="w-20 border border-gray-200 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-muted">
                      <i className="ti ti-trash text-base" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <p className="text-sm font-medium">Total</p>
            <p className="text-sm font-medium">₹{totalAmount}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white rounded-md py-2 text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create order'}
          </button>
        </form>
      </div>
    </div>
  )
}