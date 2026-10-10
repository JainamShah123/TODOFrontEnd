import { useState } from 'react'
import {
  addToToday,
  formatDateKey,
  fromDateKey,
  relativeDayLabel,
  todayKey,
} from '@/features/tasks/utils/dates'

const QUICK_DATES = [
  { label: 'Today', amount: 0, unit: 'day' },
  { label: 'Tomorrow', amount: 1, unit: 'day' },
  { label: 'In 3 days', amount: 3, unit: 'day' },
  { label: 'Next week', amount: 1, unit: 'week' },
  { label: 'Next month', amount: 1, unit: 'month' },
]
const MAX_DATES = 60
const inputClass =
  'h-10 rounded-lg border border-border-light bg-surface-container-lowest px-3 text-body-md text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/30 focus:outline-none'
const chipClass = (selected) =>
  `rounded-full border px-3 py-1 text-label-md font-semibold transition-colors ${
    selected
      ? 'border-primary-container bg-primary-container text-on-primary'
      : 'border-border-light bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
  }`
const daysFromToday = (date) => Math.round((fromDateKey(date) - fromDateKey(todayKey())) / 86400000)

// One date, entered whichever way is easiest: a quick pick, "due in N days / weeks / months", or the
// calendar. All three stay in sync. Several dates are still possible via "Add another date".
// `value` is [{ date: 'YYYY-MM-DD' }].
export default function SpecificDatesField({ value = [], onChange }) {
  const dates = value.map((entry) => entry.date).filter(Boolean)
  const [multiple, setMultiple] = useState(dates.length > 1)
  // With several dates, the row below edits a draft that "Add" appends; otherwise it edits the date.
  const [draft, setDraft] = useState('')
  const current = multiple ? draft : (dates[0] ?? '')
  const [amount, setAmount] = useState(current ? String(daysFromToday(current)) : '')
  const [unit, setUnit] = useState('day')

  const emit = (list) => onChange([...new Set(list)].sort().map((date) => ({ date })))
  const setCurrent = (date, { syncAmount = true } = {}) => {
    if (syncAmount) {
      setUnit('day')
      setAmount(date ? String(daysFromToday(date)) : '')
    }
    if (multiple) setDraft(date)
    else emit(date ? [date] : [])
  }
  const changeAmount = (nextAmount, nextUnit) => {
    setAmount(nextAmount)
    setUnit(nextUnit)
    if (nextAmount !== '' && Number(nextAmount) >= 0) {
      setCurrent(addToToday(Number(nextAmount), nextUnit), { syncAmount: false })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_DATES.map((quick) => {
          const date = addToToday(quick.amount, quick.unit)
          return (
            <button
              key={quick.label}
              type="button"
              onClick={() => setCurrent(date)}
              className={chipClass(current === date)}
            >
              {quick.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-body-md text-on-surface">
        <span>Due in</span>
        <input
          type="number"
          min={0}
          max={999}
          value={amount}
          placeholder="5"
          aria-label="How many"
          onChange={(event) => changeAmount(event.target.value, unit)}
          className={`${inputClass} w-20`}
        />
        <select
          value={unit}
          aria-label="Unit"
          onChange={(event) => changeAmount(amount, event.target.value)}
          className={inputClass}
        >
          <option value="day">days</option>
          <option value="week">weeks</option>
          <option value="month">months</option>
        </select>
        <span className="text-on-surface-variant">or on</span>
        <input
          type="date"
          min={todayKey()}
          value={current}
          aria-label="Due date"
          onChange={(event) => setCurrent(event.target.value)}
          className={inputClass}
        />
        {multiple && (
          <button
            type="button"
            disabled={!draft || dates.length >= MAX_DATES}
            onClick={() => {
              emit([...dates, draft])
              setDraft('')
              setAmount('')
            }}
            className="flex h-10 items-center gap-1 rounded-lg bg-primary-container px-3 text-label-md font-bold text-on-primary hover:bg-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add
          </button>
        )}
      </div>

      {multiple
        ? dates.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {dates.map((date) => (
                <li
                  key={date}
                  className="flex items-center gap-1 rounded-full bg-surface-container py-1 pr-1 pl-3 text-label-md text-on-surface"
                >
                  <span className="font-semibold">{formatDateKey(date)}</span>
                  <span className="text-on-surface-variant">· {relativeDayLabel(date)}</span>
                  <button
                    type="button"
                    onClick={() => emit(dates.filter((entry) => entry !== date))}
                    aria-label={`Remove ${formatDateKey(date)}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        : dates.length > 0 && (
            <button
              type="button"
              onClick={() => setMultiple(true)}
              className="text-label-md font-bold text-primary hover:underline"
            >
              + Add another date
            </button>
          )}
    </div>
  )
}
