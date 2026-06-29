import { useState, useEffect } from 'react'
import { ChevronLeft, Check, X } from 'lucide-react'
import { API, authHeader, formatDate } from './leaseUtils'

const ADMIN_TYPES = [
  { value: 'super_admin', label: 'Super admin' },
  { value: 'view_only', label: 'View only' },
  { value: 'custom', label: 'Custom' },
]
const adminLabel = (v) => ADMIN_TYPES.find((t) => t.value === v)?.label || v

const ENTITIES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'owners', label: 'Owners' },
  { key: 'tenants', label: 'Tenants' },
  { key: 'lease', label: 'Lease' },
  { key: 'payments', label: 'Payments' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'message', label: 'Message' },
  { key: 'roles', label: 'Role and permissions' },
]
const ACTIONS = ['read', 'create', 'edit', 'delete']

function dmy(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

function StatusBadge({ status }) {
  const active = status === 'active'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {active && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function SettingsRoles({ flash }) {
  const [members, setMembers] = useState([])
  const [properties, setProperties] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [showNew, setShowNew] = useState(false)

  const fetchMembers = async () => {
    const res = await fetch(`${API}/team`, { headers: authHeader() })
    if (res.ok) setMembers(await res.json())
  }

  useEffect(() => {
    fetchMembers()
    fetch(`${API}/properties`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProperties)
      .catch(() => {})
  }, [])

  const selected = members.find((m) => m.id === selectedId)

  return (
    <div>
      <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Roles and permission</h1>
          <p className="text-sm text-gray-500">Manage team members and their access</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + New user
        </button>
      </div>

      {selected ? (
        <MemberDetail
          member={selected}
          properties={properties}
          onBack={() => setSelectedId(null)}
          onChanged={fetchMembers}
          flash={flash}
        />
      ) : (
        <MemberList members={members} onOpen={setSelectedId} />
      )}

      {showNew && (
        <NewUserModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            fetchMembers()
            flash('User added.')
          }}
        />
      )}
    </div>
  )
}

function MemberList({ members, onOpen }) {
  if (members.length === 0) {
    return <p className="py-16 text-center text-sm text-gray-400">No team members yet. Add one with “+ New user”.</p>
  }
  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-gray-200">
          <tr>
            {['Name', 'Email address', 'Admin type', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {members.map((m) => (
            <tr key={m.id} onClick={() => onOpen(m.id)} className="hover:bg-gray-50 cursor-pointer">
              <td className="px-4 py-4 text-sm text-gray-900">{m.full_name}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{m.email}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{adminLabel(m.admin_type)}</td>
              <td className="px-4 py-4">
                <StatusBadge status={m.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MemberDetail({ member, properties, onBack, onChanged, flash }) {
  const [tab, setTab] = useState('property')
  const [perms, setPerms] = useState(member.permissions || {})
  const [propPerms, setPropPerms] = useState(member.property_permissions || {})
  const [adminType, setAdminType] = useState(member.admin_type)

  const save = async (patch) => {
    const res = await fetch(`${API}/team/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setPerms(updated.permissions || {})
      setPropPerms(updated.property_permissions || {})
      setAdminType(updated.admin_type)
      onChanged()
    }
  }

  const changeAdminType = (value) => {
    setAdminType(value)
    save({ adminType: value })
    flash('Admin type updated.')
  }

  const togglePerm = (entity, action) => {
    const next = {
      ...perms,
      [entity]: { ...(perms[entity] || {}), [action]: !perms[entity]?.[action] },
    }
    setPerms(next)
    save({ permissions: next, adminType: 'custom' })
  }

  const toggleProp = (propId) => {
    const next = { ...propPerms, [propId]: !propPerms[propId] }
    setPropPerms(next)
    save({ propertyPermissions: next })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{member.full_name}</h2>
      </div>

      <select
        value={adminType}
        onChange={(e) => changeAdminType(e.target.value)}
        className="mb-5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs"
      >
        {ADMIN_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-3 max-w-4xl mb-6">
        <Info label="Email address" value={member.email} />
        <Info label="Status" value={<StatusBadge status={member.status} />} />
        <Info label="Phone number" value={member.phone || '—'} />
        <Info label="Emirates ID" value={member.emirates_id || '—'} />
        <Info label="DOB" value={dmy(member.dob)} />
        <Info label="Added on" value={formatDate(member.created_at)} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6 mb-4">
        <TabButton active={tab === 'property'} onClick={() => setTab('property')}>
          Property permission
        </TabButton>
        <TabButton active={tab === 'permissions'} onClick={() => setTab('permissions')}>
          Permissions
        </TabButton>
      </div>

      {tab === 'property' ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                {['Property', 'Landlord', 'Admins who have access', 'Access (View only)'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                    No properties yet.
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">NA</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleProp(p.id)}
                        className={`relative w-9 h-5 rounded-full transition ${
                          propPerms[p.id] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition ${
                            propPerms[p.id] ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Entity</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-6 py-3 text-left text-xs font-medium text-gray-500 capitalize">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ENTITIES.map((e) => (
                <tr key={e.key}>
                  <td className="px-6 py-3.5 text-sm text-gray-900">{e.label}</td>
                  {ACTIONS.map((a) => {
                    const on = Boolean(perms[e.key]?.[a])
                    return (
                      <td key={a} className="px-6 py-3.5">
                        <button onClick={() => togglePerm(e.key, a)} aria-label={`${e.label} ${a}`}>
                          {on ? (
                            <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-gray-300 block" />
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="flex items-start gap-8">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
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

const fc =
  'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'

function NewUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '+971',
    emiratesId: '',
    dob: '',
    adminType: 'view_only',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async () => {
    if (!form.fullName.trim() || !form.email.trim()) return setError('Name and email are required.')
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`${API}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to add user')
      }
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">Add new user</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <input placeholder="Full name" value={form.fullName} onChange={set('fullName')} className={`${fc} mb-4`} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Labeled label="Email address">
            <input type="email" placeholder="e.g. john@email.com" value={form.email} onChange={set('email')} className={fc} />
          </Labeled>
          <Labeled label="Phone number">
            <input value={form.phone} onChange={set('phone')} className={fc} />
          </Labeled>
          <Labeled label="Emirates ID">
            <input value={form.emiratesId} onChange={set('emiratesId')} className={fc} />
          </Labeled>
          <Labeled label="DOB">
            <input type="date" value={form.dob} onChange={set('dob')} className={fc} />
          </Labeled>
          <Labeled label="Admin type">
            <select value={form.adminType} onChange={set('adminType')} className={fc}>
              {ADMIN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Labeled>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={submit}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add user'}
          </button>
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Labeled({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default SettingsRoles
