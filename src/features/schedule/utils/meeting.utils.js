// Meetings carry wall-clock strings: date "YYYY-MM-DD" and times "HH:mm", any of which may be null.

const pad = (value) => String(value).padStart(2, '0')

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const fromDateKey = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export const todayKey = () => toDateKey(new Date())

// "2:30 PM"
export const formatTime = (value) => {
  if (!value) return ''
  const [hours, minutes] = value.split(':').map(Number)
  return `${hours % 12 || 12}:${pad(minutes)} ${hours >= 12 ? 'PM' : 'AM'}`
}

export const formatTimeRange = ({ startTime, endTime }) =>
  startTime ? `${formatTime(startTime)}${endTime ? ` – ${formatTime(endTime)}` : ''}` : ''

// "Today", "Tomorrow", "Yesterday", "Thu", or "Oct 22" (with the year when it isn't this year).
export const formatDay = (key) => {
  const diff = Math.round((fromDateKey(key) - fromDateKey(todayKey())) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const date = fromDateKey(key)
  if (diff > 1 && diff < 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }),
  })
}

// A meeting has slipped once its day is over, or once its end (or start) time has passed today.
export const isMeetingOverdue = (meeting, now = new Date()) => {
  if (meeting.done || !meeting.date) return false
  const today = toDateKey(now)
  if (meeting.date !== today) return meeting.date < today
  const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const last = meeting.endTime ?? meeting.startTime
  return Boolean(last) && last < clock
}

export const minutesBetween = (start, end) => {
  const toMinutes = (value) => {
    const [hours, minutes] = value.split(':').map(Number)
    return hours * 60 + minutes
  }
  return toMinutes(end) - toMinutes(start)
}

export const addMinutesToTime = (time, minutes) => {
  const [hours, mins] = time.split(':').map(Number)
  const total = hours * 60 + mins + minutes
  if (total >= 24 * 60) return null
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}

// The open list's sections, in display order. Undated meetings are the bulk, so they get their own
// group rather than being pushed to the bottom of a calendar.
export const GROUPS = [
  { key: 'overdue', label: 'Slipped', icon: 'history', tone: 'text-status-delayed' },
  { key: 'today', label: 'Today', icon: 'today', tone: 'text-primary' },
  { key: 'week', label: 'Next 7 days', icon: 'date_range', tone: 'text-status-scheduled' },
  { key: 'later', label: 'Later', icon: 'event', tone: 'text-on-surface-variant' },
  { key: 'anytime', label: 'Anytime', icon: 'all_inclusive', tone: 'text-status-pending' },
]

export const groupOf = (meeting, now = new Date()) => {
  if (!meeting.date) return 'anytime'
  if (isMeetingOverdue(meeting, now)) return 'overdue'
  const today = toDateKey(now)
  if (meeting.date === today) return 'today'
  if (meeting.date <= toDateKey(addDays(now, 7))) return 'week'
  return 'later'
}

const sortKey = (meeting) => `${meeting.date ?? '9999'}|${meeting.startTime ?? '99:99'}`

export const groupMeetings = (meetings, now = new Date()) => {
  const buckets = Object.fromEntries(GROUPS.map((group) => [group.key, []]))
  meetings.forEach((meeting) => buckets[groupOf(meeting, now)].push(meeting))
  Object.entries(buckets).forEach(([key, list]) => {
    if (key === 'anytime') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    else list.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  })
  return GROUPS.map((group) => ({ ...group, meetings: buckets[group.key] })).filter(
    (group) => group.meetings.length > 0,
  )
}

export const matchesSearch = (meeting, query) => {
  if (!query) return true
  const needle = query.toLowerCase()
  return [meeting.title, meeting.attendees, meeting.location, meeting.notes].some((field) =>
    field?.toLowerCase().includes(needle),
  )
}
