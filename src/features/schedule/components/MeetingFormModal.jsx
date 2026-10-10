import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import TimePicker from '@/features/tasks/components/TimePicker'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { meetingSchema, toMeetingPayload } from '@/features/schedule/schemas/meeting.schema'
import { useCreateMeeting, useDeleteMeeting, useUpdateMeeting } from '@/hooks/useMeetings'
import {
  addDays,
  addMinutesToTime,
  formatTimeRange,
  fromDateKey,
  minutesBetween,
  toDateKey,
} from '@/features/schedule/utils/meeting.utils'

const WHEN_OPTIONS = [
  { value: 'anytime', label: 'No fixed date', icon: 'all_inclusive' },
  { value: 'date', label: 'On a day', icon: 'event' },
  { value: 'datetime', label: 'Day & time', icon: 'schedule' },
]

const DURATIONS = [
  { minutes: 15, label: '15m' },
  { minutes: 30, label: '30m' },
  { minutes: 45, label: '45m' },
  { minutes: 60, label: '1h' },
  { minutes: 90, label: '1.5h' },
]

const nextMonday = () => {
  const today = new Date()
  return addDays(today, (8 - today.getDay()) % 7 || 7)
}

const QUICK_DATES = [
  { label: 'Today', get: () => new Date() },
  { label: 'Tomorrow', get: () => addDays(new Date(), 1) },
  { label: 'Next Mon', get: nextMonday },
]

const inputClass =
  'w-full rounded-lg border border-border-light bg-surface-subtle px-3 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container/30 focus:outline-none'
const labelClass =
  'mb-1.5 block text-[12px] font-bold tracking-[0.05em] text-on-surface-variant uppercase'
const chipClass = (selected) =>
  `rounded-full border px-3 py-1 text-label-md font-semibold transition-colors ${
    selected
      ? 'border-primary-container bg-primary-container/10 text-primary'
      : 'border-border-light text-on-surface-variant hover:bg-surface-subtle'
  }`

const whenOf = (meeting) => (!meeting?.date ? 'anytime' : meeting.startTime ? 'datetime' : 'date')

// One modal for creating and editing. It doubles as the meeting's detail view (there is no separate
// page), so editing also offers delete and reopen/done. `initial` pre-fills a new meeting, e.g. the
// title typed into the quick-add bar.
export default function MeetingFormModal({ meeting, initial, onClose, onSaved }) {
  const isEdit = Boolean(meeting)
  const createMeeting = useCreateMeeting()
  const updateMeeting = useUpdateMeeting()
  const deleteMeeting = useDeleteMeeting()
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const source = meeting ?? initial ?? {}
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: source.title ?? '',
      when: source.when ?? whenOf(source),
      date: source.date ?? toDateKey(new Date()),
      startTime: source.startTime ?? '',
      endTime: source.endTime ?? '',
      attendees: source.attendees ?? '',
      location: source.location ?? '',
      notes: source.notes ?? '',
    },
  })

  const when = watch('when')
  const date = watch('date')
  const startTime = watch('startTime')
  const endTime = watch('endTime')
  const duration = startTime && endTime ? minutesBetween(startTime, endTime) : null

  const setDuration = (minutes) => {
    if (!startTime) return
    setValue('endTime', minutes ? (addMinutesToTime(startTime, minutes) ?? '') : '', {
      shouldValidate: true,
    })
  }

  const onSubmit = async (values) => {
    setError(null)
    try {
      const payload = toMeetingPayload(values)
      if (isEdit) await updateMeeting.mutateAsync({ meetingId: meeting.id, payload })
      else await createMeeting.mutateAsync(payload)
      onSaved?.(isEdit ? 'Meeting updated' : 'Meeting added')
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Could not save the meeting. Please try again.')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMeeting.mutateAsync(meeting.id)
      onSaved?.('Meeting deleted')
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Could not delete the meeting.')
      setConfirmDelete(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile">
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-border-light px-unit-lg py-unit-md">
          <h2 className="flex items-center gap-2 font-[var(--font-headline)] text-headline-sm text-on-surface">
            <span className="material-symbols-outlined text-primary">
              {isEdit ? 'edit_calendar' : 'event_available'}
            </span>
            {isEdit ? 'Meeting' : 'New meeting'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-subtle hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-unit-md overflow-y-auto px-unit-lg py-unit-md">
            <div>
              <input
                type="text"
                autoFocus={!isEdit}
                placeholder="What's the meeting about?"
                aria-label="Meeting title"
                className="w-full border-0 border-b-2 border-border-light bg-transparent px-0 pb-2 font-[var(--font-headline)] text-headline-sm text-on-surface placeholder-outline focus:border-primary-container focus:ring-0 focus:outline-none"
                {...register('title')}
              />
              {errors.title && <p className="mt-1 text-sm text-error">{errors.title.message}</p>}
            </div>

            <div>
              <span className={labelClass}>When</span>
              <div
                className="grid grid-cols-3 gap-1 rounded-lg bg-surface-subtle p-1"
                role="radiogroup"
              >
                {WHEN_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={when === option.value}
                    onClick={() => setValue('when', option.value, { shouldValidate: true })}
                    className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-[13px] font-bold transition-colors ${
                      when === option.value
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
              {when === 'anytime' && (
                <p className="mt-2 text-[13px] text-on-surface-variant">
                  It'll sit under <strong>Anytime</strong> until you fix a slot or tick it off.
                </p>
              )}
            </div>

            {when !== 'anytime' && (
              <div className="space-y-3 rounded-lg border border-border-light p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    aria-label="Date"
                    className={`${inputClass} w-auto`}
                    {...register('date')}
                  />
                  {QUICK_DATES.map((quick) => {
                    const key = toDateKey(quick.get())
                    return (
                      <button
                        key={quick.label}
                        type="button"
                        onClick={() => setValue('date', key, { shouldValidate: true })}
                        className={chipClass(date === key)}
                      >
                        {quick.label}
                      </button>
                    )
                  })}
                </div>
                {errors.date && <p className="text-sm text-error">{errors.date.message}</p>}
                {date && (
                  <p className="text-[13px] text-on-surface-variant">
                    {fromDateKey(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {when === 'datetime' &&
                      startTime &&
                      ` · ${formatTimeRange({ startTime, endTime })}`}
                  </p>
                )}

                {when === 'datetime' && (
                  <>
                    <div>
                      <span className={labelClass}>Starts</span>
                      <Controller
                        control={control}
                        name="startTime"
                        render={({ field }) => (
                          <TimePicker
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value)
                              if (duration > 0) {
                                setValue('endTime', addMinutesToTime(value, duration) ?? '')
                              }
                            }}
                          />
                        )}
                      />
                      {errors.startTime && (
                        <p className="mt-1 text-sm text-error">{errors.startTime.message}</p>
                      )}
                    </div>
                    <div>
                      <span className={labelClass}>Length</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setDuration(null)}
                          className={chipClass(!endTime)}
                        >
                          Open-ended
                        </button>
                        {DURATIONS.map((option) => (
                          <button
                            key={option.minutes}
                            type="button"
                            disabled={!startTime}
                            onClick={() => setDuration(option.minutes)}
                            className={`${chipClass(duration === option.minutes)} disabled:cursor-not-allowed disabled:opacity-40`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {errors.endTime && (
                        <p className="mt-1 text-sm text-error">{errors.endTime.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-unit-md sm:grid-cols-2">
              <div>
                <label htmlFor="meetingAttendees" className={labelClass}>
                  With
                </label>
                <input
                  id="meetingAttendees"
                  type="text"
                  placeholder="e.g., Rahul, the CA"
                  className={inputClass}
                  {...register('attendees')}
                />
              </div>
              <div>
                <label htmlFor="meetingLocation" className={labelClass}>
                  Where
                </label>
                <input
                  id="meetingLocation"
                  type="text"
                  placeholder="Office, phone, or a link"
                  className={inputClass}
                  {...register('location')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="meetingNotes" className={labelClass}>
                Notes
              </label>
              <textarea
                id="meetingNotes"
                rows={3}
                placeholder="Agenda, things to bring, outcome…"
                className={`${inputClass} resize-y`}
                {...register('notes')}
              />
            </div>

            {error && <p className="text-sm text-error">{error}</p>}
          </div>

          <div className="flex items-center gap-3 border-t border-border-light px-unit-lg py-unit-md">
            {isEdit && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Delete meeting"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            )}
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border-light px-5 py-2 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-primary-container px-5 py-2 text-label-bold font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isEdit ? 'save' : 'add'}
                </span>
                {isSubmitting ? 'Saving…' : isEdit ? 'Save' : 'Add meeting'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this meeting?"
          description={`“${meeting.title}” will be removed for every admin.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isConfirming={deleteMeeting.isPending}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
