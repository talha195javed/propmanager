import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ImageIcon, X } from 'lucide-react'

const API = 'http://localhost:5001/api'

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
const PROPERTY_TYPES = ['Residential', 'Commercial', 'Mixed use', 'Industrial']
const OPERATING_ACCOUNTS = ['ENBD operating **1434', 'ADCB operating **2290', 'Mashreq operating **7781']
const MANAGERS = ['Rashid M (Agent)', 'Ibrahim (Account Manager)', 'Unassigned']

const STEPS = ['Property details', 'Type & contact', 'Accounting & manager']

const fieldClass =
  'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none'
const labelClass = 'text-sm text-gray-700 pt-2'

function PropertyAdd() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const [form, setForm] = useState({
    imageUrl: '',
    title: '',
    units: '',
    address: '',
    city: 'Dubai',
    emirate: 'Dubai',
    propertyType: 'Commercial',
    phone: '+971 ',
    email: '',
    operatingAccount: OPERATING_ACCOUNTS[0],
    rentalInvoice: true,
    manager: MANAGERS[0],
  })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result }))
    reader.readAsDataURL(file)
  }

  const validateStep = () => {
    if (step === 1) {
      if (!form.imageUrl) return 'Property image is required.'
      if (!form.title.trim()) return 'Property name is required.'
      if (!form.address.trim()) return 'Address Line 1 is required.'
      if (!form.city || !form.emirate) return 'City and Emirate are required.'
    }
    if (step === 2) {
      if (!form.phone.trim()) return 'Phone number is required.'
    }
    return ''
  }

  const handleContinue = async () => {
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }
    setError('')

    if (step < 3) {
      setStep(step + 1)
      return
    }

    // Final step — create the property.
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          address: form.address,
          city: form.city,
          emirate: form.emirate,
          propertyType: form.propertyType,
          phone: form.phone,
          email: form.email,
          units: form.units,
          imageUrl: form.imageUrl,
          operatingAccount: form.operatingAccount,
          rentalInvoice: form.rentalInvoice,
          manager: form.manager,
          status: 'vacant',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to create property')
      }
      navigate('/admin/properties', { state: { created: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col -mx-4 -mt-2">
      {/* Wizard action bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setShowCancel(true)} className="hover:text-gray-800">
            Cancel
          </button>
          {step > 1 && (
            <>
              <span>/</span>
              <button onClick={() => setStep(step - 1)} className="hover:text-gray-800">
                Back
              </button>
            </>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900">Add Property</p>
        <button
          onClick={handleContinue}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-4 py-8">
        {STEPS.map((label, i) => {
          const num = i + 1
          const done = step > num
          const active = step === num
          return (
            <div key={label} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded-full border text-xs ${
                    done
                      ? 'border-blue-600 bg-white text-blue-600'
                      : active
                      ? 'border-gray-900 text-gray-900'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : num}
                </span>
                <span
                  className={`text-sm ${
                    done || active ? 'text-blue-600 font-medium' : 'text-gray-400'
                  } ${done ? 'text-blue-600' : ''}`}
                >
                  {label}
                </span>
              </div>
              {num < STEPS.length && <span className="text-gray-300">/</span>}
            </div>
          )
        })}
      </div>

      {/* Form card */}
      <div className="flex justify-center px-6 pb-16">
        <div className="w-full max-w-2xl border border-gray-200 rounded-xl p-8">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <Row label={<>Property Image<Req /></>}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-44 h-28 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400 hover:bg-gray-200 transition"
                >
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Property" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-7 h-7" />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </Row>
              <Row label={<>Property name<Req /></>}>
                <input
                  className={fieldClass}
                  placeholder="e.g. Marina heights unit 4B"
                  value={form.title}
                  onChange={set('title')}
                />
              </Row>
              <Row label="Units">
                <input
                  type="number"
                  className={fieldClass}
                  placeholder="Enter number of units"
                  value={form.units}
                  onChange={set('units')}
                />
              </Row>
              <Row label={<>Address Line 1<Req /></>}>
                <input
                  className={fieldClass}
                  placeholder="Street address"
                  value={form.address}
                  onChange={set('address')}
                />
              </Row>
              <Row label={<>City<Req /> / Emirate<Req /></>}>
                <div className="grid grid-cols-2 gap-3">
                  <select className={fieldClass} value={form.city} onChange={set('city')}>
                    {EMIRATES.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                  <select className={fieldClass} value={form.emirate} onChange={set('emirate')}>
                    {EMIRATES.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
              </Row>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <Row label="Property type">
                <select className={fieldClass} value={form.propertyType} onChange={set('propertyType')}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label={<>Phone number<Req /></>}>
                <input className={fieldClass} value={form.phone} onChange={set('phone')} />
              </Row>
              <Row label="Email address">
                <input
                  type="email"
                  className={fieldClass}
                  placeholder="e.g. contact@email.com"
                  value={form.email}
                  onChange={set('email')}
                />
              </Row>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <Row label="Default operating account">
                <select className={fieldClass} value={form.operatingAccount} onChange={set('operatingAccount')}>
                  {OPERATING_ACCOUNTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="">
                <label className="flex items-start gap-3 border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rentalInvoice}
                    onChange={(e) => setForm((f) => ({ ...f, rentalInvoice: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-blue-600"
                  />
                  <span>
                    <span className="block text-sm text-gray-900">Turn on rental invoice (auto-generated)</span>
                    <span className="block text-xs text-gray-500">Auto-creates recurring rental invoices.</span>
                  </span>
                </label>
              </Row>
              <Row label="Who manages this property">
                <select className={fieldClass} value={form.manager} onChange={set('manager')}>
                  {MANAGERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Row>
            </div>
          )}
        </div>
      </div>

      {/* Cancel confirmation */}
      {showCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Cancel property</h2>
              <button onClick={() => setShowCancel(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this property? All the saved data cannot be restored again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/properties')}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowCancel(false)}
                className="px-5 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 items-start">
      <span className={labelClass}>{label}</span>
      <div>{children}</div>
    </div>
  )
}

function Req() {
  return <span className="text-red-500">*</span>
}

export default PropertyAdd
