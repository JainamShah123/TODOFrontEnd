import { formatShortDate } from '@/features/tasks/utils/task.utils'
import {
  BOARD_RANGE,
  MAX_CUSTOM_RANGE_DAYS,
  addDays,
  customRangeError,
} from '@/features/tasks/utils/dateRange.utils'

const RANGE_OPTIONS = [
  { key: BOARD_RANGE.THIS_WEEK, label: 'This Week' },
  { key: BOARD_RANGE.LAST_WEEK, label: 'Last Week' },
  { key: BOARD_RANGE.CUSTOM, label: 'Custom Range' },
]

const dateInputClass =
  'h-9 rounded-lg border border-border-light bg-surface-container-lowest px-3 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none'

// This Week / Last Week / Custom Range switch for the task boards. `value` is { range, from, to };
// `resolved` is the { from, to } the API actually used (shown so "this week" is never ambiguous).
export default function TaskRangeFilter({ value, onChange, resolved }) {
  const isCustom = value.range === BOARD_RANGE.CUSTOM
  const error = isCustom ? customRangeError(value.from, value.to) : null

  const summary =
    resolved?.from && resolved?.to && value.range === resolved.range
      ? `${formatShortDate(resolved.from)} – ${formatShortDate(resolved.to)}`
      : null

  return (
    <div className="flex flex-wrap items-center gap-x-unit-md gap-y-2">
      <div className="flex items-center gap-1 rounded-lg border border-border-light bg-surface-container-lowest p-1 shadow-sm">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange({ ...value, range: option.key })}
            className={`rounded px-3 py-1.5 text-label-md font-bold whitespace-nowrap transition-colors ${
              value.range === option.key
                ? 'bg-surface-container text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-subtle'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-label-md font-bold text-on-surface-variant">
            From
            <input
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
              className={dateInputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-label-md font-bold text-on-surface-variant">
            To
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              max={value.from ? addDays(value.from, MAX_CUSTOM_RANGE_DAYS - 1) : undefined}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
              className={dateInputClass}
            />
          </label>
        </div>
      )}

      {summary && !isCustom && (
        <span className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">date_range</span>
          {summary}
        </span>
      )}

      {isCustom && (
        <p className={`basis-full text-label-md ${error ? 'font-bold text-error' : 'text-on-surface-variant'}`}>
          {error ?? `Pick a start and end date. A range can be up to ${MAX_CUSTOM_RANGE_DAYS} days.`}
        </p>
      )}
    </div>
  )
}
