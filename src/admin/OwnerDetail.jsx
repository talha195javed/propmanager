import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Pencil, Plus, ChevronDown, X, Trash2 } from 'lucide-react'
import OwnerFormModal from './OwnerFormModal'
import { StatusBadge } from './Owners'

const API = 'http://localhost:5001/api'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function OwnerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [owner, setOwner] = useState(null)
  const [linked, setLinked] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('linked')
  const [showEdit, setShowEdit] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const token = localStorage.getItem('token')
  const authHeader = { Authorization: `Bearer ${token}` }

  const fetchOwner = useCallback(async () => {
    try {
      const res = await fetch(`${API}/owners/${id}`, { headers: authHeader })
      if (res.ok) setOwner(await res.json())
    } catch (error) {
      console.error('Error fetching owner:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchLinked = useCallback(async () => {
    try {
      const res = await fetch(`${API}/owners/${id}/properties`, { headers: authHeader })
      if (res.ok) setLinked(await res.json())
    } catch (error) {
      console.error('Error fetching linked properties:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    Promise.all([fetchOwner(), fetchLinked()]).finally(() => setLoading(false))
  }, [fetchOwner, fetchLinked])

  const handleDelete = async () => {
    if (!window.confirm('Delete this owner? This cannot be undone.')) return
    await fetch(`${API}/owners/${id}`, { method: 'DELETE', headers: authHeader })
    navigate('/admin/owners')
  }

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading owner...</div>
  }

  if (!owner) {
    return (
      <div className="p-12 text-center text-gray-500">
        Owner not found.{' '}
        <Link to="/admin/owners" className="text-blue-600">
          Back to owners
        </Link>
      </div>
    )
  }

  const addressDisplay = [owner.address_line, owner.city].filter(Boolean).join(', ') || '—'

  return (
    <div className="space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="text-sm text-gray-500">
          <Link to="/admin/owners" className="hover:text-gray-700">
            Owners
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{owner.full_name}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Pencil className="w-4 h-4" />
            Edit owner
          </button>
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
                  Delete owner
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Owner summary */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-4">{owner.full_name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-3 max-w-4xl">
          <InfoRow label="Email address" value={owner.email} />
          <InfoRow label="Status" value={<StatusBadge status={owner.status} />} />
          <InfoRow label="Phone number" value={owner.phone || '—'} />
          <InfoRow label="Account manager" value={owner.account_manager || '—'} />
          <InfoRow label="Address" value={addressDisplay} />
          <InfoRow label="Agent (Referring realtor)" value={owner.agent || '—'} />
          <InfoRow label="Property created on" value={formatDate(owner.created_at)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <TabButton active={tab === 'linked'} onClick={() => setTab('linked')}>
          Linked properties
        </TabButton>
        <TabButton active={tab === 'disbursements'} onClick={() => setTab('disbursements')}>
          Disbursements
        </TabButton>
      </div>

      {tab === 'linked' ? (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowLink(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Link property
            </button>
          </div>

          {linked.length === 0 ? (
            <button
              onClick={() => setShowLink(true)}
              className="w-full flex flex-col items-center justify-center py-24 text-center"
            >
              <p className="font-semibold text-gray-900">No property linked</p>
              <p className="text-sm text-gray-500 mt-1">Click here to create your unit</p>
            </button>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      {['Property', 'Units', 'Ownership', 'Management fee'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {linked.map((row) => {
                      const share = Number(row.ownership_share)
                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{row.property_title}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {row.area_sqft ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {share}%{share < 100 ? ' (co-owned)' : ''}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {Number(row.management_fee)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                One owner can hold many properties; a property can have multiple co-owners with
                split ownership.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="py-24 text-center text-sm text-gray-500">
          No disbursements recorded yet.
        </div>
      )}

      {showEdit && (
        <OwnerFormModal
          owner={owner}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setOwner(updated)
            setShowEdit(false)
          }}
        />
      )}

      {showLink && (
        <LinkPropertyModal
          ownerId={id}
          ownerName={owner.full_name}
          onClose={() => setShowLink(false)}
          onLinked={() => {
            setShowLink(false)
            fetchLinked()
          }}
        />
      )}
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

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 -mb-px ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function LinkPropertyModal({ ownerId, ownerName, onClose, onLinked }) {
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState({ propertyId: '', ownershipShare: '100', managementFee: '5' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API}/properties`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setProperties(data)
        if (data.length) setForm((f) => ({ ...f, propertyId: String(data[0].id) }))
      })
      .catch((err) => console.error('Error fetching properties:', err))
  }, [])

  const handleLink = async () => {
    if (!form.propertyId) {
      setError('Please select a property.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/owners/${ownerId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          propertyId: form.propertyId,
          ownershipShare: form.ownershipShare,
          managementFee: form.managementFee,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to link property')
      }
      onLinked()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-8 pt-6 pb-1">
          <h2 className="text-lg font-semibold text-gray-900">Link property</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-8 pb-8">
          <p className="text-sm text-gray-500 mb-6 max-w-lg">
            Link an existing property to {ownerName}. The property must already exist — create it
            under Properties first.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1.5">Property</label>
            <select
              value={form.propertyId}
              onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
              className={inputClass}
            >
              {properties.length === 0 && <option value="">No properties available</option>}
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Ownership share (%)</label>
              <input
                type="number"
                placeholder="100"
                value={form.ownershipShare}
                onChange={(e) => setForm((f) => ({ ...f, ownershipShare: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Management fee (%)</label>
              <input
                type="number"
                placeholder="5"
                value={form.managementFee}
                onChange={(e) => setForm((f) => ({ ...f, managementFee: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-10">
            <button
              onClick={handleLink}
              disabled={saving || properties.length === 0}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Linking...' : 'Link property'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerDetail
