import { Link } from 'react-router-dom'

export function PanelHeader({ icon, title, subtitle, to, linkLabel = 'View all' }) {
  return (
    <div className="flex items-center justify-between gap-unit-sm border-b border-border-light px-unit-lg py-unit-md">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 font-[var(--font-headline)] text-headline-sm text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-primary">{icon}</span>
          {title}
        </h3>
        {subtitle && <p className="text-label-md text-on-surface-variant">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-0.5 text-label-md font-bold whitespace-nowrap text-primary hover:underline">
          {linkLabel}
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      )}
    </div>
  )
}

export function EmptyRow({ children }) {
  return <p className="p-unit-lg text-center text-body-md text-on-surface-variant">{children}</p>
}

export function Panel({ children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm ${className}`}>
      {children}
    </section>
  )
}
