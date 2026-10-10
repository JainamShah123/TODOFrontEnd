export default function MetricCard({ label, value, delta, icon }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border-light bg-surface-container-lowest p-unit-lg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-unit-md flex items-start justify-between">
        <div className="rounded-lg bg-surface-container p-2 text-primary">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>
      <div>
        <p className="mb-2 text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">{label}</p>
        <div className="flex items-end gap-2">
          <h3 className="font-[var(--font-headline)] text-display-lg leading-none text-on-surface">{value}</h3>
          {delta && (
            <span className="mb-2 flex items-center gap-0.5 text-label-bold font-bold text-status-completed">
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              {delta}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
