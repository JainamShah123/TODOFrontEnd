import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import EditTaskModal from '@/features/tasks/components/EditTaskModal'
import DelayReasonModal from '@/features/tasks/components/DelayReasonModal'
import { TIMELINE_OPTIONS } from '@/features/tasks/data/task-options.data'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { useDeleteTask, useSyncedTasks, useUpdateTaskStatus } from '@/hooks/useTasks'
import {
  PRIORITY_DOT_CLASS,
  STATUS_META,
  TASK_STATUS,
  attachmentFileName,
  avatarColorFor,
  canEditTask,
  capitalize,
  formatDateTime,
  formatShortDate,
  formatTime,
  getDisplayStatus,
  initialsOf,
  isAdminAssignee,
  isAssignedTo,
  isTaskOverdue,
  resolveAttachmentUrl,
} from '@/features/tasks/utils/task.utils'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

function SectionLabel({ children }) {
  return <p className="mb-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">{children}</p>
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-unit-md border-b border-border-light py-3 last:border-b-0">
      <span className="shrink-0 text-label-md text-on-surface-variant">{label}</span>
      <span className="flex flex-col items-end text-right text-body-md font-bold text-on-surface">{children}</span>
    </div>
  )
}

export default function TaskDetail() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { tasks, isLoading, isError } = useSyncedTasks()
  const updateTask = useTaskStore((state) => state.updateTask)
  const updateTaskStatusLocal = useTaskStore((state) => state.updateTaskStatus)
  const setDelayReason = useTaskStore((state) => state.setDelayReason)
  const deleteTask = useTaskStore((state) => state.deleteTask)
  const updateStatus = useUpdateTaskStatus()
  const deleteTaskMutation = useDeleteTask()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isReasonOpen, setIsReasonOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [statusError, setStatusError] = useState(null)
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false)
  const [completeConfirmError, setCompleteConfirmError] = useState(null)

  const isStaff = user?.role === Role.STAFF
  const boardRoute = isStaff ? ROUTES.STAFF_TASK_BOARD : ROUTES.ADMIN_TASK_BOARD

  const task = tasks.find((item) => item.id === taskId)
  const canView = task && (!isStaff || isAssignedTo(task, user?.id))

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-unit-md rounded-xl border border-border-light bg-surface-container-lowest p-unit-xl text-center shadow-sm">
        <p className="text-body-md text-on-surface-variant">Loading task…</p>
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-unit-md rounded-xl border border-border-light bg-surface-container-lowest p-unit-xl text-center shadow-sm">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">search_off</span>
        <div>
          <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">
            {isError ? "Couldn't load this task" : 'Task not found'}
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {isError
              ? 'There was a problem loading the task list. Please try again.'
              : "It may have been deleted, or it isn't assigned to you."}
          </p>
        </div>
        <Link
          to={boardRoute}
          className="rounded-lg border border-border-light px-4 py-2 text-label-bold font-bold text-on-surface hover:bg-surface-subtle"
        >
          Back to Task Board
        </Link>
      </div>
    )
  }

  const isOwn = isStaff ? isAssignedTo(task, user?.id) : isAdminAssignee(task)
  const assigneeName = isOwn ? 'You' : (task.assignee?.name ?? 'Unassigned')
  const avatarColor = isOwn ? 'var(--color-primary)' : avatarColorFor(task.assignee?.id)
  const displayStatus = STATUS_META[getDisplayStatus(task)]
  const overdue = isTaskOverdue(task)
  const statusEditable = isStaff ? isAssignedTo(task, user?.id) : isAdminAssignee(task)
  const statusLocked = task.status === TASK_STATUS.COMPLETED
  const canEditStatus = statusEditable && !statusLocked
  const editable = !isStaff && canEditTask(task)
  const timelineLabel = TIMELINE_OPTIONS.find((option) => option.value === task.timeline)?.label ?? task.timeline
  const showReason = overdue || Boolean(task.delayReason)
  const reasonAuthor = isStaff ? 'You' : assigneeName

  // Applies a status change against the real API, optimistically updating the
  // local store first and rolling back if the request fails. Returns the error
  // message on failure so callers (the plain select, or the completion confirm
  // dialog) can decide where to display it.
  const commitStatusChange = async (nextStatus) => {
    const previousStatus = task.status
    const previousCompletedAt = task.completedAt
    updateTaskStatusLocal(task.id, nextStatus)
    try {
      const response = await updateStatus.mutateAsync({ taskId: task.id, status: nextStatus })
      // The optimistic update above only set `status` — completedAt comes back
      // from the server (set/cleared there), so reconcile it from the real
      // response rather than computing it client-side.
      updateTask(task.id, { completedAt: response?.data?.task?.completionAt ?? null })
      return null
    } catch (error) {
      updateTaskStatusLocal(task.id, previousStatus)
      updateTask(task.id, { completedAt: previousCompletedAt })
      return error?.response?.data?.message ?? 'Unable to update status. Please try again.'
    }
  }

  const handleStatusChange = async (nextStatus) => {
    setStatusError(null)
    const errorMessage = await commitStatusChange(nextStatus)
    if (errorMessage) setStatusError(errorMessage)
  }

  // Marking a task Completed locks it from further status changes (see
  // statusLocked below), so confirm before committing — same "YES or NO"
  // pattern as Delete.
  const handleSelectStatus = (nextStatus) => {
    if (nextStatus === TASK_STATUS.COMPLETED) {
      setCompleteConfirmError(null)
      setIsCompleteConfirmOpen(true)
    } else {
      handleStatusChange(nextStatus)
    }
  }

  const handleConfirmComplete = async () => {
    setCompleteConfirmError(null)
    const errorMessage = await commitStatusChange(TASK_STATUS.COMPLETED)
    if (errorMessage) {
      setCompleteConfirmError(errorMessage)
    } else {
      setIsCompleteConfirmOpen(false)
    }
  }

  const handleConfirmDelete = async () => {
    setDeleteError(null)
    try {
      await deleteTaskMutation.mutateAsync(task.id)
      deleteTask(task.id)
      navigate(boardRoute, { replace: true })
    } catch (error) {
      setDeleteError(error?.response?.data?.message ?? 'Unable to delete the task. Please try again.')
    }
  }

  const deleteDescription = `“${task.title}” will be removed from the Task Board for everyone${
    isOwn ? '' : `, including ${assigneeName}`
  }. This action cannot be undone.`

  return (
    <>
      <nav className="flex flex-wrap items-center gap-1.5 text-label-md text-on-surface-variant">
        <Link to={boardRoute} className="flex items-center gap-1 font-bold hover:text-on-surface">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Task Board
        </Link>
        <span>/</span>
        <span className="truncate font-bold text-on-surface">{task.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-unit-md">
        <div className="min-w-0 flex-1 basis-80">
          <h2 className="mb-unit-sm font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-headline-md">
            {task.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {!canEditStatus && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-label-md font-bold ${displayStatus.bgClass} ${displayStatus.textClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${displayStatus.dotClass}`} />
                {displayStatus.label}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-container-lowest px-3 py-1 text-label-md font-medium text-on-surface-variant">
              <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT_CLASS[task.priority]}`} />
              {capitalize(task.priority)} priority
            </span>
            {!statusEditable && (
              <span className="inline-flex items-center gap-1 text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Status is set by the assignee
              </span>
            )}
            {statusEditable && statusLocked && (
              <span className="inline-flex items-center gap-1 text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Completed — status is locked
              </span>
            )}
            {canEditStatus && isStaff && (
              <span className="inline-flex items-center gap-1 text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">edit_off</span>
                Only you can change the status
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          {canEditStatus && (
            <>
              <label htmlFor="taskStatus" className="text-label-md font-bold text-on-surface-variant">
                Status
              </label>
              <select
                id="taskStatus"
                value={task.status}
                disabled={updateStatus.isPending}
                onChange={(event) => handleSelectStatus(event.target.value)}
                className={`cursor-pointer rounded-full border border-dashed py-2 pr-7 pl-4 text-label-md font-bold disabled:cursor-not-allowed disabled:opacity-60 ${displayStatus.textClass} ${displayStatus.bgClass}`}
                style={{ borderColor: 'currentColor' }}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              {statusError && <p className="w-full text-sm text-error">{statusError}</p>}
            </>
          )}
          {!isStaff && (
            <>
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                disabled={!editable}
                title={editable ? 'Edit task' : 'Locked — this staff task is past To Do'}
                className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-container-lowest px-4 py-2 text-label-bold font-bold text-on-surface transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">{editable ? 'edit' : 'lock'}</span>
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null)
                  setIsDeleteOpen(true)
                }}
                className="flex items-center gap-2 rounded-lg border border-error-container bg-surface-container-lowest px-4 py-2 text-label-bold font-bold text-error transition-colors hover:bg-error-container"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-margin-desktop lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="divide-y divide-border-light rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
          <div className="p-unit-lg">
            <SectionLabel>Description</SectionLabel>
            <p className="max-w-[62ch] text-body-md text-on-surface">{task.description || 'No description added.'}</p>
          </div>

          {task.attachmentUrl && (
            <div className="p-unit-lg">
              <SectionLabel>Attachment</SectionLabel>
              <a
                href={resolveAttachmentUrl(task.attachmentUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-lg border border-border-light bg-surface-subtle px-3 py-2 text-body-md font-semibold text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px] text-primary">description</span>
                {attachmentFileName(task.attachmentUrl)}
              </a>
            </div>
          )}

          {task.broker && (
            <div className="p-unit-lg">
              <SectionLabel>Broker</SectionLabel>
              <p className="text-body-md text-on-surface">{task.broker}</p>
            </div>
          )}

          {showReason && (
            <div className="p-unit-lg">
              <div className="mb-unit-sm flex flex-wrap items-center justify-between gap-unit-sm">
                <p className="text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
                  Reason for delay
                </p>
                {isOwn && overdue ? (
                  <button
                    type="button"
                    onClick={() => setIsReasonOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border-light bg-surface-container-lowest px-3 py-1.5 text-label-md font-bold text-on-surface transition-colors hover:bg-surface-subtle"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {task.delayReason ? 'edit_note' : 'add_comment'}
                    </span>
                    {task.delayReason ? 'Edit reason' : 'Add reason'}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-label-md font-bold text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    Added by staff · read-only
                  </span>
                )}
              </div>
              {task.delayReason ? (
                <div className="rounded-xl border border-status-delayed/30 bg-status-delayed/10 p-unit-md">
                  <p className="mb-2 flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-on-primary"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {isOwn ? 'Y' : initialsOf(assigneeName)}
                    </span>
                    <span>
                      <strong className="text-on-surface">{reasonAuthor}</strong>
                      {task.delayReasonAt && ` · ${formatDateTime(task.delayReasonAt)}`}
                    </span>
                  </p>
                  <p className="text-body-md text-on-surface">{task.delayReason}</p>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border-light p-unit-md text-body-md text-on-surface-variant">
                  {isStaff
                    ? 'This task is overdue. Add a reason so admin can see why.'
                    : 'No reason has been added by the assignee yet.'}
                </p>
              )}
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-border-light bg-surface-container-lowest px-unit-lg py-1.5 shadow-sm">
          <DetailRow label="Assignee">
            <span className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-on-primary"
                style={{ backgroundColor: avatarColor }}
              >
                {isOwn ? 'Y' : initialsOf(assigneeName)}
              </span>
              {assigneeName}
            </span>
          </DetailRow>
          <DetailRow label="Due date">
            <span className={overdue ? 'text-status-delayed' : undefined}>{formatShortDate(task.dueDate)}</span>
          </DetailRow>
          <DetailRow label="Due time">{formatTime(task.time) ?? '—'}</DetailRow>
          {task.status === TASK_STATUS.COMPLETED && task.completedAt && (
            <DetailRow label="Completed on">{formatDateTime(task.completedAt)}</DetailRow>
          )}
          <DetailRow label="Timeline">
            <span>{timelineLabel}</span>
            {task.timeline === 'custom' && task.customDates?.[0]?.date && (
              <span className="text-label-md font-medium text-on-surface-variant">
                {formatShortDate(task.customDates[0].date)}
              </span>
            )}
          </DetailRow>
        </aside>
      </div>

      {isEditOpen && (
        <EditTaskModal task={task} onClose={() => setIsEditOpen(false)} />
      )}

      {isReasonOpen && (
        <DelayReasonModal task={task} onClose={() => setIsReasonOpen(false)} onSave={setDelayReason} />
      )}

      {isDeleteOpen && (
        <ConfirmDialog
          title="Delete this task?"
          description={deleteDescription}
          confirmLabel="Yes, Delete"
          cancelLabel="No"
          error={deleteError}
          isConfirming={deleteTaskMutation.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}

      {isCompleteConfirmOpen && (
        <ConfirmDialog
          title="Mark this task as completed?"
          description="Once you mark this task as completed, it will be logged and you won't be able to change it afterward. Are you sure you want to continue?"
          confirmLabel="Yes"
          cancelLabel="No"
          confirmIcon="check"
          tone="danger"
          error={completeConfirmError}
          isConfirming={updateStatus.isPending}
          onConfirm={handleConfirmComplete}
          onCancel={() => setIsCompleteConfirmOpen(false)}
        />
      )}
    </>
  )
}
