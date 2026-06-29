import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowRight, Info, X } from 'lucide-react'
import { API, authHeader, money } from './leaseUtils'
import TenantFormModal from './TenantFormModal'
import TaskFormModal from './TaskFormModal'

const EMPTY = {
  rentalListings: { totalUnits: 0, occupied: 0, vacant: 0, booked: 0 },
  overview: { overduePayments: 0, openMaintenance: 0 },
  outstanding: { total: 0, items: [] },
  tasks: { count: 0, items: [] },
  expiringLeases: { '0-30': 0, '31-60': 0, '61-90': 0, all: 0 },
  recentActivity: [],
}

function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [showTenant, setShowTenant] = useState(false)
  const [showTask, setShowTask] = useState(false)
  const [toast, setToast] = useState('')

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, { headers: authHeader() })
      if (res.ok) setData(await res.json())
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) return <div className="p-12 text-center text-gray-500">Loading dashboard...</div>

  return (
    <div>
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3 text-sm text-gray-700">
          <Info className="w-4 h-4 text-blue-600" />
          {toast}
          <button onClick={() => setToast('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 border-b border-gray-100">
          <RentalListings data={data.rentalListings} onOpen={() => navigate('/admin/properties')} />
          <Overview data={data.overview} />
          <QuickAccess
            navigate={navigate}
            onAddTenant={() => setShowTenant(true)}
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 border-b border-gray-100">
          <Outstanding data={data.outstanding} navigate={navigate} />
          <Tasks
            data={data.tasks}
            onOpen={() => navigate('/admin/tasks')}
            onNew={() => setShowTask(true)}
          />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          <ExpiringLeases data={data.expiringLeases} onOpen={() => navigate('/admin/lease')} />
          <RecentActivity
            items={data.recentActivity}
            navigate={navigate}
            onCompose={() => navigate('/admin/messages')}
          />
        </div>
      </div>

      {showTenant && (
        <TenantFormModal
          onClose={() => setShowTenant(false)}
          onSaved={() => {
            setShowTenant(false)
            setToast('Tenant has been added successfully.')
            fetchDashboard()
          }}
        />
      )}
      {showTask && (
        <TaskFormModal
          onClose={() => setShowTask(false)}
          onSaved={() => {
            setShowTask(false)
            setToast('Task created.')
            fetchDashboard()
          }}
        />
      )}
    </div>
  )
}

/* ---------- Shared bits ---------- */

function SectionHeader({ title, onOpen, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {onOpen && (
          <button
            onClick={onOpen}
            className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {right}
    </div>
  )
}

const PRIORITY_CLS = { high: 'text-red-600', medium: 'text-amber-500', low: 'text-blue-600' }

/* ---------- Row 1 ---------- */

function RentalListings({ data, onOpen }) {
  const { totalUnits, occupied, vacant, booked } = data
  const denom = totalUnits || 1
  const seg = (n) => `${(n / denom) * 100}%`

  return (
    <div className="p-6">
      <SectionHeader title="Rental listings" onOpen={onOpen} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Total units</span>
        <span className="text-xl font-bold text-gray-900">{totalUnits}</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-5">
        <div style={{ width: seg(occupied) }} className="bg-purple-600" />
        <div style={{ width: seg(vacant) }} className="bg-purple-300" />
        <div style={{ width: seg(booked) }} className="bg-cyan-500" />
      </div>
      <LegendRow color="bg-purple-600" label="Occupied units" value={occupied} />
      <LegendRow color="bg-purple-300" label="Vacant units" value={vacant} />
      <LegendRow color="bg-cyan-500" label="Booked" value={booked} />
    </div>
  )
}

function LegendRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

function Overview({ data }) {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-gray-900">Overview</h2>
      <p className="text-sm text-gray-400 mb-4">than last month</p>
      <div className="grid grid-cols-2 gap-4">
        <OverviewBox
          label="Overdue payments"
          value={data.overduePayments}
          note={data.overduePayments === 0 ? 'All clear' : 'Needs attention'}
          ok={data.overduePayments === 0}
        />
        <OverviewBox
          label="Open maintenance"
          value={data.openMaintenance}
          note={data.openMaintenance === 0 ? 'All clear' : 'Needs attention'}
          ok={data.openMaintenance === 0}
        />
      </div>
    </div>
  )
}

function OverviewBox({ label, value, note, ok }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-3xl font-semibold text-gray-900 my-2">{value}</p>
      <p className={`text-sm ${ok ? 'text-green-600' : 'text-red-500'}`}>{note}</p>
    </div>
  )
}

function QuickAccess({ navigate, onAddTenant }) {
  const links = [
    { label: 'Add new property', action: () => navigate('/admin/properties/new') },
    { label: 'Add quick tenant', action: onAddTenant },
    { label: 'Create rental invoice', action: () => navigate('/admin/payments') },
    { label: 'Create invoice (tenant)', action: () => navigate('/admin/payments') },
  ]
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Quick access</h2>
      <div className="space-y-1">
        {links.map((l) => (
          <button
            key={l.label}
            onClick={l.action}
            className="w-full flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 group"
          >
            <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
              {l.label}
            </span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Row 2 ---------- */

function Outstanding({ data, navigate }) {
  const items = data.items || []
  return (
    <div className="p-6">
      <SectionHeader title="Outstanding balance" onOpen={() => navigate('/admin/payments')} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">Outstanding balances</span>
        <span className="text-lg font-bold text-gray-900">{money(data.total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No outstanding balances.</p>
      ) : (
        <>
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => navigate(`/admin/properties/${it.id}`)}
              className="w-full flex items-center justify-between py-3 border-b border-gray-50"
            >
              <span className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate max-w-[60%] text-left">
                {it.name}
              </span>
              <span className="text-sm text-gray-900">{money(it.amount)}</span>
            </button>
          ))}
          <p className="text-sm text-gray-500 mt-3">
            Showing {items.length} of {items.length} total results
          </p>
        </>
      )}
    </div>
  )
}

function Tasks({ data, onOpen, onNew }) {
  const items = data.items || []
  return (
    <div className="p-6">
      <SectionHeader
        title={`Tasks (${data.count})`}
        onOpen={onOpen}
        right={
          <button onClick={onNew} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            + New task
          </button>
        }
      />
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No open tasks.</p>
      ) : (
        items.map((t) => (
          <button
            key={t.id}
            onClick={onOpen}
            className="w-full flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-left"
          >
            <div className="flex items-start gap-3">
              <span className="w-4 h-4 mt-0.5 rounded-full border border-gray-300 shrink-0" />
              <div>
                <p className="text-sm text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-500">
                  {t.assign_to ? `Assigned to ${t.assign_to}` : 'Unassigned'}
                </p>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 text-xs ${PRIORITY_CLS[t.priority] || 'text-gray-500'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : ''}
            </span>
          </button>
        ))
      )}
    </div>
  )
}

/* ---------- Row 3 ---------- */

const WINDOWS = [
  { key: '0-30', label: '0-30 days' },
  { key: '31-60', label: '31-60 days' },
  { key: '61-90', label: '61-90 days' },
  { key: 'all', label: 'All' },
]

function ExpiringLeases({ data, onOpen }) {
  const [win, setWin] = useState('0-30')
  const notStarted = data[win] || 0
  const rows = [
    { label: 'Not started', value: notStarted, active: true },
    { label: 'Offers', value: 0 },
    { label: 'Renewals', value: 0 },
    { label: 'Move-Outs', value: 0 },
  ]
  const max = Math.max(1, ...rows.map((r) => r.value))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <SectionHeader title="Expiring leases" onOpen={onOpen} />
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setWin(w.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                win === w.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-4">
            <span className="text-sm text-gray-600 w-24 shrink-0">{r.label}</span>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 h-6 rounded bg-gray-50 overflow-hidden">
                {r.value > 0 && (
                  <div
                    className="h-full rounded bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                )}
              </div>
              <span className="text-sm text-gray-700 w-4">{r.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivity({ items, navigate, onCompose }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
        <button onClick={onCompose} className="text-sm font-medium text-blue-600 hover:text-blue-700">
          + Compose email
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">Last 7 days • {items.length} items</p>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No recent activity.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => (
            <div key={i} className="flex items-start justify-between gap-4 bg-gray-50 rounded-lg p-3">
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 mb-1">
                  {a.type}
                </span>
                <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                <p className="text-xs text-gray-500 truncate">{a.subtitle}</p>
              </div>
              <button
                onClick={() => navigate(a.link)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-white shrink-0"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
