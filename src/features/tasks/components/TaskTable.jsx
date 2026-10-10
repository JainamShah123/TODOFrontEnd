import { Link } from 'react-router-dom'
import CompleteTaskButton from '@/features/tasks/components/CompleteTaskButton'
import {
  STATUS_META,
  avatarColorFor,
  canEditTask,
  formatDateTime,
  formatDue,
  getDisplayStatus,
  initialsOf,
  isTaskCompleted,
  isTaskOverdue,
} from '@/features/tasks/utils/task.utils'

const iconLinkClass =
  'flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary'

const COLUMNS = [
  { key: 'done', label: 'Done', className: 'w-12 text-center' },
  { key: 'task', label: 'Task' },
  { key: 'status', label: 'Status', className: 'w-36' },
  { key: 'broker', label: 'Broker', className: 'w-32' },
  { key: 'due', label: 'Due', className: 'w-40' },
  { key: 'by', label: 'By', className: 'w-14 text-center' },
  { key: 'to', label: 'To', className: 'w-14 text-center' },
  { key: 'actions', label: <span className="sr-only">Actions</span>, className: 'w-20' },
]

// "Oct 12, 5:30 PM", with the year only when it isn't this year: one short line for the Due column.
const formatDueAt = (dueAt) => {
  const due = new Date(dueAt)
  const sameYear = due.getFullYear() === new Date().getFullYear()
  return due.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Initials only, to keep rows narrow; the full name is in the tooltip. The signed-in user is always
// shown in the primary color.
function PersonAvatar({ person, isMe }) {
  if (!person) return <span className="text-on-surface-variant">—</span>
  const name = person.name ?? 'Unknown'
  return (
    <span
      title={isMe ? `${name} (you)` : name}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-on-primary"
      style={{
        backgroundColor: isMe ? 'var(--color-primary)' : avatarColorFor(String(person.id ?? '')),
      }}
    >
      {initialsOf(name) || '?'}
    </span>
  )
}

// The compact table both task boards use. Only the assignee can complete a task; editing is passed in
// as `onEdit` (admins only). `renderHeader(key, label)` lets the board put its column filters in the header.
export default function TaskTable({
  tasks,
  detailBase,
  currentUserId,
  onEdit,
  renderHeader = (key, label) => label,
  isLoading = false,
  isError = false,
  emptyMessage = 'No tasks here.',
}) {
  const isMe = (person) => Boolean(currentUserId) && String(person?.id) === String(currentUserId)

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-border-light bg-surface-subtle text-[12px] font-bold tracking-wide text-on-surface-variant uppercase">
              {COLUMNS.map((column) => (
                <th key={column.key} className={`px-2 py-2 font-bold ${column.className ?? ''}`}>
                  {renderHeader(column.key, column.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-on-surface">
            {isLoading && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="p-unit-lg text-center text-on-surface-variant"
                >
                  Loading tasks…
                </td>
              </tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td colSpan={COLUMNS.length} className="p-unit-lg text-center text-error">
                  Couldn't load tasks. Please refresh the page.
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              tasks.map((task) => {
                const detailPath = `${detailBase}/${task.id}`
                const status = STATUS_META[getDisplayStatus(task)]
                const overdue = isTaskOverdue(task)
                const completed = isTaskCompleted(task)
                const canComplete = !completed && isMe(task.assignee)
                const editable = onEdit && canEditTask(task)

                return (
                  <tr key={task.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="px-2 py-1.5">
                      <div className="flex justify-center">
                        {completed ? (
                          <span
                            className={`material-symbols-outlined text-[22px] ${status.textClass}`}
                            title={
                              task.completedAt
                                ? `${status.label} · ${formatDateTime(task.completedAt)}`
                                : status.label
                            }
                            aria-label={status.label}
                          >
                            check_circle
                          </span>
                        ) : canComplete ? (
                          <CompleteTaskButton task={task} variant="icon" />
                        ) : (
                          <span
                            className="text-on-surface-variant/50"
                            title="Only the assignee can complete this task"
                          >
                            —
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <Link
                        to={detailPath}
                        title={task.title}
                        className="block truncate font-bold text-on-surface hover:text-primary hover:underline"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-bold whitespace-nowrap ${status.bgClass} ${status.textClass}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dotClass}`} />
                        {status.label}
                      </span>
                    </td>
                    <td
                      className="truncate px-2 py-1.5 text-on-surface-variant"
                      title={task.broker || undefined}
                    >
                      {task.broker || '—'}
                    </td>
                    <td
                      className={`px-2 py-1.5 whitespace-nowrap ${overdue ? 'font-bold text-status-delayed' : ''}`}
                      title={task.dueAt ? formatDue(task) : undefined}
                    >
                      {task.dueAt ? formatDueAt(task.dueAt) : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <PersonAvatar person={task.createdBy} isMe={isMe(task.createdBy)} />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <PersonAvatar person={task.assignee} isMe={isMe(task.assignee)} />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        {editable && (
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            title="Edit task"
                            className={iconLinkClass}
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        )}
                        <Link to={detailPath} title="View details" className={iconLinkClass}>
                          <span className="material-symbols-outlined text-[20px]">
                            chevron_right
                          </span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            {!isLoading && !isError && tasks.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="p-unit-lg text-center text-on-surface-variant"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
