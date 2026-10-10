const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ProductivityChart({ percentage }) {
  const offset = CIRCUMFERENCE * (1 - percentage / 100)

  return (
    <div className="flex flex-col rounded-xl border border-border-light bg-surface-container-lowest p-unit-lg shadow-sm">
      <h3 className="mb-unit-lg font-[var(--font-headline)] text-headline-sm text-on-surface">Overall Productivity</h3>
      <div className="relative flex min-h-[200px] flex-1 flex-col items-center justify-center">
        <svg className="h-40 w-40 -rotate-90 transform" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--color-border-light)" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="var(--color-status-completed)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[var(--font-headline)] text-display-lg text-on-surface">{percentage}%</span>
          <span className="text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
            Completion
          </span>
        </div>
      </div>
      <div className="mt-unit-lg space-y-unit-sm">
        <div className="flex items-center justify-between text-body-md">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-status-completed" /> Completed
          </span>
          <span className="font-medium">{percentage}%</span>
        </div>
        <div className="flex items-center justify-between text-body-md">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-border-light" /> Remaining
          </span>
          <span className="font-medium">{100 - percentage}%</span>
        </div>
      </div>
    </div>
  )
}
