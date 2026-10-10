import { useState } from 'react'
import { WEEKDAYS } from '@/features/tasks/utils/repeatRule'
import { addToToday, todayKey } from '@/features/tasks/utils/dates'

const MONTH_DAYS = Array.from({ length: 31 }, (_, index) => index + 1)
const ODD_DAYS = MONTH_DAYS.filter((day) => day % 2 === 1)
const EVEN_DAYS = MONTH_DAYS.filter((day) => day % 2 === 0)
const ALL_WEEKDAYS = [1, 2, 3, 4, 5]

const inputClass =
  'h-9 rounded-lg border border-border-light bg-surface-container-lowest px-2 text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/30 focus:outline-none'
const pillClass = (selected) =>
  `rounded-full border px-3 py-1 text-label-md font-semibold transition-colors ${
    selected
      ? 'border-primary-container bg-primary-container/10 text-primary'
      : 'border-border-light bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
  }`
const dayClass = (selected) =>
  `flex items-center justify-center rounded-lg text-label-md font-bold transition-colors ${
    selected
      ? 'bg-primary-container text-on-primary'
      : 'border border-border-light bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
  }`

const sameDays = (a, b) =>
  a.length === b.length && [...a].sort((x, y) => x - y).every((day, i) => day === b[i])
const toggle = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

const PRESETS = [
  { value: 'weekday', label: 'Every weekday' },
  { value: 'week', label: 'Every week' },
  { value: 'month', label: 'Every month' },
  { value: 'custom', label: 'Custom' },
]

const presetOf = (rule) => {
  if (Number(rule.every) !== 1) return 'custom'
  if (rule.unit === 'week') return sameDays(rule.weekdays, ALL_WEEKDAYS) ? 'weekday' : 'week'
  if (rule.unit === 'month') return 'month'
  return 'custom'
}

function WeekdayPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-label-md text-on-surface-variant">on</span>
      {WEEKDAYS.map((day) => (
        <button
          key={day.value}
          type="button"
          title={day.label}
          aria-pressed={value.includes(day.value)}
          onClick={() => onChange(toggle(value, day.value))}
          className={`${dayClass(value.includes(day.value))} h-9 w-9`}
        >
          {day.short}
        </button>
      ))}
    </div>
  )
}

// Odd / even dates in one tap; "Pick dates" opens the 1-31 grid (2nd, 4th, 6th...).
function MonthDayPicker({ value, onChange }) {
  const kind = sameDays(value, ODD_DAYS) ? 'odd' : sameDays(value, EVEN_DAYS) ? 'even' : 'pick'
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-label-md text-on-surface-variant">on</span>
        <button
          type="button"
          className={pillClass(kind === 'odd')}
          onClick={() => onChange(ODD_DAYS)}
        >
          Odd dates
        </button>
        <button
          type="button"
          className={pillClass(kind === 'even')}
          onClick={() => onChange(EVEN_DAYS)}
        >
          Even dates
        </button>
        <button
          type="button"
          className={pillClass(kind === 'pick')}
          onClick={() => kind !== 'pick' && onChange([new Date().getDate()])}
        >
          Pick dates
        </button>
      </div>
      {kind === 'pick' && (
        <>
          <div className="grid max-w-xs grid-cols-7 gap-1">
            {MONTH_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={value.includes(day)}
                onClick={() => onChange(toggle(value, day))}
                className={`${dayClass(value.includes(day))} h-8 text-[13px] tabular-nums`}
              >
                {day}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-on-surface-variant">
            The 29th–31st fall on the last day in shorter months.
          </p>
        </>
      )}
    </div>
  )
}

// The repeat rule, preset first: most tasks are one tap. Only the row the preset needs is shown,
// and start / end dates stay tucked away unless used.
export default function RepeatField({ value, onChange }) {
  const [preset, setPreset] = useState(() => presetOf(value))
  const [showStart, setShowStart] = useState((value.start ?? '') > todayKey())
  const set = (changes) => onChange({ ...value, ...changes })

  const choosePreset = (next) => {
    setPreset(next)
    if (next === 'weekday') set({ every: 1, unit: 'week', weekdays: ALL_WEEKDAYS })
    if (next === 'week')
      set({
        every: 1,
        unit: 'week',
        weekdays:
          value.unit === 'week' && !sameDays(value.weekdays, ALL_WEEKDAYS)
            ? value.weekdays
            : [new Date().getDay() || 7],
      })
    if (next === 'month') set({ every: 1, unit: 'month' })
    if (next === 'custom')
      set({
        every: Math.max(Number(value.every) || 1, 2),
        unit: 'week',
        weekdays: value.weekdays?.length ? value.weekdays : [new Date().getDay() || 7],
      })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => choosePreset(option.value)}
            className={pillClass(preset === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label-md text-on-surface-variant">Every</span>
          <input
            type="number"
            min={1}
            max={365}
            value={value.every}
            aria-label="Interval"
            onChange={(event) => set({ every: event.target.value })}
            className={`${inputClass} w-16`}
          />
          <select
            value={value.unit}
            aria-label="Unit"
            onChange={(event) => set({ unit: event.target.value })}
            className={inputClass}
          >
            <option value="day">days</option>
            <option value="week">weeks</option>
            <option value="month">months</option>
          </select>
        </div>
      )}

      {value.unit === 'week' && preset !== 'weekday' && (
        <WeekdayPicker value={value.weekdays} onChange={(weekdays) => set({ weekdays })} />
      )}
      {value.unit === 'month' && (
        <MonthDayPicker value={value.monthDays} onChange={(monthDays) => set({ monthDays })} />
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border-light pt-3">
        <span className="text-label-md font-bold text-on-surface">Until</span>
        <button
          type="button"
          className={pillClass(!value.until)}
          onClick={() => set({ until: null })}
        >
          No end date
        </button>
        <button
          type="button"
          className={pillClass(Boolean(value.until))}
          onClick={() => !value.until && set({ until: addToToday(1, 'month') })}
        >
          End on a date
        </button>
        {value.until && (
          <input
            type="date"
            aria-label="End date"
            value={value.until}
            min={value.start ?? todayKey()}
            onChange={(event) => set({ until: event.target.value || null })}
            className={inputClass}
          />
        )}
        {showStart ? (
          <label className="flex items-center gap-2 text-label-md text-on-surface-variant">
            Starts
            <input
              type="date"
              value={value.start ?? ''}
              min={todayKey()}
              onChange={(event) => set({ start: event.target.value || todayKey() })}
              className={inputClass}
            />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setShowStart(true)}
            className="ml-auto text-label-md font-bold text-primary hover:underline"
          >
            Start later
          </button>
        )}
      </div>
    </div>
  )
}
