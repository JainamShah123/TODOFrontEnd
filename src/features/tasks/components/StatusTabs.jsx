import { STATUS_META, STATUS_TABS } from '@/features/tasks/utils/task.utils'

// One tab per display status, each with its count (the API's counts.byStatus). This is the only filter
// on the boards besides search, so a task can never be hidden by a forgotten date range.
export default function StatusTabs({ value, onChange, counts }) {
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-2">
      {STATUS_TABS.map((key) => {
        const meta = STATUS_META[key]
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-label-md font-bold whitespace-nowrap transition-colors ${
              active
                ? `border-transparent ${meta.bgClass} ${meta.textClass}`
                : 'border-border-light bg-surface-container-lowest text-on-surface-variant hover:bg-surface-subtle'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
            {meta.label}
            <span className="tabular-nums opacity-70">{counts?.[key] ?? '–'}</span>
          </button>
        )
      })}
    </div>
  )
}
