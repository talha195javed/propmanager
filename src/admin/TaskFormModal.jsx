import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import { API, authHeader } from './leaseUtils'

const fc =
  'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50'
const labelClass = 'block text-sm text-gray-600 mb-1.5'
const PRIORITIES = ['low', 'medium', 'high']

/**
 * Create / edit modal for a task.
 * Pass `task` to edit (adds the "Close task" toggle + Update/Close buttons).
 * `onSaved` receives the created/updated task.
 */
function TaskFormModal({ task, onClose, onSaved }) {
  const isEdit = Boolean(task)

  const [form, setForm] = useState({
    title: task?.title || '',
    assignTo: task?.assign_to || '',
    dueDate: task?.due_date ? task.due_date.slice(0, 10) : '',
    priority: task?.priority || 'low',
    relatedPropertyId: task?.related_property_id ? String(task.related_property_id) : '',
    notificationEmails: task?.notification_emails || '',
    status: task?.status || 'open',
  })
  const [properties, setProperties] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const closed = form.status === 'closed'

  useEffect(() => {
    fetch(`${API}/properties`, { headers: authHeader() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setProperties)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Task title is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = isEdit ? `${API}/tasks/${task.id}` : `${API}/tasks`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save task')
      }
      onSaved?.(await res.json())
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
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit task' : 'Create task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Title + (edit) close toggle */}
          <div className="flex items-start gap-6 mb-5">
            <input
              type="text"
              placeholder="Task title"
              value={form.title}
              onChange={set('title')}
              disabled={closed}
              className={`${fc} flex-1`}
            />
            {isEdit && (
              <label className="flex items-center gap-3 shrink-0 pt-2">
                <span className="text-sm text-gray-700">Close task</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, status: f.status === 'closed' ? 'open' : 'closed' }))
                  }
                  className={`relative w-10 h-5 rounded-full transition ${
                    closed ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition ${
                      closed ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className={labelClass}>Assign to (internal member)</label>
              <input
                type="text"
                placeholder="e.g. Rashid"
                value={form.assignTo}
                onChange={set('assignTo')}
                disabled={closed}
                className={fc}
              />
            </div>
            <div>
              <label className={labelClass}>Due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={set('dueDate')}
                disabled={closed}
                className={fc}
              />
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={form.priority}
                onChange={set('priority')}
                disabled={closed}
                className={fc}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Related to (optional)</label>
              <select
                value={form.relatedPropertyId}
                onChange={set('relatedPropertyId')}
                disabled={closed}
                className={fc}
              >
                <option value="">None</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notification emails */}
          <h3 className="text-base font-semibold text-gray-900 mt-7 mb-4 border-b border-gray-100 pb-2">
            Notification emails (comma-separated)
          </h3>
          <div className="md:w-2/3">
            <label className={labelClass}>Notification emails</label>
            <input
              type="text"
              placeholder="a@example.com, b@example.com"
              value={form.notificationEmails}
              onChange={set('notificationEmails')}
              disabled={closed}
              className={fc}
            />
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-500 mt-8">
            <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span>
              Created standalone here (no service request). Tasks may also be generated from a
              service request and re-assigned to any internal member.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create task'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              {isEdit ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskFormModal
