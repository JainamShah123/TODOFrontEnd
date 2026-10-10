import { ASSET_BASE_URL } from '@/config/api.config'

// Users only ever set two states: a task is open (todo) or done (completed, via the Complete button).
export const TASK_STATUS = {
  TODO: 'todo',
  COMPLETED: 'completed',
}

// Display-only states, worked out from the dates (same rules as the API's displayStatus). Nobody picks these.
export const DISPLAY_STATUS = {
  TODO: 'todo',
  DELAYED: 'delayed',
  COMPLETED: 'completed',
  COMPLETED_LATE: 'completed_late',
}

// Tab / tile order everywhere the four states are listed.
export const STATUS_TABS = [
  DISPLAY_STATUS.TODO,
  DISPLAY_STATUS.DELAYED,
  DISPLAY_STATUS.COMPLETED,
  DISPLAY_STATUS.COMPLETED_LATE,
]

export const STATUS_META = {
  todo: {
    label: 'To Do',
    dotClass: 'bg-status-scheduled',
    textClass: 'text-status-scheduled',
    bgClass: 'bg-status-scheduled/10',
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
  completed_late: {
    label: 'Completed Late',
    dotClass: 'bg-status-pending',
    textClass: 'text-status-pending',
    bgClass: 'bg-status-pending/10',
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

export const isTaskCompleted = (task) => task.status === TASK_STATUS.COMPLETED

// Judged from the exact due timestamp the server sends (dueAt), the same way the server's status
// filter judges it, so a task's badge always matches the tab it shows up under.
export const isTaskOverdue = (task, now = new Date()) =>
  !isTaskCompleted(task) && Boolean(task.dueAt) && new Date(task.dueAt) < now

// Completed tasks keep the server's verdict (it can fall back to updated_at for old records); open tasks
// are judged live, so one turns Delayed the moment it passes its due time without waiting for a refetch.
export const getDisplayStatus = (task, now = new Date()) => {
  if (isTaskCompleted(task)) {
    if (task.displayStatus === DISPLAY_STATUS.COMPLETED || task.displayStatus === DISPLAY_STATUS.COMPLETED_LATE) {
      return task.displayStatus
    }
    const late = task.completedAt && task.dueAt && new Date(task.completedAt) > new Date(task.dueAt)
    return late ? DISPLAY_STATUS.COMPLETED_LATE : DISPLAY_STATUS.COMPLETED
  }
  return isTaskOverdue(task, now) ? DISPLAY_STATUS.DELAYED : DISPLAY_STATUS.TODO
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Plain-language due text for a list row: "3 days late", "Today, 4:00 PM", "Tomorrow, 9:00 AM" or
// "Oct 17, 4:00 PM". Lateness only shows while the task is still open.
export const formatDue = (task, now = new Date()) => {
  if (!task.dueAt) return '—'
  const due = new Date(task.dueAt)
  const time = due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (isTaskOverdue(task, now)) {
    const days = Math.floor((now - due) / MS_PER_DAY)
    if (days === 0) return `Late since ${time}`
    return `${days} ${days === 1 ? 'day' : 'days'} late`
  }

  const dayDiff = Math.round((new Date(due).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / MS_PER_DAY)
  if (dayDiff === 0) return `Today, ${time}`
  if (dayDiff === 1) return `Tomorrow, ${time}`
  if (dayDiff === -1) return `Yesterday, ${time}`
  return `${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
}

// Admin can edit any of their own tasks; a staff task can only be edited until it's completed.
export const canEditTask = (task) => isAdminAssignee(task) || !isTaskCompleted(task)

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
  status: raw.status === TASK_STATUS.COMPLETED ? TASK_STATUS.COMPLETED : TASK_STATUS.TODO,
  displayStatus: raw.displayStatus ?? null,
  timeline: raw.timeline,
  customDates: raw.customDates ?? null,
  dueDate: raw.dueDate,
  dueAt: raw.dueAt ?? null,
  time: raw.time,
  createdAt: raw.createdAt,
  completedAt: raw.completionAt ?? null,
  delayReason: null,
  delayReasonAt: null,
})
