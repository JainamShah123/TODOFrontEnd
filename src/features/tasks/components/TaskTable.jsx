import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import {
  STATUS_META,
  TASK_STATUS,
  avatarColorFor,
  canEditTask,
  formatDateTimeParts,
  formatShortDate,
  formatTime,
  getDisplayStatus,
  initialsOf,
  isAdminAssignee,
  isTaskOverdue,
} from '@/features/tasks/utils/task.utils'

export default function TaskTable({ tasks, onEdit, isLoading = false, isError = false }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-light bg-surface-subtle text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
              <th className="p-unit-md py-unit-sm font-medium">Task Title</th>
              <th className="p-unit-md py-unit-sm font-medium">Broker Name</th>
              <th className="p-unit-md py-unit-sm font-medium">Assignee</th>
              <th className="p-unit-md py-unit-sm font-medium">Due Date & Time</th>
              <th className="p-unit-md py-unit-sm font-medium">Completion Date & Time</th>
              <th className="p-unit-md py-unit-sm text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-body-md text-on-surface">
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-unit-lg text-center text-on-surface-variant">
                  Loading tasks…
                </td>
              </tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td colSpan={6} className="p-unit-lg text-center text-error">
                  Couldn't load tasks. Please refresh the page.
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              tasks.map((task) => {
                const isOwn = isAdminAssignee(task)
                const assigneeName = isOwn ? 'You' : (task.assignee?.name ?? 'Unassigned')
                const editable = canEditTask(task)
                const overdue = isTaskOverdue(task)
                const status = STATUS_META[getDisplayStatus(task)]
                const isCompleted = task.status === TASK_STATUS.COMPLETED
                const completedAt = formatDateTimeParts(task.completedAt)

                return (
                  <tr key={task.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="max-w-xs p-unit-md">
                      <Link
                        to={`${ROUTES.ADMIN_TASK_BOARD}/${task.id}`}
                        className="font-bold text-on-surface hover:text-primary hover:underline"
                      >
                        {task.title}
                      </Link>
                      <span
                        className={`mt-1 flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-label-md font-bold ${status.bgClass} ${status.textClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="p-unit-md text-on-surface-variant">{task.broker || '—'}</td>
                    <td className="p-unit-md">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-on-primary"
                          style={{ backgroundColor: isOwn ? 'var(--color-primary)' : avatarColorFor(task.assignee?.id) }}
                        >
                          {isOwn ? 'Y' : initialsOf(assigneeName)}
                        </span>
                        <span className="font-medium">{assigneeName}</span>
                      </div>
                    </td>
                    <td className="p-unit-md whitespace-nowrap">
                      <span
                        className={`flex items-center gap-1 ${overdue ? 'font-bold text-status-delayed' : 'text-on-surface'}`}
                      >
                        {overdue && <span className="material-symbols-outlined text-[16px]">schedule</span>}
                        {formatShortDate(task.dueDate)}
                      </span>
                      <span className="block text-label-md text-on-surface-variant">
                        {formatTime(task.time) ?? '—'}
                      </span>
                    </td>
                    <td className="p-unit-md whitespace-nowrap">
                      {isCompleted && completedAt ? (
                        <>
                          <span className="block text-on-surface">{completedAt.date}</span>
                          <span className="block text-label-md text-on-surface-variant">{completedAt.time}</span>
                        </>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="p-unit-md">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`${ROUTES.ADMIN_TASK_BOARD}/${task.id}`}
                          title="View details"
                          className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                        {editable ? (
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            title="Edit task"
                            className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        ) : (
                          <span
                            title="Locked — this staff task is past To Do"
                            className="flex h-8 w-8 items-center justify-center rounded text-outline-variant"
                          >
                            <span className="material-symbols-outlined text-[20px]">lock</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            {!isLoading && !isError && tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="p-unit-lg text-center text-on-surface-variant">
                  No tasks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
