import { useState, useRef } from 'react'
import { UserRound, Lock, Layers, CreditCard, X, Info } from 'lucide-react'
import { API, authHeader } from './leaseUtils'
import { useAuth } from '@/AuthContext'
import SettingsRoles from './SettingsRoles'
import SettingsBilling from './SettingsBilling'

const NAV = [
  { key: 'general', label: 'General information', icon: UserRound },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'roles', label: 'Roles and Permissions', icon: Layers },
  { key: 'billing', label: 'Billing', icon: CreditCard },
]

function Settings() {
  const [section, setSection] = useState('general')
  const [toast, setToast] = useState('')

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="-m-4 -mt-2">
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 text-sm text-gray-700">
          <Info className="w-4 h-4 text-blue-600" />
          {toast}
          <button onClick={() => setToast('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex min-h-[calc(100vh-7rem)]">
        {/* Sub-nav */}
        <aside className="w-72 border-r border-gray-200 p-4 shrink-0">
          <nav className="space-y-1">
            {NAV.map((n) => {
              const Icon = n.icon
              const active = section === n.key
              return (
                <button
                  key={n.key}
                  onClick={() => setSection(n.key)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm ${
                    active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 p-8">
          {section === 'general' && <GeneralInformation flash={flash} />}
          {section === 'security' && <Security flash={flash} />}
          {section === 'roles' && <SettingsRoles flash={flash} />}
          {section === 'billing' && <SettingsBilling flash={flash} />}
        </section>
      </div>
    </div>
  )
}

/* ---------- General information ---------- */

const inputClass =
  'px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'

function GeneralInformation({ flash }) {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    emiratesId: user?.emiratesId || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || '',
    dob: user?.dob ? user.dob.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, avatarUrl: reader.result }))
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      const updated = await res.json()
      updateUser(updated)
      flash('Profile updated.')
    } catch (err) {
      flash(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
      <p className="text-sm text-gray-500 border-b border-gray-100 pb-4 mb-2">
        Edit all your basic information
      </p>

      <Row label="Profile picture">
        <button onClick={() => fileRef.current?.click()} className="block">
          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-sm text-gray-500">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.fullName || 'U').charAt(0).toUpperCase()
            )}
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
      </Row>

      <Row label="Email">
        <span className="text-sm text-gray-900">{user?.email}</span>
      </Row>

      <Row label="Full name">
        <input value={form.fullName} onChange={set('fullName')} className={`${inputClass} w-56`} />
      </Row>

      <Row label="Emirates ID">
        <input value={form.emiratesId} onChange={set('emiratesId')} className={`${inputClass} w-56`} />
      </Row>

      <Row label="Phone">
        <input value={form.phone} onChange={set('phone')} className={`${inputClass} w-56`} />
      </Row>

      <div className="flex justify-end mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>
      <div>{children}</div>
    </div>
  )
}

/* ---------- Security ---------- */

function Security({ flash }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Security</h1>
      <p className="text-sm text-gray-500 border-b border-gray-100 pb-4 mb-2">
        Update your password securely
      </p>
      <div className="flex items-center justify-between py-4">
        <span className="text-sm font-medium text-gray-900">Password</span>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Change password
        </button>
      </div>
      {showModal && <ChangePasswordModal onClose={() => setShowModal(false)} flash={flash} />}
    </div>
  )
}

const pwInput =
  'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'

function ChangePasswordModal({ onClose, flash }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async () => {
    if (!form.currentPassword || !form.newPassword) return setError('All fields are required.')
    if (form.newPassword !== form.confirm) return setError('Passwords do not match.')
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to change password')
      flash('Password updated successfully.')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">Change password</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Field label="Current password">
            <input type="password" value={form.currentPassword} onChange={set('currentPassword')} className={pwInput} />
          </Field>
          <Field label="New password">
            <input type="password" value={form.newPassword} onChange={set('newPassword')} className={pwInput} />
          </Field>
          <Field label="Confirm password">
            <input type="password" value={form.confirm} onChange={set('confirm')} className={pwInput} />
          </Field>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={submit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-4">
      <label className="text-sm text-gray-700">{label}</label>
      {children}
    </div>
  )
}

export default Settings
