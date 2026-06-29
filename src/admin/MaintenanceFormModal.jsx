import { useState, useEffect, useRef } from 'react'
import { X, Info, ImageIcon } from 'lucide-react'
import { API, authHeader } from './leaseUtils'

const fc =
  'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
const labelClass = 'block text-sm text-gray-600 mb-1.5'
const PRIORITIES = ['low', 'medium', 'high']
const CATEGORIES = ['HVAC', 'Plumbing', 'Electrical', 'Appliances', 'Carpentry', 'General']
const MAX_PHOTOS = 5

/**
 * "New service request" modal. Selecting a unit auto-fills the tenant linked
 * to that unit. `onCreated` receives the created request.
 */
function MaintenanceFormModal({ onClose, onCreated }) {
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    priority: 'low',
    propertyId: '',
    unitId: '',
    tenantId: '',
    category: CATEGORIES[0],
  })
  const [tenantName, setTenantName] = useState('')
  const [photos, setPhotos] = useState([])
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  useEffect(() => {
    fetch(`${API}/properties`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProperties)
      .catch(() => {})
    fetch(`${API}/tenants`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setTenants)
      .catch(() => {})
  }, [])

  // Load units when property changes.
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

  // Auto-fill tenant from the selected unit.
  useEffect(() => {
    if (!form.unitId) {
      setTenantName('')
      setForm((f) => ({ ...f, tenantId: '' }))
      return
    }
    const match = tenants.find((t) => String(t.unit_id) === String(form.unitId))
    setTenantName(match?.full_name || '')
    setForm((f) => ({ ...f, tenantId: match?.id ? String(match.id) : '' }))
  }, [form.unitId, tenants])

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    const room = MAX_PHOTOS - photos.length
    files.slice(0, room).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => setPhotos((prev) => (prev.length < MAX_PHOTOS ? [...prev, reader.result] : prev))
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Please write the issue.')
    if (!form.propertyId) return setError('Please select a property.')
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${API}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ ...form, photos }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create request')
      }
      onCreated?.(await res.json())
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
          <h2 className="text-lg font-semibold text-gray-900">New service request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Write the issue"
            value={form.title}
            onChange={set('title')}
            className={`${fc} mb-5`}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="md:col-span-1">
              <label className={labelClass}>Priority</label>
              <select value={form.priority} onChange={set('priority')} className={fc}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden md:block" />

            <div>
              <label className={labelClass}>Property</label>
              <select
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value, unitId: '' }))}
                className={fc}
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
                onChange={set('unitId')}
                disabled={!form.propertyId}
                className={`${fc} disabled:opacity-60`}
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
              <label className={labelClass}>Tenant</label>
              <input type="text" placeholder="Tenant" value={tenantName} readOnly className={fc} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={set('category')} className={fc}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload photos */}
          <h3 className="text-base font-semibold text-gray-900 mt-7 mb-3">
            Upload photos (up to {MAX_PHOTOS})
          </h3>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-6">
            <div className="flex flex-wrap items-center gap-4">
              {photos.map((src, i) => (
                <div key={i} className="relative w-40 h-36 rounded-lg overflow-hidden border border-gray-200">
                  <img src={src} alt={`photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 min-w-[200px] flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-500"
                >
                  <span>{photos.length === 0 ? `Upload up to ${MAX_PHOTOS} photos` : 'Upload photos'}</span>
                  <span className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                  </span>
                  <span>Image</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFiles}
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 mt-6">
            <Info className="w-4 h-4 text-gray-400" />
            Tenants can also raise this from the tenant portal.
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit'}
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

export default MaintenanceFormModal
