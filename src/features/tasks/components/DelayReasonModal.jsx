import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { delayReasonSchema } from '@/features/tasks/schemas/delay-reason.schema'
import { formatShortDate } from '@/features/tasks/utils/task.utils'

export default function DelayReasonModal({ task, onClose, onSave }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(delayReasonSchema),
    defaultValues: { delayReason: task.delayReason ?? '' },
  })

  const daysOverdue = Math.max(1, Math.round((new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)))

  const onSubmit = (values) => {
    onSave(task.id, values.delayReason)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-xl">
        <div className="flex items-start justify-between border-b border-border-light p-unit-lg">
          <div>
            <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">Reason for Delay</h2>
            <p className="mt-0.5 text-body-md text-on-surface-variant">{task.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-unit-md p-unit-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-status-delayed/10 px-4 py-2 text-label-md font-bold text-status-delayed">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {daysOverdue} day{daysOverdue === 1 ? '' : 's'} overdue · Due {formatShortDate(task.dueDate)}
          </span>

          <div className="space-y-2">
            <label htmlFor="delayReason" className="block text-label-bold font-bold text-on-surface">
              What's causing the delay?
            </label>
            <textarea
              id="delayReason"
              rows={4}
              placeholder="e.g., Waiting on vendor quotes to come back before I can finish the comparison."
              className="w-full resize-y rounded-lg border border-border-light bg-surface-subtle px-4 py-4 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
              {...register('delayReason')}
            />
            {errors.delayReason && <p className="text-sm text-error">{errors.delayReason.message}</p>}
          </div>

          <div className="flex justify-end gap-4 border-t border-border-light pt-unit-md">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-light bg-transparent px-6 py-2 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-2 text-label-bold font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              {isSubmitting ? 'Saving…' : 'Save Reason'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
