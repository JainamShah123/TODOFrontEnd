import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StaffTaskTable from '@/features/tasks/components/StaffTaskTable'
import TaskPager from '@/features/tasks/components/TaskPager'
import TaskRangeFilter from '@/features/tasks/components/TaskRangeFilter'
import { INITIAL_RANGE_FILTER, toApiFilters } from '@/features/tasks/utils/dateRange.utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTasksPage } from '@/hooks/useTasks'
import { STATUS_META } from '@/features/tasks/utils/task.utils'
import { ROUTES } from '@/constants/routes'

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'All Statuses' },
  ...Object.entries(STATUS_META).map(([key, meta]) => ({ key, label: meta.label })),
]

export default function StaffTaskBoard() {
  const navigate = useNavigate()
  const [rangeFilter, setRangeFilter] = useState(INITIAL_RANGE_FILTER)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search.trim())

  // A custom range waits until both dates are picked and valid; nothing is requested before that.
  // The API only ever returns the signed-in staff member's own tasks.
  const apiFilters = toApiFilters(rangeFilter)
  const { tasks, pagination, range, isLoading, isFetching, isError } = useTasksPage(
    {
      ...(apiFilters ?? { range: rangeFilter.range }),
      search: debouncedSearch,
      status: statusFilter === 'all' ? undefined : statusFilter,
      page,
    },
    { enabled: Boolean(apiFilters) },
  )

  // Any change to what's being listed starts again from page 1.
  const changeFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  // If tasks drop out (status changed) and the page we're on no longer exists, step back (state adjusted while rendering, as React recommends).
  if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) setPage(pagination.totalPages)

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Task Board
          </h2>
          <p className="text-body-lg text-on-surface-variant">Your assigned tasks, all in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF_TASKS_CREATE)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create New Task
        </button>
      </div>

      <TaskRangeFilter value={rangeFilter} onChange={changeFilter(setRangeFilter)} resolved={range} />

      <div className="flex flex-wrap items-center gap-unit-md">
        <input
          type="text"
          value={search}
          onChange={(event) => changeFilter(setSearch)(event.target.value)}
          placeholder="Search your tasks by title..."
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => changeFilter(setStatusFilter)(event.target.value)}
          className="h-9 rounded-lg border border-border-light bg-surface-container-lowest px-3 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-border-light bg-surface-container-lowest px-unit-md py-unit-sm text-label-md text-on-surface-variant">
        <span className="material-symbols-outlined text-[15px]">info</span>
        Open a task to update its status. If it runs past its due date, add a reason there so admin can see why.
      </div>

      <div className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
        <StaffTaskTable tasks={tasks} isLoading={isLoading} isError={isError} />
      </div>

      <TaskPager pagination={pagination} onPageChange={setPage} />
    </>
  )
}
