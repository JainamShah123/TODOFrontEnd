import { ASSET_BASE_URL } from '@/config/api.config'

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}

export const STATUS_META = {
  todo: {
    label: 'To Do',
    dotClass: 'bg-status-scheduled',
    textClass: 'text-status-scheduled',
    bgClass: 'bg-status-scheduled/10',
  },
  in_progress: {
    label: 'In Progress',
    dotClass: 'bg-status-pending',
    textClass: 'text-status-pending',
    bgClass: 'bg-status-pending/10',
  },
  delayed: {
    label: 'Delayed',
    dotClass: 'bg-status-delayed',
    textClass: 'text-status-delayed',
    bgClass: 'bg-status-delayed/10',
  },
  completed: {
    label: 'Completed',
    dotClass: 'bg-status-completed',
    textClass: 'text-status-completed',
    bgClass: 'bg-status-completed/10',
  },
}

export const PRIORITY_DOT_CLASS = {
  low: 'bg-status-scheduled',
  medium: 'bg-status-pending',
  high: 'bg-status-delayed',
}

const AVATAR_PALETTE = ['#3b82f6', '#a43a3a', '#8b5cf6', '#0ea5e9', '#ea580c', '#006c49', '#3f465c']

// Deterministic color for a staff member's avatar, keyed by their id, so the
// same person always gets the same color without needing a static lookup table.
export const avatarColorFor = (id = '') => {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = id.charCodeAt(index) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

export const isAdminAssignee = (task) => task.assignee?.type === 'admin'

export const isAssignedTo = (task, assigneeId) => Boolean(assigneeId) && task.assignee?.id === assigneeId

// Combines dueDate ("YYYY-MM-DD") + time ("HH:mm") into a real Date so overdue
// can be judged against the current moment, not just the calendar date. A task
// with no due time falls back to end-of-day, so it only turns overdue once its
// due date has fully elapsed (rather than at midnight of that same day).
const dueDateTimeOf = (task) => {
  const [year, month, day] = task.dueDate.split('-').map(Number)
  if (task.time) {
    const [hours, minutes] = task.time.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes)
  }
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}

export const isTaskOverdue = (task, now = new Date()) =>
  task.status !== TASK_STATUS.COMPLETED && dueDateTimeOf(task) < now

export const getDisplayStatus = (task, now = new Date()) => {
  if (task.status === TASK_STATUS.COMPLETED) return 'completed'
  return isTaskOverdue(task, now) ? 'delayed' : task.status
}

// Admin can edit any of their own tasks; a staff task can only be edited while
// it's still in To Do (locks once work has started, matching the board's rule).
export const canEditTask = (task) => isAdminAssignee(task) || task.status === TASK_STATUS.TODO

// Only the admin can change status on their own tasks from the admin side;
// staff-side call sites gate this separately since a staff member's board is
// already filtered down to their own tasks.
export const canChangeStatus = (task) => isAdminAssignee(task)

export const formatShortDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatTime = (time) => {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Single-line "MMM d, yyyy, h:mm AM/PM" display for a full ISO timestamp
// (completedAt, delayReasonAt) — used in prose-style detail rows.
export const formatDateTime = (isoString) =>
  new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

// Date and time as separate strings (same formatting as formatShortDate/formatTime)
// for stacking a full ISO timestamp across two lines in a table cell.
export const formatDateTimeParts = (isoString) => {
  if (!isoString) return null
  const date = new Date(isoString)
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

export const initialsOf = (name) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

// Filename portion of a server-relative attachment path (e.g. "/uploads/tasks/<uuid>.pdf").
// A locally-replaced attachment (Edit Task, before any upload API exists) is a
// blob: URL with no real filename, so it just falls back to a generic label.
export const attachmentFileName = (attachmentUrl) =>
  (attachmentUrl?.startsWith('blob:') ? 'Attachment' : attachmentUrl?.split('/').pop()) ?? 'Attachment'

// Resolves an attachment field into an openable URL. Server-relative paths
// (e.g. "/uploads/tasks/<uuid>.pdf") need the API's origin prefixed; a blob:
// URL from a local-only Edit Task replacement is already directly openable.
export const resolveAttachmentUrl = (attachmentUrl) => {
  if (!attachmentUrl) return null
  if (/^(https?:|blob:|data:)/.test(attachmentUrl)) return attachmentUrl
  return `${ASSET_BASE_URL}${attachmentUrl}`
}

// Normalizes a raw /tasks API record into the shape the app works with, adding
// local-only fields (delayReason, delayReasonAt) that have no API yet.
export const mapApiTask = (raw) => ({
  id: raw.id,
  title: raw.title,
  description: raw.description ?? '',
  attachmentUrl: raw.attachmentUrl ?? null,
  broker: raw.broker ?? '',
  assignee: raw.assignee,
  priority: raw.priority,
  status: raw.status,
  timeline: raw.timeline,
  customDates: raw.customDates ?? null,
  dueDate: raw.dueDate,
  time: raw.time,
  createdAt: raw.createdAt,
  completedAt: raw.completionAt ?? null,
  delayReason: null,
  delayReasonAt: null,
})
