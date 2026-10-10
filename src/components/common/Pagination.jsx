export default function Pagination({ page, totalPages, onPageChange }) {
  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light text-on-surface-variant transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
      </button>
      <span className="text-label-md font-bold whitespace-nowrap text-on-surface-variant">
        Page {page} of {safeTotalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= safeTotalPages}
        aria-label="Next page"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light text-on-surface-variant transition-colors hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  )
}
