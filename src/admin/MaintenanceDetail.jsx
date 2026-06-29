import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, Trash2, ArrowUpRight } from 'lucide-react'
import { API, authHeader } from './leaseUtils'
import { STATUS_META, maintReportedDate } from './Maintenance'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-8">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

// Options offered from the inline status control (label → stored value).
const STATUS_ACTIONS = [
  { label: 'Resolved', value: 'resolved', cls: 'bg-green-50 text-green-700 border-green-200' },
  { label: 'Close', value: 'closed', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Revert', value: 'reverted', cls: 'border-gray-200 text-gray-700' },
]

function MaintenanceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [req, setReq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStatus, setShowStatus] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const fetchReq = useCallback(async () => {
    const res = await fetch(`${API}/maintenance/${id}`, { headers: authHeader() })
    if (res.ok) setReq(await res.json())
  }, [id])

  useEffect(() => {
    fetchReq().finally(() => setLoading(false))
  }, [fetchReq])

  const updateStatus = async (value) => {
    setShowStatus(false)
    const res = await fetch(`${API}/maintenance/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ status: value }),
    })
    if (res.ok) setReq(await res.json())
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this service request? This cannot be undone.')) return
    await fetch(`${API}/maintenance/${id}`, { method: 'DELETE', headers: authHeader() })
    navigate('/admin/maintenance')
  }

  if (loading) return <div className="p-12 text-center text-gray-500">Loading request...</div>
  if (!req) {
    return (
      <div className="p-12 text-center text-gray-500">
        Request not found.{' '}
        <Link to="/admin/maintenance" className="text-blue-600">
          Back to maintenance
        </Link>
      </div>
    )
  }

  const propertyUnit = req.unit_name
    ? `${req.property_name} - ${req.unit_name}`
    : req.property_name || '—'
  const statusMeta = STATUS_META[req.status] || STATUS_META.in_progress

  return (
    <div className="space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="text-sm text-gray-500">
          <Link to="/admin/maintenance" className="hover:text-gray-700">
            Maintenance
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{propertyUnit}</span>
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
              className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1"
              onMouseLeave={() => setShowActions(false)}
            >
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title + info */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-5">{req.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-3xl">
          <InfoRow
            label="Property · unit"
            value={
              req.property_id ? (
                <Link
                  to={`/admin/properties/${req.property_id}`}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  {propertyUnit}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                propertyUnit
              )
            }
          />
          <InfoRow
            label="Status"
            value={
              <div className="relative inline-block">
                <button
                  onClick={() => setShowStatus((s) => !s)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${statusMeta.cls}`}
                >
                  {statusMeta.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {showStatus && (
                  <div
                    className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 space-y-1"
                    onMouseLeave={() => setShowStatus(false)}
                  >
                    {STATUS_ACTIONS.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => updateStatus(a.value)}
                        className={`block w-full text-left px-2.5 py-1 rounded-md text-xs font-medium border ${a.cls}`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          />
          <InfoRow
            label="Tenant"
            value={
              req.tenant_id ? (
                <Link
                  to={`/admin/tenants/${req.tenant_id}`}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                >
                  {req.tenant_name}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                '—'
              )
            }
          />
          <InfoRow label="Category" value={req.category || '—'} />
          <InfoRow label="Reported" value={maintReportedDate(req.created_at)} />
        </div>
      </div>

      {/* Image reference */}
      {req.photos?.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mt-7 mb-3 border-b border-gray-100 pb-2">
            Image reference
          </h3>
          <div className="flex flex-wrap gap-4">
            {req.photos.map((src, i) => (
              <div key={i} className="w-44 h-40 rounded-lg overflow-hidden border border-gray-200">
                <img src={src} alt={`reference ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MaintenanceDetail
