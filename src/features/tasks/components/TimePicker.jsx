const HOURS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5)
const QUICK_TIMES = [
  { value: '09:00', label: '9 AM' },
  { value: '12:00', label: '12 PM' },
  { value: '15:00', label: '3 PM' },
  { value: '18:00', label: '6 PM' },
]
const pad = (value) => String(value).padStart(2, '0')

const selectClass =
  'h-10 cursor-pointer rounded-lg border border-border-light bg-surface-subtle px-3 text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/30 focus:outline-none'

// Time as three short pickers (hour 1-12, minutes in 5s, AM/PM) plus one-tap common times, instead of
// the browser's time input. `value` / `onChange` use 24-hour "HH:mm"; '' means not picked yet.
export default function TimePicker({ id, value, onChange }) {
  const [hour24, minute] = value ? value.split(':').map(Number) : [null, null]
  const isPm = hour24 != null && hour24 >= 12
  const hour12 = hour24 == null ? '' : hour24 % 12 || 12
  // An older task may have a minute that isn't a multiple of 5; keep it selectable.
  const minutes =
    minute != null && !MINUTES.includes(minute)
      ? [...MINUTES, minute].sort((a, b) => a - b)
      : MINUTES

  const emit = (nextHour12, nextMinute, nextPm) => {
    const hour = (Number(nextHour12) % 12) + (nextPm ? 12 : 0)
    onChange(`${pad(hour)}:${pad(nextMinute)}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <select
          id={id}
          aria-label="Hour"
          value={hour12}
          onChange={(event) => emit(event.target.value, minute ?? 0, hour24 == null ? true : isPm)}
          className={selectClass}
        >
          <option value="" disabled>
            Hour
          </option>
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <span className="font-bold text-on-surface-variant">:</span>
        <select
          aria-label="Minutes"
          value={minute ?? ''}
          onChange={(event) =>
            emit(hour12 || 9, Number(event.target.value), hour24 == null ? false : isPm)
          }
          className={selectClass}
        >
          <option value="" disabled>
            Min
          </option>
          {minutes.map((option) => (
            <option key={option} value={option}>
              {pad(option)}
            </option>
          ))}
        </select>
        <div
          className="flex overflow-hidden rounded-lg border border-border-light"
          role="group"
          aria-label="AM or PM"
        >
          {['AM', 'PM'].map((period) => {
            const selected = hour24 != null && (period === 'PM') === isPm
            return (
              <button
                key={period}
                type="button"
                aria-pressed={selected}
                onClick={() => emit(hour12 || 9, minute ?? 0, period === 'PM')}
                className={`h-10 px-3 text-label-md font-bold transition-colors ${
                  selected
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-subtle text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {period}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_TIMES.map((time) => (
          <button
            key={time.value}
            type="button"
            onClick={() => onChange(time.value)}
            className={`rounded-full border px-3 py-1 text-label-md font-semibold transition-colors ${
              value === time.value
                ? 'border-primary-container bg-primary-container/10 text-primary'
                : 'border-border-light text-on-surface-variant hover:bg-surface-subtle'
            }`}
          >
            {time.label}
          </button>
        ))}
      </div>
    </div>
  )
}
