import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { API, authHeader } from './leaseUtils'

const STEPS = ['Parties & property', 'Term & rent', 'Deposit', 'Clauses']
const REGIONS = [
  'Dubai - Ejari tenancy contract',
  'Abu Dhabi - Tawtheeq',
  'Sharjah - tenancy contract',
]
const LEASE_TYPES = ['Yearly', 'Monthly']
const LEASE_LENGTHS = ['12 months', '6 months', '24 months']
const PAYMENT_SCHEDULES = [
  'Quarterly (4 cheques)',
  'Monthly (12 cheques)',
  'Half-yearly (2 cheques)',
  'Annual (1 cheque)',
]

const fc =
  'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
const labelClass = 'block text-sm text-gray-600 mb-1.5'

/**
 * 4-step Create-lease wizard. `initialValues` (from a tenant's "Create lease")
 * pre-selects the tenant/property/unit. `onComplete` receives the saved lease.
 */
function LeaseWizardModal({ initialValues, onClose, onComplete }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [owners, setOwners] = useState([])
  const [tenants, setTenants] = useState([])
  const [properties, setProperties] = useState([])
  const [units, setUnits] = useState([])

  const [form, setForm] = useState({
    region: REGIONS[0],
    landlordOwnerId: '',
    tenantId: initialValues?.tenantId ? String(initialValues.tenantId) : '',
    propertyId: initialValues?.propertyId ? String(initialValues.propertyId) : '',
    unitId: initialValues?.unitId ? String(initialValues.unitId) : '',
    leaseType: 'Yearly',
    leaseLength: '12 months',
    startDate: '',
    rentalInvoiceDate: '',
    annualRent: '',
    paymentSchedule: PAYMENT_SCHEDULES[0],
    securityDeposit: '',
    keyDeposit: '',
    clauses: '',
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  // Load dropdown data in parallel.
  useEffect(() => {
    const load = async (path, setter) => {
      try {
        const r = await fetch(`${API}/${path}`, { headers: authHeader() })
        if (r.ok) setter(await r.json())
      } catch (e) {
        /* ignore */
      }
    }
    load('owners', setOwners)
    load('tenants', setTenants)
    load('properties', setProperties)
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

  const validateStep = () => {
    if (step === 1) {
      if (!form.tenantId) return 'Please select a tenant.'
      if (!form.propertyId) return 'Please select a property.'
    }
    if (step === 2) {
      if (!form.startDate) return 'Lease start date is required.'
      if (!form.annualRent) return 'Annual rent is required.'
    }
    return ''
  }

  const next = () => {
    const v = validateStep()
    if (v) return setError(v)
    setError('')
    setStep((s) => s + 1)
  }

  const back = () => {
    setError('')
    setStep((s) => s - 1)
  }

  const complete = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${API}/leases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create lease')
      }
      onComplete?.(await res.json())
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
          <h2 className="text-lg font-semibold text-gray-900">Create lease</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center px-8 pt-4 pb-6">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = n < step
            const active = n === step
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      done
                        ? 'bg-blue-600 text-white'
                        : active
                        ? 'border-2 border-gray-900 text-gray-900'
                        : 'border border-gray-300 text-gray-400'
                    }`}
                  >
                    {done ? <Check className="w-3 h-3" /> : n}
                  </span>
                  <span
                    className={`text-sm whitespace-nowrap ${
                      done ? 'text-blue-600' : active ? 'font-medium text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {n < STEPS.length && <div className="flex-1 h-px bg-gray-200 mx-3" />}
              </div>
            )
          })}
        </div>

        <div className="px-8 pb-8 min-h-[260px]">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="md:w-1/2 md:pr-2">
                <label className={labelClass}>Region</label>
                <select value={form.region} onChange={set('region')} className={fc}>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Landlord / owner</label>
                  <select value={form.landlordOwnerId} onChange={set('landlordOwnerId')} className={fc}>
                    <option value="">Select owner</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.company || o.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tenant</label>
                  <select value={form.tenantId} onChange={set('tenantId')} className={fc}>
                    <option value="">Select tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Lease type</label>
                <select value={form.leaseType} onChange={set('leaseType')} className={fc}>
                  {LEASE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Lease length</label>
                <select value={form.leaseLength} onChange={set('leaseLength')} className={fc}>
                  {LEASE_LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Lease start date</label>
                <input type="date" value={form.startDate} onChange={set('startDate')} className={fc} />
              </div>
              <div>
                <label className={labelClass}>Rental invoice date</label>
                <input
                  type="date"
                  value={form.rentalInvoiceDate}
                  onChange={set('rentalInvoiceDate')}
                  className={fc}
                />
              </div>
              <div>
                <label className={labelClass}>Annual rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">AED</span>
                  <input
                    type="number"
                    value={form.annualRent}
                    onChange={set('annualRent')}
                    className={`${fc} pl-12`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Payment schedule</label>
                <select value={form.paymentSchedule} onChange={set('paymentSchedule')} className={fc}>
                  {PAYMENT_SCHEDULES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Security deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">AED</span>
                  <input
                    type="number"
                    value={form.securityDeposit}
                    onChange={set('securityDeposit')}
                    className={`${fc} pl-12`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Key deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">AED</span>
                  <input
                    type="number"
                    value={form.keyDeposit}
                    onChange={set('keyDeposit')}
                    className={`${fc} pl-12`}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <label className={labelClass}>Additional terms / clauses</label>
              <textarea
                rows={6}
                placeholder="type here"
                value={form.clauses}
                onChange={set('clauses')}
                className={fc}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-8 pb-8">
          {step < STEPS.length ? (
            <button
              onClick={next}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={complete}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Complete'}
            </button>
          )}
          {step > 1 && (
            <button
              onClick={back}
              className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default LeaseWizardModal
