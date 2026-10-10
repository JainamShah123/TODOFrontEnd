import { Link } from 'react-router-dom'
import CompleteTaskButton from '@/features/tasks/components/CompleteTaskButton'
import {
  STATUS_META,
  avatarColorFor,
  canEditTask,
  formatDateTimeParts,
  formatDue,
  formatShortDate,
  formatTime,
  getDisplayStatus,
  initialsOf,
  isAdminAssignee,
  isTaskCompleted,
  isTaskOverdue,
} from '@/features/tasks/utils/task.utils'

const iconLinkClass =
  'flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary'

// Shared by both task boards. Staff boards pass showAssignee={false} (it's always themselves) and no onEdit.
// Only the assignee can complete a task: on the admin board that means tasks assigned to the admin.
export default function TaskTable({
  tasks,
  detailBase,
  showAssignee = true,
  onEdit,
  canComplete = isAdminAssignee,
  isLoading = false,
  isError = false,
  emptyMessage = 'No tasks here.',
}) {
  const columnCount = showAssignee ? 6 : 5

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse text-left ${showAssignee ? 'min-w-[880px]' : 'min-w-[720px]'}`}>
          <thead>
            <tr className="border-b border-border-light bg-surface-subtle text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
              <th className="p-unit-md py-unit-sm font-medium">Task</th>
              <th className="p-unit-md py-unit-sm font-medium">Broker</th>
              {showAssignee && <th className="p-unit-md py-unit-sm font-medium">Assigned to</th>}
              <th className="p-unit-md py-unit-sm font-medium">Due</th>
              <th className="p-unit-md py-unit-sm font-medium">Done on</th>
              <th className="p-unit-md py-unit-sm">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-body-md text-on-surface">
            {isLoading && (
              <tr>
                <td colSpan={columnCount} className="p-unit-lg text-center text-on-surface-variant">
                  Loading tasks…
                </td>
              </tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td colSpan={columnCount} className="p-unit-lg text-center text-error">
                  Couldn't load tasks. Please refresh the page.
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              tasks.map((task) => {
                const detailPath = `${detailBase}/${task.id}`
                const isOwn = isAdminAssignee(task)
                const assigneeName = isOwn ? 'You' : (task.assignee?.name ?? 'Unassigned')
                const status = STATUS_META[getDisplayStatus(task)]
                const overdue = isTaskOverdue(task)
                const completed = isTaskCompleted(task)
                const doneOn = completed ? formatDateTimeParts(task.completedAt) : null
                const editable = onEdit && canEditTask(task)

                return (
                  <tr key={task.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="max-w-xs p-unit-md">
                      <Link to={detailPath} className="font-bold text-on-surface hover:text-primary hover:underline">
                        {task.title}
                      </Link>
                      <span
                        className={`mt-2 flex w-fit items-center gap-2 rounded-full px-2 py-0.5 text-label-md font-bold ${status.bgClass} ${status.textClass}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="p-unit-md text-on-surface-variant">{task.broker || '—'}</td>
                    {showAssignee && (
                      <td className="p-unit-md">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-on-primary"
                            style={{ backgroundColor: isOwn ? 'var(--color-primary)' : avatarColorFor(task.assignee?.id) }}
                          >
                            {isOwn ? 'Y' : initialsOf(assigneeName)}
                          </span>
                          <span className="font-medium">{assigneeName}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-unit-md whitespace-nowrap">
                      <span className={`block ${overdue ? 'font-bold text-status-delayed' : 'text-on-surface'}`}>
                        {task.dueDate ? formatShortDate(task.dueDate) : '—'}
                      </span>
                      <span
                        className={`block text-label-md ${overdue ? 'font-bold text-status-delayed' : 'text-on-surface-variant'}`}
                      >
                        {overdue ? formatDue(task) : (formatTime(task.time) ?? '')}
                      </span>
                    </td>
                    <td className="p-unit-md whitespace-nowrap">
                      {completed ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-[24px] ${status.textClass}`}
                            title={status.label}
                            aria-label={status.label}
                          >
                            check_circle
                          </span>
                          {doneOn && (
                            <span>
                              <span className="block text-on-surface">{doneOn.date}</span>
                              <span className="block text-label-md text-on-surface-variant">{doneOn.time}</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="p-unit-md">
                      <div className="flex items-center justify-end gap-2">
                        {!completed && canComplete(task) && <CompleteTaskButton task={task} />}
                        {editable && (
                          <button type="button" onClick={() => onEdit(task)} title="Edit task" className={iconLinkClass}>
                            <span className="material-symbols-outlined text-[24px]">edit</span>
                          </button>
                        )}
                        <Link to={detailPath} title="View details" className={iconLinkClass}>
                          <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            {!isLoading && !isError && tasks.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="p-unit-lg text-center text-on-surface-variant">
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
