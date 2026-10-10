// "3 of 5 done" with a bar. `compact` is the small inline version for table rows.
export default function ChecklistProgress({ progress, compact = false }) {
  const { done, total } = progress
  const percent = Math.round((done / total) * 100)
  const complete = done === total

  if (compact) {
    return (
      <span
        title={`Checklist: ${done} of ${total} done`}
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
          complete
            ? 'bg-status-completed/10 text-status-completed'
            : 'bg-surface-container text-on-surface-variant'
        }`}
      >
        <span className="material-symbols-outlined text-[14px]">checklist</span>
        {done}/{total}
      </span>
    )
  }

  return (
    <div className="max-w-sm">
      <div className="mb-1 flex items-center justify-between text-label-md">
        <span className="font-semibold text-on-surface">
          Checklist · {done} of {total} done
        </span>
        <span className="tabular-nums text-on-surface-variant">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-status-completed' : 'bg-primary-container'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
