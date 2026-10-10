// Calendar-date helpers for the timeline fields. Dates are local "YYYY-MM-DD" strings, the same form
// the API takes; the server reads them in its own time zone (APP_TIMEZONE).
const pad = (value) => String(value).padStart(2, '0')

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const fromDateKey = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const todayKey = () => toDateKey(new Date())

export const addToToday = (amount, unit) => {
  const date = new Date()
  if (unit === 'week') date.setDate(date.getDate() + amount * 7)
  else if (unit === 'month') date.setMonth(date.getMonth() + amount)
  else date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

// "Today", "Tomorrow", "in 5 days"
export const relativeDayLabel = (key) => {
  const days = Math.round((fromDateKey(key) - fromDateKey(todayKey())) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} ago`
  return `in ${days} days`
}

export const formatDateKey = (
  key,
  options = { weekday: 'short', month: 'short', day: 'numeric' },
) => fromDateKey(key).toLocaleDateString('en-US', options)

export const ordinal = (n) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'
  return `${n}${suffix}`
}
