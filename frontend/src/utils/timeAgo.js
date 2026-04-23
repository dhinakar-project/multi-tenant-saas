/**
 * Returns a human-friendly relative timestamp.
 * e.g. "just now", "3 minutes ago", "2 hours ago", "5 days ago"
 */
export function timeAgo(dateInput) {
  if (!dateInput) return '—'
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 30) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
