import { useState, useEffect } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { API, authHeader } from './leaseUtils'
import TaskFormModal from './TaskFormModal'

const PRIORITY_FILTERS = ['All', 'High', 'Medium', 'Low']

function formatDueDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PriorityCell({ priority }) {
  const map = {
    high: 'text-red-600',
    medium: 'text-amber-500',
    low: 'text-blue-600',
  }
  const cls = map[priority] || 'text-gray-500'
  const label = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : '—'
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function StatusBadge({ status }) {
  if (status === 'open') {
    return (
      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
        Open
      </span>
    )
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200 text-gray-600">
      Closed
    </span>
  )
}

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('All')
  const [showFilter, setShowFilter] = useState(false)

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API}/tasks`, { headers: authHeader() })
      if (res.ok) setTasks(await res.json())
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const shown = filter === 'All' ? tasks : tasks.filter((t) => t.priority === filter.toLowerCase())

  const openCreate = () => {
    setEditing(null)
    setShowModal(true)
  }

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{tasks.length} task(s) in List</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowFilter((s) => !s)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {filter === 'All' ? 'Priority' : filter}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showFilter && (
              <div
                className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1"
                onMouseLeave={() => setShowFilter(false)}
              >
                {PRIORITY_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f)
                      setShowFilter(false)
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      filter === f ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New task
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <button
          onClick={openCreate}
          className="w-full flex flex-col items-center justify-center py-32 text-center"
        >
          <p className="font-semibold text-gray-900">No tasks yet</p>
          <p className="text-sm text-gray-500 mt-1">Click here to create a task</p>
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                {['Task', 'Assign to', 'Due date', 'Priority', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => {
                    setEditing(t)
                    setShowModal(true)
                  }}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{t.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.assign_to || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDueDate(t.due_date)}</td>
                  <td className="px-6 py-4">
                    <PriorityCell priority={t.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <TaskFormModal
          task={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            fetchTasks()
          }}
        />
      )}
    </div>
  )
}

export default Tasks
