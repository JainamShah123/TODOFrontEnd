import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { editTaskSchema } from '@/features/tasks/schemas/edit-task.schema'
import { TIMELINE_OPTIONS, PRIORITY_OPTIONS } from '@/features/tasks/data/task-options.data'
import { useUpdateTask } from '@/hooks/useTasks'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { attachmentFileName, isAdminAssignee, mapApiTask } from '@/features/tasks/utils/task.utils'
import SelectField from '@/features/tasks/components/SelectField'
import CustomDatesField from '@/features/tasks/components/CustomDatesField'

export default function EditTaskModal({ task, onClose }) {
  const updateTask = useUpdateTask()
  const updateTaskLocal = useTaskStore((state) => state.updateTask)
  const [apiError, setApiError] = useState(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      broker: task.broker ?? '',
      timeline: task.timeline,
      time: task.time ?? '',
      customDates: task.customDates ?? [],
      priority: task.priority,
    },
  })

  const timeline = watch('timeline')

  // Assignee is read-only for now — the field stays in the modal so the user
  // can see who the task is assigned to, but changing it isn't wired up yet.
  const currentAssigneeOption = isAdminAssignee(task)
    ? { value: 'admin', label: 'You (Admin)' }
    : { value: task.assignee?.id, label: task.assignee?.name ?? 'Unassigned' }

  const onSubmit = async (values) => {
    setApiError(null)

    try {
      const response = await updateTask.mutateAsync({
        taskId: task.id,
        payload: {
          title: values.title,
          description: values.description,
          broker: values.broker,
          // Assignee is read-only in this modal for now — always resend the
          // task's current assignee unchanged (still required by the API).
          assigneeType: task.assignee?.type,
          assigneeId: task.assignee?.id,
          timeline: values.timeline,
          time: values.time,
          customDates: values.timeline === 'custom' ? values.customDates.filter((entry) => entry.date) : undefined,
          priority: values.priority,
          // Omitted entirely when no new file is chosen, so the API keeps the
          // existing attachment (it has no separate "remove" mechanism).
          attachment: values.attachment?.[0],
        },
      })
      if (response?.data?.task) {
        // Keep local-only fields (delayReason/delayReasonAt) intact — they
        // aren't part of the API response, so mapApiTask would otherwise reset
        // them to null on every edit.
        const mapped = mapApiTask(response.data.task)
        delete mapped.delayReason
        delete mapped.delayReasonAt
        updateTaskLocal(task.id, mapped)
      }
      onClose()
    } catch (error) {
      setApiError(error?.response?.data?.message ?? 'Unable to update the task. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-border-light p-unit-lg">
          <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">Edit Task</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-unit-lg overflow-y-auto p-unit-lg"
        >
          <div className="space-y-2">
            <label htmlFor="editTaskTitle" className="block text-label-bold font-bold text-on-surface">
              Task Title <span className="text-error">*</span>
            </label>
            <input
              id="editTaskTitle"
              type="text"
              className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-error">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="editTaskDescription" className="block text-label-bold font-bold text-on-surface">
              Description
            </label>
            <textarea
              id="editTaskDescription"
              rows={3}
              className="w-full resize-y rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="editTaskAttachment" className="block text-label-bold font-bold text-on-surface">
              {task.attachmentUrl ? 'Replace attachment' : 'Add attachment'}
            </label>
            {task.attachmentUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-subtle px-4 py-2">
                <span className="flex items-center gap-2 text-body-md text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">description</span>
                  Current: {attachmentFileName(task.attachmentUrl)}
                </span>
              </div>
            )}
            <input
              id="editTaskAttachment"
              type="file"
              className="block w-full cursor-pointer rounded-lg border border-border-light bg-surface-subtle text-body-md text-on-surface-variant file:mr-4 file:rounded-lg file:border-0 file:bg-secondary-container file:px-4 file:py-2 file:text-body-md file:font-semibold file:text-on-secondary-container hover:file:bg-secondary-fixed"
              {...register('attachment')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="editTaskBroker" className="block text-label-bold font-bold text-on-surface">
              Broker
            </label>
            <input
              id="editTaskBroker"
              type="text"
              placeholder="e.g., Broker or agency name"
              className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
              {...register('broker')}
            />
          </div>

          <div className="h-px w-full bg-border-light" />

          <SelectField
            label="Assigned To"
            disabled
            options={[currentAssigneeOption]}
            defaultValue={currentAssigneeOption.value}
          />

          <SelectField
            label="Timeline"
            required
            options={TIMELINE_OPTIONS}
            error={errors.timeline?.message}
            {...register('timeline')}
          />

          {timeline === 'custom' && <CustomDatesField register={register} errors={errors} />}

          {timeline && (
            <div className="space-y-2">
              <label htmlFor="editTaskTime" className="block text-label-bold font-bold text-on-surface">
                Time <span className="text-error">*</span>
              </label>
              <input
                id="editTaskTime"
                type="time"
                className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
                {...register('time')}
              />
              <p className="text-label-md text-on-surface-variant">
                Time for {TIMELINE_OPTIONS.find((option) => option.value === timeline)?.label}
              </p>
              {errors.time && <p className="text-sm text-error">{errors.time.message}</p>}
            </div>
          )}

          <div className="space-y-4">
            <span className="block text-label-bold font-bold text-on-surface">Priority Level</span>
            <div className="flex gap-4">
              {PRIORITY_OPTIONS.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" value={option.value} className={option.accentClass} {...register('priority')} />
                  <span className="text-body-md text-on-surface">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {apiError && <p className="text-sm text-error">{apiError}</p>}

          <div className="flex justify-end gap-4 border-t border-border-light pt-unit-lg">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-light bg-transparent px-6 py-2 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || updateTask.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-2 text-label-bold font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              {isSubmitting || updateTask.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
