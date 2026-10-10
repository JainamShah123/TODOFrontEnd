import {
  CURRENT_USER_ID,
  PRIORITY_DOT_CLASS,
  STAFF_AVATAR_COLOR,
  STAFF_NAME_MAP,
  canEditTask,
  formatShortDate,
  getDisplayStatus,
  initialsOf,
  isTaskOverdue,
} from '@/features/tasks/utils/task.utils'

export default function TaskCard({ task, onEdit, onStatusChange }) {
  const isOwn = task.assignedTo === CURRENT_USER_ID
  const editable = canEditTask(task)
  const overdue = isTaskOverdue(task)
  const showOriginTag = getDisplayStatus(task) === 'delayed'
  const assigneeName = isOwn ? 'You' : STAFF_NAME_MAP[task.assignedTo]

  return (
    <article className="flex flex-col gap-unit-sm rounded-lg border border-border-light bg-surface-container-lowest p-unit-sm shadow-sm">
      <div className="flex items-start gap-2">
        <span
          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT_CLASS[task.priority]}`}
          title={`${task.priority} priority`}
        />
        <h4 className="flex-1 text-label-bold font-bold text-on-surface">{task.title}</h4>
        {editable ? (
          <button
            type="button"
            onClick={() => onEdit(task)}
            title="Edit task"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        ) : (
          <span
            title="Locked once work has started"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-outline-variant"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
          </span>
        )}
      </div>

      {showOriginTag && (
        <span className="w-fit rounded-full bg-status-delayed/10 px-2 py-0.5 text-[16px] font-bold tracking-wide text-status-delayed uppercase">
          Was: {task.status === 'todo' ? 'To Do' : 'In Progress'}
        </span>
      )}

      {task.description && <p className="text-label-md text-on-surface-variant">{task.description}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-border-light pt-unit-sm">
        <span className="flex min-w-0 items-center gap-2 text-label-md font-bold text-on-surface-variant">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-on-primary"
            style={{ backgroundColor: isOwn ? 'var(--color-primary)' : STAFF_AVATAR_COLOR[task.assignedTo] }}
          >
            {isOwn ? 'Y' : initialsOf(assigneeName)}
          </span>
          <span className="truncate">{assigneeName}</span>
        </span>
        <span
          className={`flex shrink-0 items-center gap-2 text-label-md font-semibold ${
            overdue ? 'text-status-delayed' : 'text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
          {formatShortDate(task.dueDate)}
          {overdue ? ' · Overdue' : ''}
        </span>
      </div>

      {isOwn && (
        <select
          value={task.status}
          onChange={(event) => onStatusChange(task.id, event.target.value)}
          className="w-full rounded-md border border-border-light bg-surface-subtle px-2 py-2 text-label-md font-bold text-on-surface"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      )}
    </article>
  )
}
