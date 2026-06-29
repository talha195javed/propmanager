import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Search, ChevronDown, ArrowUpDown, Check } from 'lucide-react'
import { API, authHeader, termRange, money } from './leaseUtils'
import LeaseWizardModal from './LeaseWizardModal'

function Lease() {
  const navigate = useNavigate()
  const location = useLocation()

  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [wizardInit, setWizardInit] = useState(null)
  const [success, setSuccess] = useState(false)

  const fetchLeases = async () => {
    try {
      const res = await fetch(`${API}/leases`, { headers: authHeader() })
      if (res.ok) setLeases(await res.json())
    } catch (error) {
      console.error('Error fetching leases:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeases()
  }, [])

  // Open the wizard pre-filled when arriving from a tenant's "Create lease".
  useEffect(() => {
    if (location.state?.createFor) {
      setWizardInit(location.state.createFor)
      setShowWizard(true)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const filtered = leases.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.property_name?.toLowerCase().includes(q) ||
      l.tenant_name?.toLowerCase().includes(q) ||
      String(l.annual_rent || '').includes(q)
    )
  })

  const unitLabel = (l) =>
    l.unit_name ? `${l.property_name} ${l.unit_name}` : l.property_name || '—'

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500 whitespace-nowrap">{leases.length} lease(s) in List</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for property name, amount.."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
            Active
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
            <ArrowUpDown className="w-4 h-4" />
            Sort by
          </button>
          <button
            onClick={() => {
              setWizardInit(null)
              setShowWizard(true)
            }}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New lease
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading leases...</div>
      ) : leases.length === 0 ? (
        <button
          onClick={() => {
            setWizardInit(null)
            setShowWizard(true)
          }}
          className="w-full flex flex-col items-center justify-center py-32 text-center"
        >
          <p className="font-semibold text-gray-900">No leases yet</p>
          <p className="text-sm text-gray-500 mt-1">Click here to create a lease</p>
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                {['Unit', 'Tenant', 'Term', 'Rent', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => navigate(`/admin/lease/${l.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{unitLabel(l)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{l.tenant_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {termRange(l.start_date, l.lease_length)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {money(l.annual_rent)}
                    {l.payment_schedule ? ` / ${l.payment_schedule}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                      {l.status === 'active' ? 'Active' : l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showWizard && (
        <LeaseWizardModal
          initialValues={wizardInit}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false)
            setSuccess(true)
            fetchLeases()
          }}
        />
      )}

      {success && <LeaseSuccessModal onDone={() => setSuccess(false)} />}
    </div>
  )
}

function LeaseSuccessModal({ onDone }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg px-8 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Lease created &amp; sent for signature</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          On tenant activation the signed lease links to the tenant profile, tenant &amp; owner
          portals, accounting, maintenance and documents.
        </p>
        <button
          onClick={onDone}
          className="mt-6 px-8 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Done
        </button>
      </div>
    </div>
  )
}

export default Lease
