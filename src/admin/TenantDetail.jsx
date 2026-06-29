import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { API, authHeader, formatDate, termRange, money, parseMonths } from './leaseUtils'
import { TenantStatusBadge } from './Tenants'
import TenantFormModal from './TenantFormModal'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-8">
      <span className="text-sm text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
        active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function TenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('lease')
  const [showEdit, setShowEdit] = useState(false)

  const fetchTenant = useCallback(async () => {
    const res = await fetch(`${API}/tenants/${id}`, { headers: authHeader() })
    if (res.ok) setTenant(await res.json())
  }, [id])

  useEffect(() => {
    fetchTenant().finally(() => setLoading(false))
  }, [fetchTenant])

  if (loading) return <div className="p-12 text-center text-gray-500">Loading tenant...</div>
  if (!tenant) {
    return (
      <div className="p-12 text-center text-gray-500">
        Tenant not found.{' '}
        <Link to="/admin/tenants" className="text-blue-600">
          Back to tenants
        </Link>
      </div>
    )
  }

  const leases = tenant.leases || []
  const unitLabel = tenant.unit_name || '—'

  const handleCreateLease = () => {
    navigate('/admin/lease', {
      state: {
        createFor: {
          tenantId: tenant.id,
          tenantName: tenant.full_name,
          propertyId: tenant.property_id ? String(tenant.property_id) : '',
          propertyName: tenant.property_name,
          unitId: tenant.unit_id ? String(tenant.unit_id) : '',
          unitName: tenant.unit_name,
        },
      },
    })
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="text-sm text-gray-500">
          <Link to="/admin/tenants" className="hover:text-gray-700">
            Tenants
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{tenant.full_name}</span>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <Pencil className="w-4 h-4" />
          Edit tenant
        </button>
      </div>

      {/* Summary */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-5">{tenant.full_name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
          <InfoRow label="Email address" value={tenant.email || '—'} />
          <InfoRow label="Status" value={<TenantStatusBadge status={tenant.status} />} />
          <InfoRow label="Phone number" value={tenant.phone || '—'} />
          <InfoRow label="Emirates ID" value={tenant.emirates_id || '—'} />
          <InfoRow label="DOB" value={formatDate(tenant.dob)} />
          <InfoRow label="Tenant added on" value={formatDate(tenant.created_at)} />
          <InfoRow label="Property" value={tenant.property_name || '—'} />
          <InfoRow label="Unit" value={unitLabel} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <TabButton active={tab === 'lease'} onClick={() => setTab('lease')}>
          Lease
        </TabButton>
        <TabButton active={tab === 'ledger'} onClick={() => setTab('ledger')}>
          Ledger
        </TabButton>
      </div>

      {tab === 'lease' ? (
        leases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-semibold text-gray-900">No lease created</p>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              Click the button to create lease, You will be directed to the lease page.
            </p>
            <button
              onClick={handleCreateLease}
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Create lease
            </button>
          </div>
        ) : (
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
              <tbody className="divide-y divide-gray-100">
                {leases.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => navigate(`/admin/lease/${l.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{money(l.annual_rent)} / Annual</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {l.lease_length || `${parseMonths(l.lease_length)} months`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {termRange(l.start_date, l.lease_length)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{l.payment_schedule || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                        Registered
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                        {l.status === 'active' ? 'Active' : l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="py-20 text-center text-sm text-gray-500">No ledger entries yet.</div>
      )}

      {showEdit && (
        <TenantFormModal
          tenant={tenant}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
            fetchTenant()
          }}
        />
      )}
    </div>
  )
}

export default TenantDetail
