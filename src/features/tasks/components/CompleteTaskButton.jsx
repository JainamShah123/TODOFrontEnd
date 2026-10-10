import { useState } from 'react'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useUpdateTaskStatus } from '@/hooks/useTasks'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { TASK_STATUS } from '@/features/tasks/utils/task.utils'

// The one action a user takes on a task: mark it done. Whether it then reads "Completed" or
// "Completed Late" is worked out from the due date, not chosen. Completing is final, so it asks first.
export default function CompleteTaskButton({ task }) {
  const updateStatus = useUpdateTaskStatus()
  const updateTask = useTaskStore((state) => state.updateTask)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(null)

  const handleConfirm = async () => {
    setError(null)
    try {
      const response = await updateStatus.mutateAsync({ taskId: task.id, status: TASK_STATUS.COMPLETED })
      updateTask(task.id, {
        status: TASK_STATUS.COMPLETED,
        completedAt: response?.data?.task?.completionAt ?? new Date().toISOString(),
        displayStatus: response?.data?.task?.displayStatus ?? null,
      })
      setIsOpen(false)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Could not update the task. Please try again.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setIsOpen(true)
        }}
        className="flex items-center gap-2 rounded-lg bg-status-completed px-4 py-2 text-label-bold font-bold whitespace-nowrap text-white transition-opacity hover:opacity-90"
      >
        <span className="material-symbols-outlined text-[16px]">check</span>
        Complete
      </button>
      {isOpen && (
        <ConfirmDialog
          title="Mark this task as completed?"
          description={`“${task.title}” will move to Completed. This can't be undone.`}
          confirmLabel="Complete"
          cancelLabel="Cancel"
          confirmIcon="check"
          tone="default"
          error={error}
          isConfirming={updateStatus.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
