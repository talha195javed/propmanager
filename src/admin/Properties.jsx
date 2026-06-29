import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Info, X } from 'lucide-react'

const API = 'http://localhost:5001/api'

// Solid-blue chevron brand mark used across the property screens.
export function PropertyMark({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.49513 22.9912L14.5 15L22.4905 22.9912L22.4905 9.99102L14.5 5L6.49275 9.99095L6.49513 22.9912Z"
        fill="#2563EB"
      />
    </svg>
  )
}

function Properties() {
  const navigate = useNavigate()
  const location = useLocation()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(location.state?.created ? 'Great job! Property has been created.' : '')

  useEffect(() => {
    fetchProperties()
  }, [])

  // Clear the one-time "created" navigation state so a refresh doesn't re-toast.
  useEffect(() => {
    if (location.state?.created) {
      window.history.replaceState({}, '')
      const t = setTimeout(() => setToast(''), 4000)
      return () => clearTimeout(t)
    }
  }, [location.state])

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API}/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) setProperties(await response.json())
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 text-sm text-gray-700">
          <Info className="w-4 h-4 text-blue-600" />
          {toast}
          <button onClick={() => setToast('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{properties.length} property(s) in List</p>
        <button
          onClick={() => navigate('/admin/properties/new')}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add property
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading properties...</div>
      ) : properties.length === 0 ? (
        // Empty state
        <button
          onClick={() => navigate('/admin/properties/new')}
          className="w-full flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-5">
            <PropertyMark className="w-9 h-9" />
          </div>
          <p className="font-semibold text-gray-900">Create a Property</p>
          <p className="text-sm text-gray-500 mt-1">Click here to create your first property</p>
        </button>
      ) : (
        // Property cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} onClick={() => navigate(`/admin/properties/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyCard({ property, onClick }) {
  const units = property.units_count ?? 0
  const occupied = property.occupied_count ?? 0
  const occupancy = units > 0 ? Math.round((occupied / units) * 100) : 0
  const place = [property.city, property.emirate].filter(Boolean).join(', ') || property.address

  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition flex gap-4"
    >
      <div className="w-28 h-28 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <PropertyMark className="w-8 h-8 opacity-40" />
        )}
      </div>
      <div className="flex-1 min-w-0 py-1">
        <p className="font-semibold text-gray-900 truncate">{property.title}</p>
        <p className="text-sm text-gray-500 truncate">{place}</p>
        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${occupancy}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          Occupancy: <span className="font-semibold text-gray-700">{occupancy}%</span>
        </p>
        <div className="mt-3 flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-xs text-gray-500">
          <span>--</span>
          <span>
            Units: <span className="font-semibold text-gray-700">{units}</span>
          </span>
        </div>
      </div>
    </button>
  )
}

export default Properties
