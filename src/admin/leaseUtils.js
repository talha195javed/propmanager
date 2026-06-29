// Shared formatting helpers for the Tenants and Lease screens.

export const API = 'http://localhost:5001/api'

export function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

// "23 June 2026"
export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// "26 Jun 26"
export function formatShort(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

// "25 Jun 2029"
export function formatMedium(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Number of months parsed from a label like "12 months".
export function parseMonths(leaseLength) {
  if (!leaseLength) return 12
  const m = String(leaseLength).match(/\d+/)
  return m ? Number(m[0]) : 12
}

// End date = start + N months − 1 day (a 12-month lease ends the day before
// the anniversary).
export function computeLeaseEnd(start, leaseLength) {
  if (!start) return null
  const d = new Date(start)
  if (Number.isNaN(d.getTime())) return null
  d.setMonth(d.getMonth() + parseMonths(leaseLength))
  d.setDate(d.getDate() - 1)
  return d
}

// "26 Jun 26 – 25 Jun 27"
export function termRange(start, leaseLength) {
  if (!start) return '—'
  const end = computeLeaseEnd(start, leaseLength)
  return `${formatShort(start)} – ${formatShort(end)}`
}

// "AED 145,000"
export function money(value) {
  if (value == null || value === '') return '—'
  return `AED ${Number(value).toLocaleString()}`
}

// Two-letter initials from a full name.
export function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}
