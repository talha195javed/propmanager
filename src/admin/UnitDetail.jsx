import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, Trash2, BedDouble, Bath } from 'lucide-react'
import { UnitStatusBadge } from './PropertyDetail'

const API = 'http://localhost:5001/api'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function UnitDetail() {
  const { id, unitId } = useParams()
  const navigate = useNavigate()

  const [unit, setUnit] = useState(null)
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)

  const token = localStorage.getItem('token')
  const authHeader = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch(`${API}/properties/${id}/units/${unitId}`, { headers: authHeader }).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`${API}/properties/${id}`, { headers: authHeader }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([u, p]) => {
        setUnit(u)
        setProperty(p)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, unitId])

  const handleDelete = async () => {
    if (!window.confirm('Delete this unit? This cannot be undone.')) return
    await fetch(`${API}/properties/${id}/units/${unitId}`, { method: 'DELETE', headers: authHeader })
    navigate(`/admin/properties/${id}`)
  }

  if (loading) return <div className="p-12 text-center text-gray-500">Loading unit...</div>
  if (!unit) {
    return (
      <div className="p-12 text-center text-gray-500">
        Unit not found.{' '}
        <Link to={`/admin/properties/${id}`} className="text-blue-600">
          Back to property
        </Link>
      </div>
    )
  }

  const layout = unit.bedrooms ? `${unit.bedrooms}BR` : '—'
  const rent = unit.market_rent ? Number(unit.market_rent).toLocaleString() : '—'
  const hasTenant = Boolean(unit.tenant_name)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="text-sm text-gray-500">
          <Link to="/admin/properties" className="hover:text-gray-700">
            Properties
          </Link>
          <span className="mx-2">›</span>
          <Link to={`/admin/properties/${id}`} className="hover:text-gray-700">
            {property?.title || 'Property'}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Unit-{unit.name}</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions((s) => !s)}
            className="flex items-center gap-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            Action
            <ChevronDown className="w-4 h-4" />
          </button>
          {showActions && (
            <div
              className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1"
              onMouseLeave={() => setShowActions(false)}
            >
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete unit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unit summary */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Unit-{unit.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
          <InfoRow label="Unit type" value={layout} />
          <InfoRow label="Status" value={<UnitStatusBadge status={unit.status} />} />
          <InfoRow label="Size" value={unit.size_sqft ? `${Number(unit.size_sqft).toLocaleString()} sqft` : '—'} />
          <InfoRow
            label="Bedroom / Bathroom"
            value={
              <span className="flex items-center gap-4 text-sm text-gray-900">
                <span className="flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-gray-500" /> {unit.bedrooms ?? 0} Beds
                </span>
                <span className="flex items-center gap-1.5">
                  <Bath className="w-4 h-4 text-gray-500" /> {unit.bathrooms ?? 0} Baths
                </span>
              </span>
            }
          />
          <InfoRow label="Market rent/yr" value={rent} />
          <InfoRow label="Unit created on" value={formatDate(unit.created_at)} />
        </div>
      </div>

      {/* Tenant details */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Tenant details</h2>
        {hasTenant ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                {unit.tenant_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-900">{unit.tenant_name}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
              <InfoRow label="Email address" value={unit.tenant_email || '—'} />
              <InfoRow label="Phone" value={unit.tenant_phone || '—'} />
              <InfoRow label="Member since" value={formatDate(unit.created_at)} />
              <InfoRow label="Emirates ID" value="—" />
              <InfoRow label="DOB" value="—" />
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">No tenant assigned to this unit yet.</p>
        )}
      </div>

      {/* Lease */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Lease</h2>
        {hasTenant ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  {['Rent', 'Lease length', 'Term', 'Payment schedule', 'Ejari', 'Status'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900">AED {rent} / Annual</td>
                  <td className="px-6 py-4 text-sm text-gray-600">12 months</td>
                  <td className="px-6 py-4 text-sm text-gray-600">—</td>
                  <td className="px-6 py-4 text-sm text-gray-600">—</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                      Registered
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <UnitStatusBadge status={unit.status} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active lease for this unit.</p>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-8">
      <span className="text-sm text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

export default UnitDetail
