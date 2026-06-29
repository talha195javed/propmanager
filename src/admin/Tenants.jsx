import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Info, X, Users } from 'lucide-react'
import { API, authHeader, money, formatMedium, computeLeaseEnd, initials } from './leaseUtils'
import TenantFormModal from './TenantFormModal'

export function TenantStatusBadge({ status }) {
  const map = {
    active: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        map[status] || map.inactive
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

function Tenants() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API}/tenants`, { headers: authHeader() })
      if (res.ok) setTenants(await res.json())
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = tenants.filter((t) =>
    t.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const unitLabel = (t) => {
    if (!t.property_name) return '—'
    return t.unit_name ? `${t.property_name} (${t.unit_name})` : t.property_name
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 whitespace-nowrap">{tenants.length} tenant(s) in List</p>
          {tenants.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for tenant name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add tenant
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading tenants...</div>
      ) : tenants.length === 0 ? (
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-5">
            <Users className="w-9 h-9 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No tenants added yet</p>
          <p className="text-sm text-gray-500 mt-1">Click here to create tenant</p>
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                {['Tenant', 'Unit', 'Lease', 'Phone number', 'Current rent', 'Lease end', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate(`/admin/tenants/${t.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-medium">
                        {initials(t.full_name)}
                      </div>
                      <span className="text-sm text-gray-900">{t.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{unitLabel(t)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.email || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.phone || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {t.current_rent != null ? money(t.current_rent) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {t.lease_start ? formatMedium(computeLeaseEnd(t.lease_start, t.lease_length)) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <TenantStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <TenantFormModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            setToast('Tenant has been added successfully.')
            fetchTenants()
          }}
        />
      )}
    </div>
  )
}

export default Tenants
