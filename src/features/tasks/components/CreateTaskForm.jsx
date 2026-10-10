import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { createTaskSchema } from '@/features/tasks/schemas/task.schema'
import { ADMIN_ASSIGNEE_OPTION, PRIORITY_OPTIONS } from '@/features/tasks/data/task-options.data'
import { useStaffOptions } from '@/hooks/useStaff'
import { useCreateTask } from '@/hooks/useTasks'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { mapApiTask } from '@/features/tasks/utils/task.utils'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import Toast from '@/components/common/Toast'
import SelectField from '@/features/tasks/components/SelectField'
import TimelineFields from '@/features/tasks/components/TimelineFields'
import RichTextEditor from '@/features/tasks/components/RichTextEditor'
import { defaultRepeatRule } from '@/features/tasks/utils/repeatRule'
import { timelinePayload } from '@/features/tasks/utils/timelinePayload'

const ATTACHMENT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg'

export default function CreateTaskForm() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isStaff = user?.role === Role.STAFF
  // Back to the board the user came from; its filters live in the URL, so they survive the round trip.
  const homeRoute = isStaff ? ROUTES.STAFF_TASK_BOARD : ROUTES.ADMIN_TASK_BOARD
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(homeRoute))
  const createTask = useCreateTask()
  const addTask = useTaskStore((state) => state.addTask)
  const [toast, setToast] = useState(null)
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      broker: '',
      // Staff start on themselves and can pick another staff member; admins pick explicitly.
      assignedTo: isStaff ? (user?.id ?? '') : '',
      timeline: 'custom',
      time: '',
      customDates: [],
      recurrence: defaultRepeatRule(),
      priority: 'medium',
    },
  })

  const {
    data: staffOptions = [],
    isLoading: staffLoading,
    isError: staffError,
  } = useStaffOptions()
  // Staff can assign to themselves or another staff member, never to an admin (the API enforces this too).
  const assigneeOptions = isStaff
    ? [
        { value: user?.id ?? '', label: `${user?.name ?? 'Me'} (You)` },
        ...staffOptions.filter((option) => option.value !== user?.id),
      ]
    : [ADMIN_ASSIGNEE_OPTION, ...staffOptions]

  const onSubmit = async (values) => {
    const assignToAdmin = !isStaff && values.assignedTo === ADMIN_ASSIGNEE_OPTION.value

    try {
      const response = await createTask.mutateAsync({
        title: values.title,
        description: values.description,
        broker: values.broker,
        assigneeType: assignToAdmin ? 'admin' : 'staff',
        assigneeId: assignToAdmin ? user?.id : values.assignedTo,
        ...timelinePayload(values),
        priority: values.priority,
        attachment: values.attachment?.[0],
      })
      if (response?.data?.task) addTask(mapApiTask(response.data.task))
      setToast({ message: 'Task Created Successfully.', tone: 'success' })
      setTimeout(goBack, 800)
    } catch {
      // surfaced below via createTask.isError
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-unit-lg p-unit-lg md:p-margin-desktop"
    >
      <div className="space-y-2">
        <label htmlFor="title" className="block text-label-bold font-bold text-on-surface">
          Task Title <span className="text-error">*</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="e.g., Q3 Financial Audit Prep"
          className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
          {...register('title')}
        />
        {errors.title && <p className="text-sm text-error">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-label-bold font-bold text-on-surface">
          Description
        </label>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <RichTextEditor
              id="description"
              value={field.value}
              onChange={field.onChange}
              placeholder="Add details, or a checklist of steps the assignee can tick off…"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
        <SelectField
          label="Assigned To"
          required
          placeholder={
            isStaff ? undefined : staffLoading ? 'Loading staff…' : 'Select Staff Member'
          }
          options={assigneeOptions}
          disabled={staffLoading}
          error={
            errors.assignedTo?.message ??
            (staffError
              ? "Couldn't load staff members. You can still assign the task to yourself."
              : undefined)
          }
          {...register('assignedTo')}
        />
        <div className="space-y-2">
          <label htmlFor="broker" className="block text-label-bold font-bold text-on-surface">
            Broker
          </label>
          <input
            id="broker"
            type="text"
            placeholder="e.g., Broker or agency name"
            className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
            {...register('broker')}
          />
        </div>
      </div>

      <div className="h-px w-full bg-border-light" />

      <TimelineFields control={control} errors={errors} watch={watch} />

      <div className="h-px w-full bg-border-light" />

      <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
        <div className="space-y-2">
          <span className="block text-label-bold font-bold text-on-surface">Priority Level</span>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-light px-4 py-2 has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/10"
              >
                <input
                  type="radio"
                  value={option.value}
                  className={option.accentClass}
                  {...register('priority')}
                />
                <span className="text-body-md text-on-surface">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="attachment" className="block text-label-bold font-bold text-on-surface">
            Attachment
          </label>
          <input
            id="attachment"
            type="file"
            accept={ATTACHMENT_TYPES}
            className="block w-full cursor-pointer rounded-lg border border-border-light bg-surface-subtle text-body-md text-on-surface-variant file:mr-4 file:rounded-lg file:border-0 file:bg-secondary-container file:px-4 file:py-2 file:text-body-md file:font-semibold file:text-on-secondary-container hover:file:bg-secondary-fixed"
            {...register('attachment')}
          />
        </div>
      </div>

      {createTask.isError && (
        <p className="text-sm text-error">
          {createTask.error?.response?.data?.message ??
            'Unable to create the task. Please try again.'}
        </p>
      )}

      <div className="flex flex-col items-center justify-end gap-4 border-t border-border-light pt-unit-lg md:flex-row">
        <button
          type="button"
          onClick={goBack}
          className="w-full rounded-lg border border-border-light bg-transparent px-6 py-2 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-border-light md:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || createTask.isPending || createTask.isSuccess}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-2 text-label-bold font-bold text-on-primary shadow-sm transition-colors hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
        >
          <span className="material-symbols-outlined text-[16px]">check</span>
          {isSubmitting || createTask.isPending ? 'Creating…' : 'Create Task'}
        </button>
      </div>

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />
      )}
    </form>
  )
}
