import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserRound } from 'lucide-react'
import OwnerFormModal from './OwnerFormModal'

function Owners() {
  const navigate = useNavigate()
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOwners()
  }, [])

  const fetchOwners = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5001/api/owners', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        setOwners(await response.json())
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaved = (owner) => {
    setShowModal(false)
    fetchOwners()
    if (owner?.id) navigate(`/admin/owners/${owner.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{owners.length} owner(s) in List</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add owner
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading owners...</div>
      ) : owners.length === 0 ? (
        // Empty state
        <button
          onClick={() => setShowModal(true)}
          className="w-full flex flex-col items-center justify-center py-28 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center mb-5">
            <UserRound className="w-8 h-8 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">No owners added yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Click here to create owner to map property
          </p>
        </button>
      ) : (
        // Owners table
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  {['Owner', 'Unique ID', 'Email address', 'Phone number', 'Properties owned', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {owners.map((owner) => (
                  <tr
                    key={owner.id}
                    onClick={() => navigate(`/admin/owners/${owner.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {owner.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{owner.unique_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{owner.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{owner.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{owner.properties_owned}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={owner.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <OwnerFormModal onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

export function StatusBadge({ status }) {
  const active = status === 'active'
  return (
    <span
      className={`inline-block px-3 py-1 rounded-md text-xs font-medium border ${
        active
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default Owners
