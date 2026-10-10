import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { createTaskSchema } from '@/features/tasks/schemas/task.schema'
import {
  ADMIN_ASSIGNEE_ID,
  ADMIN_ASSIGNEE_OPTION,
  TIMELINE_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/features/tasks/data/task-options.data'
import { useStaffOptions } from '@/hooks/useStaff'
import { useCreateTask } from '@/hooks/useTasks'
import { useTaskStore } from '@/features/tasks/store/taskStore'
import { mapApiTask } from '@/features/tasks/utils/task.utils'
import { useAuthStore } from '@/store/authStore'
import { Role } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import Toast from '@/components/common/Toast'
import SelectField from '@/features/tasks/components/SelectField'
import CustomDatesField from '@/features/tasks/components/CustomDatesField'

const ATTACHMENT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg'

export default function CreateTaskForm() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isStaff = user?.role === Role.STAFF
  const homeRoute = isStaff ? ROUTES.STAFF_DASHBOARD : ROUTES.ADMIN_DASHBOARD
  const createTask = useCreateTask()
  const addTask = useTaskStore((state) => state.addTask)
  const [toast, setToast] = useState(null)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      broker: '',
      // Staff can only ever create a task assigned to themselves (enforced
      // server-side too) — fixing this up front means the field doesn't need
      // to be registered/rendered as an input for a staff user at all.
      assignedTo: isStaff ? (user?.id ?? '') : '',
      timeline: '',
      time: '',
      customDates: [],
      priority: 'medium',
    },
  })

  const timeline = watch('timeline')
  const { data: staffOptions = [], isLoading: staffLoading, isError: staffError } = useStaffOptions({ enabled: !isStaff })
  const assigneeOptions = [ADMIN_ASSIGNEE_OPTION, ...staffOptions]

  const onSubmit = async (values) => {
    const assignToAdmin = values.assignedTo === ADMIN_ASSIGNEE_OPTION.value

    try {
      const response = await createTask.mutateAsync({
        title: values.title,
        description: values.description,
        broker: values.broker,
        assigneeType: assignToAdmin ? 'admin' : 'staff',
        assigneeId: assignToAdmin ? ADMIN_ASSIGNEE_ID : values.assignedTo,
        timeline: values.timeline,
        time: values.time,
        customDates: values.timeline === 'custom' ? values.customDates.filter((entry) => entry.date) : undefined,
        priority: values.priority,
        attachment: values.attachment?.[0],
      })
      if (response?.data?.task) addTask(mapApiTask(response.data.task))
      setToast({ message: 'Task Created Successfully.', tone: 'success' })
      setTimeout(() => navigate(homeRoute), 1200)
    } catch {
      // surfaced below via createTask.isError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-unit-lg p-unit-lg md:p-margin-desktop">
      <div className="grid grid-cols-1 gap-unit-lg">
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
          <textarea
            id="description"
            rows={4}
            placeholder="Provide detailed instructions and context for this task..."
            className="w-full resize-y rounded-lg border border-border-light bg-surface-subtle px-4 py-4 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
            {...register('description')}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="attachment" className="block text-label-bold font-bold text-on-surface">
            Add attachment
          </label>
          <input
            id="attachment"
            type="file"
            accept={ATTACHMENT_TYPES}
            className="block w-full cursor-pointer rounded-lg border border-border-light bg-surface-subtle text-body-md text-on-surface-variant file:mr-4 file:rounded-lg file:border-0 file:bg-secondary-container file:px-4 file:py-2 file:text-body-md file:font-semibold file:text-on-secondary-container hover:file:bg-secondary-fixed"
            {...register('attachment')}
          />
        </div>

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

      <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
        {isStaff ? (
          <div className="space-y-2">
            <label className="block text-label-bold font-bold text-on-surface">
              Assigned To <span className="text-error">*</span>
            </label>
            <p className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface-variant">
              {user?.name ?? 'You'} (You)
            </p>
          </div>
        ) : (
          <SelectField
            label="Assigned To"
            required
            placeholder={staffLoading ? 'Loading staff…' : 'Select Staff Member'}
            options={assigneeOptions}
            disabled={staffLoading}
            error={
              errors.assignedTo?.message ??
              (staffError ? "Couldn't load staff members. You can still assign the task to yourself." : undefined)
            }
            {...register('assignedTo')}
          />
        )}
        <SelectField
          label="Timeline"
          required
          placeholder="Select Timeline"
          options={TIMELINE_OPTIONS}
          error={errors.timeline?.message}
          {...register('timeline')}
        />
      </div>

      {timeline && (
        <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
          {timeline === 'custom' && <CustomDatesField register={register} errors={errors} />}
          <div className="space-y-2">
            <label htmlFor="taskTime" className="block text-label-bold font-bold text-on-surface">
              Time <span className="text-error">*</span>
            </label>
            <input
              id="taskTime"
              type="time"
              className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
              {...register('time')}
            />
            <p className="text-label-md text-on-surface-variant">
              Time for {TIMELINE_OPTIONS.find((option) => option.value === timeline)?.label}
            </p>
            {errors.time && <p className="text-sm text-error">{errors.time.message}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
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
      </div>

      {createTask.isError && (
        <p className="text-sm text-error">
          {createTask.error?.response?.data?.message ?? 'Unable to create the task. Please try again.'}
        </p>
      )}

      <div className="flex flex-col items-center justify-end gap-4 border-t border-border-light pt-unit-lg md:flex-row">
        <button
          type="button"
          onClick={() => navigate(homeRoute)}
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

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </form>
  )
}
