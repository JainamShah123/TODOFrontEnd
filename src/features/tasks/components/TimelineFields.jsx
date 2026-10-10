import { Controller } from 'react-hook-form'
import SpecificDatesField from '@/features/tasks/components/SpecificDatesField'
import RepeatField from '@/features/tasks/components/RepeatField'
import TimePicker from '@/features/tasks/components/TimePicker'
import { describeRepeatRule } from '@/features/tasks/utils/repeatRule'
import { formatDateKey, relativeDayLabel } from '@/features/tasks/utils/dates'
import { formatTime } from '@/features/tasks/utils/task.utils'

const MODES = [
  { value: 'none', label: 'No deadline', icon: 'all_inclusive', hint: 'Complete when possible' },
  { value: 'custom', label: 'One time', icon: 'event', hint: 'On a date' },
  { value: 'repeat', label: 'Repeats', icon: 'event_repeat', hint: 'Daily, weekly, monthly' },
]

// One line saying what was chosen, e.g. "Every week on Mon and Fri at 9:00 AM".
const summaryOf = ({ timeline, time, customDates, recurrence }) => {
  const at = time ? ` at ${formatTime(time)}` : ''
  if (timeline === 'repeat') return `${describeRepeatRule(recurrence)}${at}`
  const dates = (customDates ?? []).map((entry) => entry.date).filter(Boolean)
  if (dates.length === 1)
    return `Due ${formatDateKey(dates[0])} (${relativeDayLabel(dates[0])})${at}`
  if (dates.length > 1) return `${dates.length} dates, first ${formatDateKey(dates[0])}${at}`
  return null
}

// The task form's "when" section, shared by Create and Edit: no deadline, one time (one or more dates),
// or a repeat rule, then a time for the last two. Uses the form fields timeline, time, customDates, recurrence.
export default function TimelineFields({ control, errors, watch }) {
  const values = watch(['timeline', 'time', 'customDates', 'recurrence'])
  const [timeline, time, customDates, recurrence] = values
  const summary = summaryOf({ timeline, time, customDates, recurrence })
  const error =
    errors.timeline ??
    errors.customDates ??
    errors.customDates?.root ??
    errors.recurrence ??
    errors.time

  return (
    <div className="space-y-3">
      <span className="block text-label-bold font-bold text-on-surface">
        When is this due? <span className="text-error">*</span>
      </span>

      <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border-light md:grid-cols-[220px_minmax(0,1fr)]">
        <Controller
          control={control}
          name="timeline"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Due"
              className="flex gap-1 border-b border-border-light bg-surface-subtle p-2 md:flex-col md:border-r md:border-b-0"
            >
              {MODES.map((mode) => {
                const selected = field.value === mode.value
                return (
                  <button
                    key={mode.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(mode.value)}
                    className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors md:flex-none ${
                      selected
                        ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary-container'
                        : 'text-on-surface-variant hover:bg-surface-container-lowest/70 hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{mode.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-label-md font-bold">{mode.label}</span>
                      <span className="hidden text-[12px] text-on-surface-variant sm:block">
                        {mode.hint}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        />

        <div className="min-w-0 space-y-4 p-4">
          {timeline === 'none' && (
            <p className="text-body-md text-on-surface-variant">
              This task has no due date. It stays open until completed and is never marked as
              delayed.
            </p>
          )}

          {timeline === 'custom' && (
            <Controller
              control={control}
              name="customDates"
              render={({ field }) => (
                <SpecificDatesField value={field.value} onChange={field.onChange} />
              )}
            />
          )}

          {timeline === 'repeat' && (
            <Controller
              control={control}
              name="recurrence"
              render={({ field }) => <RepeatField value={field.value} onChange={field.onChange} />}
            />
          )}

          {(timeline === 'custom' || timeline === 'repeat') && (
            <>
              <div className="flex flex-wrap items-center gap-3 border-t border-border-light pt-4">
                <span className="text-label-md font-bold text-on-surface">At</span>
                <Controller
                  control={control}
                  name="time"
                  render={({ field }) => (
                    <TimePicker id="taskTime" value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              {summary && (
                <p className="flex items-center gap-2 rounded-lg bg-primary-container/10 px-3 py-2 text-body-md font-semibold text-primary">
                  <span className="material-symbols-outlined text-[18px]">
                    {timeline === 'repeat' ? 'event_repeat' : 'event_available'}
                  </span>
                  {summary}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {error?.message && <p className="text-sm text-error">{error.message}</p>}
    </div>
  )
}
