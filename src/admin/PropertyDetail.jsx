import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { PropertyMark } from './Properties'

const API = 'http://localhost:5001/api'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const FILTERS = ['All', 'Vacant', 'Occupied', 'Expiring', 'Expired']

export function UnitStatusBadge({ status }) {
  const map = {
    vacant: 'bg-gray-100 text-gray-600 border-gray-200',
    occupied: 'bg-green-50 text-green-700 border-green-200',
    expiring: 'bg-orange-50 text-orange-700 border-orange-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
  }
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${map[status] || map.vacant}`}>
      {label}
    </span>
  )
}

function PropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [property, setProperty] = useState(null)
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('units')
  const [filter, setFilter] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const token = localStorage.getItem('token')
  const authHeader = { Authorization: `Bearer ${token}` }

  const fetchProperty = useCallback(async () => {
    const res = await fetch(`${API}/properties/${id}`, { headers: authHeader })
    if (res.ok) setProperty(await res.json())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchUnits = useCallback(async () => {
    const res = await fetch(`${API}/properties/${id}/units`, { headers: authHeader })
    if (res.ok) setUnits(await res.json())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    Promise.all([fetchProperty(), fetchUnits()]).finally(() => setLoading(false))
  }, [fetchProperty, fetchUnits])

  const handleDelete = async () => {
    if (!window.confirm('Delete this property? This cannot be undone.')) return
    await fetch(`${API}/properties/${id}`, { method: 'DELETE', headers: authHeader })
    navigate('/admin/properties')
  }

  if (loading) return <div className="p-12 text-center text-gray-500">Loading property...</div>
  if (!property) {
    return (
      <div className="p-12 text-center text-gray-500">
        Property not found.{' '}
        <Link to="/admin/properties" className="text-blue-600">
          Back to properties
        </Link>
      </div>
    )
  }

  const counts = {
    All: units.length,
    Vacant: units.filter((u) => u.status === 'vacant').length,
    Occupied: units.filter((u) => u.status === 'occupied').length,
    Expiring: units.filter((u) => u.status === 'expiring').length,
    Expired: units.filter((u) => u.status === 'expired').length,
  }
  const shownUnits = filter === 'All' ? units : units.filter((u) => u.status === filter.toLowerCase())
  const occupancy = units.length > 0 ? Math.round((counts.Occupied / units.length) * 100) : 0
  const address = [property.city, property.emirate].filter(Boolean).join(', ') || property.address

  return (
    <div className="space-y-5">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="text-sm text-gray-500">
          <Link to="/admin/properties" className="hover:text-gray-700">
            Properties
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{property.title}</span>
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
                Delete property
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <PropertyMark className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{property.title}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl">
          <InfoRow label="Property type" value={property.property_type || '—'} />
          <InfoRow label="Status" value={<span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">Active</span>} />
          <InfoRow label="Units" value={property.units_count ?? 0} />
          <InfoRow
            label="Occupancy"
            value={
              <div className="flex items-center gap-2 w-48">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${occupancy}%` }} />
                </div>
                <span className="text-xs text-gray-500">{occupancy}%</span>
              </div>
            }
          />
          <InfoRow label="Owner" value={property.owner?.owner_name || '—'} />
          <InfoRow label="Property created on" value={formatDate(property.created_at)} />
          <InfoRow label="Address" value={address} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6">
        <TabButton active={tab === 'units'} onClick={() => setTab('units')}>
          Units
        </TabButton>
        <TabButton active={tab === 'owner'} onClick={() => setTab('owner')}>
          Owner details
        </TabButton>
      </div>

      {tab === 'units' ? (
        <div>
          {/* Filter chips + add */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 text-sm">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 ${
                    filter === f ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${filter === f ? 'bg-blue-600' : 'bg-gray-300'}`}
                  />
                  {f} {counts[f]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add unit
            </button>
          </div>

          {shownUnits.length === 0 ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex flex-col items-center justify-center py-24 text-center"
            >
              <p className="font-semibold text-gray-900">Create a Unit</p>
              <p className="text-sm text-gray-500 mt-1">Click here to create your unit</p>
            </button>
          ) : (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    {['Unit', 'Layout', 'Rent/Year', 'Tenant', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shownUnits.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`/admin/properties/${id}/units/${u.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.bedrooms ? `${u.bedrooms} BR` : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.market_rent ? Number(u.market_rent).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.tenant_name || '-'}</td>
                      <td className="px-6 py-4">
                        <UnitStatusBadge status={u.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <OwnerDetailsTab property={property} />
      )}

      {showCreate && (
        <CreateUnitModal
          propertyId={id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            fetchUnits()
            fetchProperty()
          }}
        />
      )}
    </div>
  )
}

function OwnerDetailsTab({ property }) {
  const o = property.owner
  if (!o) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        No owner linked yet. Link this property to an owner from the Owners section.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl pt-2">
      <InfoRow label="Owner" value={o.company || o.owner_name || '—'} />
      <InfoRow
        label="Owner portal"
        value={
          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">
            {o.owner_status === 'active' ? 'Active' : 'Inactive'}
          </span>
        }
      />
      <InfoRow label="Management fee" value={o.management_fee != null ? `${Number(o.management_fee)}%` : '—'} />
      <InfoRow label="Payout" value="Bank transfer" />
      <InfoRow label="Account Manager" value={o.account_manager || '—'} />
      <InfoRow label="Agent (referring realtor)" value={o.agent || '—'} />
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
        active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

const UNIT_TYPES = ['Apartment', 'Villa', 'Townhouse', 'Studio', 'Office', 'Retail']
const STATUSES = ['vacant', 'occupied', 'expiring', 'expired']

function CreateUnitModal({ propertyId, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    status: 'vacant',
    unitType: 'Apartment',
    bedrooms: '2',
    bathrooms: '',
    sizeSqft: '',
    marketRent: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '+971',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleCreate = async () => {
    if (!form.name.trim()) return setError('Unit name is required.')
    if (!form.unitType) return setError('Unit type is required.')
    if (!form.sizeSqft) return setError('Size (sqft) is required.')
    setError('')
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/properties/${propertyId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create unit')
      }
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const fc =
    'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Create unit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Name + icon */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <PropertyMark className="w-5 h-5" />
            </div>
            <input className={`${fc} flex-1`} placeholder="e.g. unit 4B" value={form.name} onChange={set('name')} />
          </div>

          {/* Unit details */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Unit details</h3>
            <select
              value={form.status}
              onChange={set('status')}
              className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-7">
            <Field label={<>Unit type<Req /></>}>
              <select className={fc} value={form.unitType} onChange={set('unitType')}>
                {UNIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={<>Bedroom / Bathroom<Req /></>}>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className={fc} placeholder="2" value={form.bedrooms} onChange={set('bedrooms')} />
                <input type="number" className={fc} placeholder="2" value={form.bathrooms} onChange={set('bathrooms')} />
              </div>
            </Field>
            <Field label={<>Size (sqft)<Req /></>}>
              <input type="number" className={fc} placeholder="e.g. 1200" value={form.sizeSqft} onChange={set('sizeSqft')} />
            </Field>
            <Field label="Market rent / yr">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">AED</span>
                <input
                  type="number"
                  className={`${fc} pl-12`}
                  placeholder=""
                  value={form.marketRent}
                  onChange={set('marketRent')}
                />
              </div>
            </Field>
          </div>

          {/* Tenant details */}
          <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-3">
            Tenant details (Optional)
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            ⓘ Invite will be sent to tenant with Auto generated password.
          </p>
          <input
            className={`${fc} mb-4`}
            placeholder="Full name"
            value={form.tenantName}
            onChange={set('tenantName')}
          />
          <div className="grid grid-cols-2 gap-6 mb-3">
            <Field label={<>Email address<Req /></>}>
              <input
                type="email"
                className={fc}
                placeholder="e.g. john@email.com"
                value={form.tenantEmail}
                onChange={set('tenantEmail')}
              />
            </Field>
            <Field label="Phone number">
              <input className={fc} placeholder="+971" value={form.tenantPhone} onChange={set('tenantPhone')} />
            </Field>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Send Invite →</button>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create'}
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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Req() {
  return <span className="text-red-500">*</span>
}

export default PropertyDetail
