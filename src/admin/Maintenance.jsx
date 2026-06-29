import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ChevronDown, ArrowUpDown, Info, X } from 'lucide-react'
import { API, authHeader } from './leaseUtils'
import MaintenanceFormModal from './MaintenanceFormModal'

export const STATUS_META = {
  in_progress: { label: 'In Progress', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  resolved: { label: 'Resolved', cls: 'bg-green-50 text-green-700 border-green-200' },
  closed: { label: 'Closed', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  reverted: { label: 'Reverted', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export function MaintenanceStatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.in_progress
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

export function PriorityCell({ priority }) {
  const map = { high: 'text-red-600', medium: 'text-amber-500', low: 'text-blue-600' }
  const cls = map[priority] || 'text-gray-500'
  const label = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : '—'
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

export function maintReportedDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_FILTERS = ['All', 'In Progress', 'Resolved', 'Closed', 'Reverted']
const FILTER_TO_VALUE = {
  'In Progress': 'in_progress',
  Resolved: 'resolved',
  Closed: 'closed',
  Reverted: 'reverted',
}

function Maintenance() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showFilter, setShowFilter] = useState(false)
  const [toast, setToast] = useState('')

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API}/maintenance`, { headers: authHeader() })
      if (res.ok) setRequests(await res.json())
    } catch (error) {
      console.error('Error fetching maintenance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const shown = requests.filter((r) => {
    if (filter !== 'All' && r.status !== FILTER_TO_VALUE[filter]) return false
    const q = search.toLowerCase()
    return (
      r.title?.toLowerCase().includes(q) ||
      r.property_name?.toLowerCase().includes(q) ||
      r.reference_number?.toLowerCase().includes(q)
    )
  })

  const unitLabel = (r) => {
    if (!r.property_name) return '—'
    return r.unit_name ? `${r.property_name} (${r.unit_name})` : r.property_name
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 text-sm text-gray-700 max-w-md">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          {toast}
          <button onClick={() => setToast('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {requests.length} maintenance(s) in List
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for property name, amount.."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowFilter((s) => !s)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {filter === 'All' ? 'Status' : filter}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showFilter && (
              <div
                className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1"
                onMouseLeave={() => setShowFilter(false)}
              >
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f)
                      setShowFilter(false)
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      filter === f ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
            <ArrowUpDown className="w-4 h-4" />
            Sort by
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New service request
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading requests...</div>
      ) : requests.length === 0 ? (
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex flex-col items-center justify-center py-32 text-center"
        >
          <p className="font-semibold text-gray-900">No service requests yet</p>
          <p className="text-sm text-gray-500 mt-1">Click here to create a service request</p>
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                {['Issue', 'Reference number', 'Unit', 'Tenant', 'Reported', 'Priority', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/admin/maintenance/${r.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{r.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.reference_number || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{unitLabel(r)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.tenant_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{maintReportedDate(r.created_at)}</td>
                  <td className="px-6 py-4">
                    <PriorityCell priority={r.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <MaintenanceStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <MaintenanceFormModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            setToast('Service request has been created and notification sent to Tenant.')
            fetchRequests()
          }}
        />
      )}
    </div>
  )
}

export default Maintenance
