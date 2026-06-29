import { useState } from 'react'
import { ArrowRight, ChevronLeft, Check, ArrowUpRight } from 'lucide-react'
import { API, authHeader, formatDate } from './leaseUtils'
import { useAuth } from '@/AuthContext'

const PLANS = {
  starter: {
    label: 'Starter',
    tagline: 'Small landlords',
    monthly: 49,
    yearly: 490,
    unit: false,
    features: ['Up to 10 units', 'Community hub', 'Leases & payments', 'Maintenance tickets'],
    cta: 'Choose Starter',
  },
  pro: {
    label: 'Pro',
    tagline: 'Serious portfolios',
    monthly: 199,
    yearly: 1990,
    unit: false,
    highlight: true,
    features: ['Up to 50 units', 'Everything in Starter', 'Office mode (delegate)', 'Reports & analytics', 'Priority support'],
    cta: 'Choose Pro',
  },
  office: {
    label: 'Office plan',
    tagline: 'For property management companies — bring multiple landlords onto the platform',
    perUnit: 9,
    minimum: 499,
    unit: true,
    features: [],
    cta: 'Choose Sales',
  },
}

function SettingsBilling({ flash }) {
  const { user, updateUser } = useAuth()
  // Billing opens on the plans comparison; Back reveals the current-plan summary.
  const [showPlans, setShowPlans] = useState(true)
  const [cycle, setCycle] = useState(user?.billingCycle || 'monthly')

  const choosePlan = async (planKey, billingCycle) => {
    try {
      const res = await fetch(`${API}/auth/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ plan: planKey, billingCycle }),
      })
      if (!res.ok) throw new Error('Failed to update plan')
      const updated = await res.json()
      updateUser(updated)
      flash(`Switched to ${PLANS[planKey].label} (${billingCycle}).`)
      setShowPlans(false)
    } catch (err) {
      flash(err.message)
    }
  }

  if (showPlans) {
    return <AllPlans cycle={cycle} setCycle={setCycle} onBack={() => setShowPlans(false)} onChoose={choosePlan} />
  }

  const planKey = user?.plan && PLANS[user.plan] ? user.plan : 'pro'
  const plan = PLANS[planKey]
  const cycleLabel = (user?.billingCycle || 'monthly') === 'yearly' ? 'Yearly' : 'Monthly'
  const lastBilling = user?.planStarted || user?.createdAt

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500">For questions about billing, contact us</p>
        </div>
        <button
          onClick={() => setShowPlans(true)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          All plans <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Current plan */}
      <div className="border border-gray-200 rounded-xl p-5 flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-900">
            {plan.label} ({cycleLabel})
          </p>
          <p className="text-sm text-gray-500">Last Billing Date: {formatDate(lastBilling)}</p>
        </div>
        <span className="text-sm text-gray-500">
          {(user?.billingCycle || 'monthly') === 'yearly' ? '1 year' : '1 month'}
        </span>
      </div>

      {/* Upgrade card */}
      <div className="border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Upgrade to Yearly plan</p>
            <p className="text-sm text-gray-500">199.00 AED/mo</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPlans(true)} className="text-sm text-gray-600 hover:text-gray-800">
              View all plans
            </button>
            <button
              onClick={() => choosePlan('pro', 'yearly')}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Upgrade now
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-8 mt-4 max-w-md">
          {['Office mode (delegate)', 'Reports & analytics', 'Priority support', 'Everything in Starter'].map((f) => (
            <span key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-gray-500" />
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Recent invoices */}
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent invoices</h3>
      <div className="border border-gray-200 rounded-xl p-6 text-sm text-gray-400">No invoices yet</div>
    </div>
  )
}

function priceBlock(plan, cycle) {
  if (plan.unit) {
    return (
      <div>
        <p className="text-2xl font-bold text-gray-900">
          AED {plan.perUnit} <span className="text-sm font-normal text-gray-500">/ unit / month</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">AED {plan.minimum} minimum</p>
      </div>
    )
  }
  const price = cycle === 'yearly' ? plan.yearly : plan.monthly
  return (
    <p className="text-2xl font-bold text-gray-900">
      AED {price} <span className="text-sm font-normal text-gray-500">/ {cycle === 'yearly' ? 'year' : 'month'}</span>
    </p>
  )
}

function AllPlans({ cycle, setCycle, onBack, onChoose }) {
  return (
    <div>
      <div className="border-b border-gray-100 pb-4 mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500">For questions about billing, contact us</p>
      </div>

      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 mb-8">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Monthly / Yearly toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm ${cycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Monthly</span>
        <button
          onClick={() => setCycle(cycle === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-11 h-6 rounded-full transition ${cycle === 'yearly' ? 'bg-blue-600' : 'bg-blue-600'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition ${
              cycle === 'yearly' ? 'translate-x-5' : ''
            }`}
          />
        </button>
        <span className={`text-sm ${cycle === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Yearly</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {Object.entries(PLANS).map(([key, plan]) => (
          <div
            key={key}
            className={`rounded-xl border p-6 flex flex-col ${
              plan.highlight ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/40'
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-900">{plan.label}</h3>
            <p className="text-sm text-gray-500 mb-5 min-h-[40px]">{plan.tagline}</p>
            <div className="border-b border-gray-200 pb-4 mb-4">{priceBlock(plan, cycle)}</div>
            <ul className="space-y-2 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-gray-500" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onChoose(key, cycle)}
              className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-medium transition ${
                plan.highlight
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-300 text-gray-800 hover:bg-white'
              }`}
            >
              {plan.cta} <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        Note: tenants are always free. They join when their landlord or office invites them.
      </p>
    </div>
  )
}

export default SettingsBilling
