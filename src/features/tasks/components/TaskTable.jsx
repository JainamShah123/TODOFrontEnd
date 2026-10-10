import { Link } from 'react-router-dom'
import CompleteTaskButton from '@/features/tasks/components/CompleteTaskButton'
import ChecklistProgress from '@/features/tasks/components/ChecklistProgress'
import { checklistProgress } from '@/features/tasks/utils/richText'
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
  'flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant/70 transition-colors hover:bg-surface-container hover:text-primary'

const COLUMNS = [
  { key: 'task', label: 'Task' },
  { key: 'status', label: 'Status', className: 'w-36' },
  { key: 'broker', label: 'Broker', className: 'w-32' },
  { key: 'due', label: 'Due', className: 'w-40' },
  { key: 'complete', label: 'Complete', className: 'w-24 text-center' },
  { key: 'by', label: 'By', className: 'w-16 text-center' },
  { key: 'to', label: 'To', className: 'w-16 text-center' },
  { key: 'actions', label: <span className="sr-only">Actions</span>, className: 'w-24' },
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-on-primary ring-2 ring-surface-container-lowest"
      style={{
        backgroundColor: isMe ? 'var(--color-primary)' : avatarColorFor(String(person.id ?? '')),
      }}
    >
      {initialsOf(name) || '?'}
    </span>
  )
}

// The compact table both task boards use. The Complete column shows a filled tick once a task is done;
// only the assignee gets the tick button to complete it, everyone else sees an empty cell. Editing is passed in
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-y border-border-light bg-surface-container text-[12px] font-extrabold tracking-[0.06em] text-on-surface uppercase">
            {COLUMNS.map((column) => (
              <th key={column.key} className={`px-3 py-3 font-extrabold ${column.className ?? ''}`}>
                {renderHeader(column.key, column.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light text-on-surface">
          {isLoading &&
            Array.from({ length: 6 }, (_, index) => (
              <tr key={index} aria-hidden="true">
                {COLUMNS.map((column) => (
                  <td key={column.key} className="px-3 py-3.5">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-container" />
                  </td>
                ))}
              </tr>
            ))}
          {isError && !isLoading && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-12 text-center text-error">
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
              const progress = checklistProgress(task.description)

              return (
                <tr
                  key={task.id}
                  className={`group transition-colors hover:bg-surface-subtle ${
                    overdue ? 'shadow-[inset_3px_0_0_var(--color-status-delayed)]' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        to={detailPath}
                        title={task.title}
                        className={`block min-w-0 truncate font-semibold hover:text-primary hover:underline ${
                          completed ? 'text-on-surface-variant' : 'text-on-surface'
                        }`}
                      >
                        {task.title}
                      </Link>
                      {progress && <ChecklistProgress progress={progress} compact />}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      title={
                        completed && task.completedAt
                          ? `${status.label} · ${formatDateTime(task.completedAt)}`
                          : undefined
                      }
                      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${status.bgClass} ${status.textClass}`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                  </td>
                  <td
                    className="truncate px-3 py-3 text-on-surface-variant"
                    title={task.broker || undefined}
                  >
                    {task.broker || '—'}
                  </td>
                  <td
                    className={`px-3 py-3 whitespace-nowrap tabular-nums ${
                      overdue
                        ? 'font-semibold text-status-delayed'
                        : completed
                          ? 'text-on-surface-variant'
                          : ''
                    }`}
                    title={task.dueAt ? formatDue(task) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {overdue && (
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                      )}
                      {task.dueAt ? (
                        formatDueAt(task.dueAt)
                      ) : (
                        <span className="text-on-surface-variant">No deadline</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3">
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
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <PersonAvatar person={task.createdBy} isMe={isMe(task.createdBy)} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <PersonAvatar person={task.assignee} isMe={isMe(task.assignee)} />
                  </td>
                  <td className="px-3 py-3">
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
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          {!isLoading && !isError && tasks.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-12 text-center">
                <span className="material-symbols-outlined mb-2 block text-[36px] text-outline-variant">
                  task_alt
                </span>
                <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
