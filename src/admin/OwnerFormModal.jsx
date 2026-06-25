import { useState } from 'react'
import { X, Info } from 'lucide-react'
import { useAuth } from '@/AuthContext'

const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
]

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'

const labelClass = 'block text-sm text-gray-600 mb-1.5'

/**
 * Shared modal for creating and editing an owner.
 * Pass `owner` to edit (prefills the form); omit it to create.
 * `onSaved` receives the created/updated owner record.
 */
function OwnerFormModal({ owner, onClose, onSaved }) {
  const { user } = useAuth()
  const isEdit = Boolean(owner)

  const [form, setForm] = useState({
    fullName: owner?.full_name || '',
    email: owner?.email || '',
    phone: owner?.phone || '',
    addressLine: owner?.address_line || '',
    city: owner?.city || '',
    emirate: owner?.emirate || '',
    company: owner?.company || '',
    accountManager: owner?.account_manager || user?.fullName || '',
    agent: owner?.agent || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Full name and email address are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const url = isEdit
        ? `http://localhost:5001/api/owners/${owner.id}`
        : 'http://localhost:5001/api/owners'
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save owner')
      }
      const saved = await response.json()
      onSaved?.(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit owner' : 'Add new owner'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8">
          {!isEdit && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-5">
              <Info className="w-4 h-4 text-gray-400" />
              Invite will be sent to owner with Auto generated password.
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
              <label className={labelClass}>Phone number</label>
              <input
                type="text"
                placeholder="+971"
                value={form.phone}
                onChange={update('phone')}
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

          {/* Address */}
          <h3 className="text-base font-semibold text-gray-900 mt-7 mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Address line</label>
              <input
                type="text"
                placeholder="e.g. Baniyas Square"
                value={form.addressLine}
                onChange={update('addressLine')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City / Emirates</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={form.city}
                  onChange={update('city')}
                  className={inputClass}
                />
                <select value={form.emirate} onChange={update('emirate')} className={inputClass}>
                  <option value="">Emirate</option>
                  {EMIRATES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-4 md:w-1/2 md:pr-2">
            <label className={labelClass}>Company (optional)</label>
            <input
              type="text"
              value={form.company}
              onChange={update('company')}
              className={inputClass}
            />
          </div>

          {/* Assignment */}
          <h3 className="text-base font-semibold text-gray-900 mt-7 mb-1">Assignment</h3>
          <p className="text-xs text-gray-500 mb-4 max-w-xl">
            Account Manager is chosen from your existing team members (added under Settings &amp;
            access) — not created here. Agent is the referring realtor, typed in.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Account Manager</label>
              <select
                value={form.accountManager}
                onChange={update('accountManager')}
                className={inputClass}
              >
                {user?.fullName && <option value={user.fullName}>{user.fullName}</option>}
                <option value="">Unassigned</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Agent</label>
              <input
                type="text"
                placeholder="External relator name"
                value={form.agent}
                onChange={update('agent')}
                className={inputClass}
              />
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

export default OwnerFormModal
