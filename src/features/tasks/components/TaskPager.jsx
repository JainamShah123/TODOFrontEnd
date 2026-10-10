import Pagination from '@/components/common/Pagination'

// Footer under a task table: which tasks are on screen, plus page controls when there's more than one page.
export default function TaskPager({ pagination, onPageChange }) {
  if (!pagination) return null

  const { page, limit, total, totalPages } = pagination
  const first = total === 0 ? 0 : (page - 1) * limit + 1
  const last = Math.min(page * limit, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-unit-md">
      <p className="text-label-md text-on-surface-variant">
        Showing {first}–{last} of {total} {total === 1 ? 'task' : 'tasks'}
      </p>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  )
}
