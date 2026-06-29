import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { API, authHeader } from './leaseUtils'

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
const labelClass = 'block text-sm text-gray-600 mb-1.5'

/**
 * Shared modal for creating and editing a tenant.
 * Pass `tenant` to edit (prefills the form); omit it to create.
 * `onSaved` receives the created/updated tenant record.
 */
function TenantFormModal({ tenant, onClose, onSaved }) {
  const isEdit = Boolean(tenant)

  const [form, setForm] = useState({
    fullName: tenant?.full_name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '+971',
    emiratesId: tenant?.emirates_id || '',
    dob: tenant?.dob ? tenant.dob.slice(0, 10) : '',
    propertyId: tenant?.property_id ? String(tenant.property_id) : '',
    unitId: tenant?.unit_id ? String(tenant.unit_id) : '',
  })
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  // Load properties for the Link Unit section.
  useEffect(() => {
    fetch(`${API}/properties`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProperties)
      .catch(() => {})
  }, [])

  // Load units whenever the selected property changes.
  useEffect(() => {
    if (!form.propertyId) {
      setUnits([])
      return
    }
    fetch(`${API}/properties/${form.propertyId}/units`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setUnits)
      .catch(() => setUnits([]))
  }, [form.propertyId])

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.phone.trim() || !form.emiratesId.trim()) {
      setError('Email, phone number and Emirates ID are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = isEdit ? `${API}/tenants/${tenant.id}` : `${API}/tenants`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save tenant')
      }
      const saved = await res.json()
      onSaved?.(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit tenant' : 'Add new tenant'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8">
          {!isEdit && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
              <Info className="w-4 h-4 text-gray-400" />
              Invite will be sent to tenant with Auto generated password.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Identity */}
          <input
            type="text"
            placeholder="Full name"
            value={form.fullName}
            onChange={update('fullName')}
            className={`${inputClass} mb-4`}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Email address<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g. john@email.com"
                value={form.email}
                onChange={update('email')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Phone number<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="+971"
                value={form.phone}
                onChange={update('phone')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Emirates ID<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="785.."
                value={form.emiratesId}
                onChange={update('emiratesId')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>DOB</label>
              <input
                type="date"
                value={form.dob}
                onChange={update('dob')}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Send Invite →
          </button>

          {/* Link Unit */}
          <h3 className="text-base font-semibold text-gray-900 mt-7 mb-4 border-b border-gray-100 pb-2">
            Link Unit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Property</label>
              <select
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value, unitId: '' }))}
                className={inputClass}
              >
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <select
                value={form.unitId}
                onChange={update('unitId')}
                disabled={!form.propertyId}
                className={`${inputClass} disabled:opacity-60`}
              >
                <option value="">Select unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prospect</label>
              {/* Static placeholder — no prospects feature in the app. */}
              <select disabled className={`${inputClass} disabled:opacity-60`}>
                <option>Select</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add'}
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

export default TenantFormModal
