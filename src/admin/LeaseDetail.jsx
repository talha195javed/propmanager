import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, Trash2 } from 'lucide-react'
import { API, authHeader, termRange, money } from './leaseUtils'
import { UnitStatusBadge } from './PropertyDetail'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-8">
      <span className="text-sm text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-base font-semibold text-gray-900 mt-7 mb-3 border-b border-gray-100 pb-2">
      {children}
    </h3>
  )
}

function StaticBadge({ children, tone = 'green' }) {
  const map = {
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${map[tone]}`}>
      {children}
    </span>
  )
}

function LeaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lease, setLease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)

  const fetchLease = useCallback(async () => {
    const res = await fetch(`${API}/leases/${id}`, { headers: authHeader() })
    if (res.ok) setLease(await res.json())
  }, [id])

  useEffect(() => {
    fetchLease().finally(() => setLoading(false))
  }, [fetchLease])

  const handleDelete = async () => {
    if (!window.confirm('Delete this lease? This cannot be undone.')) return
    await fetch(`${API}/leases/${id}`, { method: 'DELETE', headers: authHeader() })
    navigate('/admin/lease')
  }

  if (loading) return <div className="p-12 text-center text-gray-500">Loading lease...</div>
  if (!lease) {
    return (
      <div className="p-12 text-center text-gray-500">
        Lease not found.{' '}
        <Link to="/admin/lease" className="text-blue-600">
          Back to leases
        </Link>
      </div>
    )
  }

  const unitTitle = lease.unit_name
    ? `${lease.property_name} (${lease.unit_name})`
    : lease.property_name || 'Lease'
  const propertyUnit = lease.unit_name
    ? `${lease.property_name} · ${lease.unit_name}`
    : lease.property_name || '—'

  return (
    <div className="space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="text-sm text-gray-500">
          <Link to="/admin/lease" className="hover:text-gray-700">
            Lease
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{unitTitle}</span>
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
                Delete lease
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unit summary */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-5">{unitTitle}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
          <InfoRow label="Unit type" value={lease.unit_type || '—'} />
          <InfoRow label="Status" value={<UnitStatusBadge status={lease.unit_status} />} />
          <InfoRow
            label="Size"
            value={lease.size_sqft ? `${Number(lease.size_sqft).toLocaleString()} sqft` : '—'}
          />
          <InfoRow
            label="Bedroom / Bathroom"
            value={`${lease.bedrooms ?? '—'} Beds · ${lease.bathrooms ?? '—'} Baths`}
          />
          <InfoRow
            label="Market rent/yr"
            value={lease.market_rent ? Number(lease.market_rent).toLocaleString() : '—'}
          />
          <InfoRow
            label="Tenant"
            value={
              lease.tenant_id ? (
                <Link
                  to={`/admin/tenants/${lease.tenant_id}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {lease.tenant_name}
                </Link>
              ) : (
                '—'
              )
            }
          />
        </div>
      </div>

      {/* Agreement */}
      <div>
        <SectionTitle>Agreement</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
          <InfoRow label="Region / form" value={lease.region || '—'} />
          <InfoRow label="Ejari" value={<StaticBadge>Registered</StaticBadge>} />
          <InfoRow
            label="E-signature"
            value={<span className="text-green-600">● Both signed</span>}
          />
          <InfoRow label="Document" value="Signed PDF" />
        </div>
      </div>

      {/* Parties */}
      <div>
        <SectionTitle>Parties</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
          <InfoRow label="Landlord / owner" value={lease.landlord_company || lease.landlord_name || '—'} />
          <InfoRow label="Tenant" value={lease.tenant_name || '—'} />
          <InfoRow label="Managing agent" value="Estatera" />
          <InfoRow label="Co-tenants" value="None" />
        </div>
      </div>

      {/* Property & term */}
      <div>
        <SectionTitle>Property &amp; term</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
          <InfoRow label="Property · unit" value={propertyUnit} />
          <InfoRow label="Term" value={termRange(lease.start_date, lease.lease_length)} />
          <InfoRow label="Lease type" value={lease.lease_type || '—'} />
          <InfoRow label="Payment schedule" value={lease.payment_schedule || '—'} />
          <InfoRow label="Annual rent" value={money(lease.annual_rent)} />
        </div>
      </div>
    </div>
  )
}

export default LeaseDetail
