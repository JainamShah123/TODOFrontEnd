import Pagination from '@/components/common/Pagination'

// Building blocks for the admin list pages (staff, notices), matching the task board: a page header,
// one card holding a toolbar, a compact table with a bold header row, and a footer with paging.

export const tableClass = 'w-full table-fixed border-collapse text-left text-[14px]'
export const headRowClass =
  'border-y border-border-light bg-surface-container text-[12px] font-extrabold tracking-[0.06em] text-on-surface uppercase'
export const headCellClass = 'px-3 py-3 font-extrabold'
export const cellClass = 'px-3 py-2.5'
export const rowClass = 'group transition-colors hover:bg-surface-subtle'

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
      <div>
        <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
          {title}
        </h2>
        {subtitle && <p className="text-body-lg text-on-surface-variant">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PrimaryButton({ icon, children, ...props }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
      {...props}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {children}
    </button>
  )
}

export function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="relative min-w-[220px] flex-1 md:max-w-sm">
      <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-on-surface-variant">
        search
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-border-light bg-surface-subtle/50 pr-3 pl-10 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
      />
    </label>
  )
}

export function CountSummary({ count, children }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-[13px] text-on-surface-variant">
      <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-bold text-on-surface tabular-nums">
        {count ?? '–'}
      </span>
      <span>{children}</span>
    </p>
  )
}

// options: [{ value, label, count? }]
export function SegmentedFilter({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg bg-surface-subtle p-1" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-bold transition-colors ${
            value === option.value
              ? 'bg-surface-container-lowest text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {option.label}
          {option.count != null && (
            <span className="rounded-full bg-surface-container px-2 text-[11px] tabular-nums">
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// Same pill as the task board's status column: dot + label.
export function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${
        active
          ? 'bg-status-completed/10 text-status-completed'
          : 'bg-surface-container text-on-surface-variant'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-status-completed' : 'bg-outline'}`}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

const actionTones = {
  default: 'hover:bg-surface-container hover:text-primary',
  danger: 'hover:bg-error-container hover:text-error',
  success: 'hover:bg-status-completed/10 hover:text-status-completed',
}

export function IconAction({ icon, label, tone = 'default', onClick, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant/70 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${actionTones[tone]}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  )
}

// Row actions stay faint until the row is hovered (or focused by keyboard), like the task board.
export function RowActions({ children }) {
  return (
    <div className="flex items-center justify-end gap-0.5 opacity-40 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      {children}
    </div>
  )
}

// Loading skeleton, error and empty rows for a table with `columns` columns.
export function TableStateRows({
  columns,
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyIcon,
  emptyMessage,
}) {
  if (isLoading) {
    return Array.from({ length: 6 }, (_, index) => (
      <tr key={index} aria-hidden="true">
        {Array.from({ length: columns }, (__, cell) => (
          <td key={cell} className="px-3 py-3.5">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-container" />
          </td>
        ))}
      </tr>
    ))
  }
  if (isError) {
    return (
      <tr>
        <td colSpan={columns} className="px-3 py-12 text-center text-error">
          {errorMessage}
        </td>
      </tr>
    )
  }
  if (isEmpty) {
    return (
      <tr>
        <td colSpan={columns} className="px-3 py-12 text-center">
          <span className="material-symbols-outlined mb-2 block text-[36px] text-outline-variant">
            {emptyIcon}
          </span>
          <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
        </td>
      </tr>
    )
  }
  return null
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

// Footer inside the card: range shown, page size, and page controls.
export function TableFooter({ pagination, noun, onPageChange, limit, onLimitChange }) {
  if (!pagination) return null
  const { page, total, totalPages } = pagination
  const size = pagination.limit ?? limit
  const first = total === 0 ? 0 : (page - 1) * size + 1
  const last = Math.min(page * size, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-unit-md border-t border-border-light px-4 py-3">
      <div className="flex items-center gap-3 text-label-md text-on-surface-variant">
        <span>
          Showing {first}–{last} of {total} {noun}
        </span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            aria-label="Rows per page"
            className="h-8 cursor-pointer rounded-lg border border-border-light bg-surface-container-lowest px-2 text-[13px] text-on-surface focus:border-primary-container focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        )}
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}
