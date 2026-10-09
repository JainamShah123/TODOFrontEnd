import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TaskTable from '@/features/tasks/components/TaskTable'
import EditTaskModal from '@/features/tasks/components/EditTaskModal'
import TaskPager from '@/features/tasks/components/TaskPager'
import TaskRangeFilter from '@/features/tasks/components/TaskRangeFilter'
import { INITIAL_RANGE_FILTER, toApiFilters } from '@/features/tasks/utils/dateRange.utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTasksPage } from '@/hooks/useTasks'
import { STATUS_META } from '@/features/tasks/utils/task.utils'
import { ROUTES } from '@/constants/routes'

// `assigneeType` is what the API filters on; `count` is the key of the matching number in its `counts`.
const OWNER_FILTERS = [
  { key: 'all', label: 'All Tasks', assigneeType: undefined, count: 'all' },
  { key: 'mine', label: 'My Tasks', assigneeType: 'admin', count: 'admin' },
  { key: 'staff', label: 'Staff Tasks', assigneeType: 'staff', count: 'staff' },
]

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'All Statuses' },
  ...Object.entries(STATUS_META).map(([key, meta]) => ({ key, label: meta.label })),
]

export default function TaskBoard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const staffFilter = searchParams.get('staff')
  const [rangeFilter, setRangeFilter] = useState(INITIAL_RANGE_FILTER)
  const [search, setSearch] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editingTask, setEditingTask] = useState(null)

  const debouncedSearch = useDebouncedValue(search.trim())
  const ownerOption = OWNER_FILTERS.find((filter) => filter.key === ownerFilter)

  // A custom range waits until both dates are picked and valid; nothing is requested before that.
  const apiFilters = toApiFilters(rangeFilter)
  const { tasks, pagination, range, counts, isLoading, isFetching, isError } = useTasksPage(
    {
      ...(apiFilters ?? { range: rangeFilter.range }),
      search: debouncedSearch,
      status: statusFilter === 'all' ? undefined : statusFilter,
      assigneeType: ownerOption.assigneeType,
      assigneeId: staffFilter ?? undefined,
      page,
    },
    { enabled: Boolean(apiFilters) },
  )

  // Any change to what's being listed starts again from page 1.
  const changeFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  // If tasks drop out (deleted, status changed) and the page we're on no longer exists, step back (state adjusted while rendering, as React recommends).
  if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) setPage(pagination.totalPages)

  // Only the current page's tasks are loaded, so the name comes from them; if this page has none of
  // that person's tasks the chip just says so.
  const staffFilterName = useMemo(
    () => (staffFilter ? (tasks.find((task) => task.assignee?.id === staffFilter)?.assignee?.name ?? 'Selected staff') : null),
    [tasks, staffFilter],
  )

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Task Board
          </h2>
          <p className="text-body-lg text-on-surface-variant">Your tasks and your team's, all in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_TASKS_CREATE)}
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
          placeholder="Search tasks by title..."
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
        <div className="flex items-center gap-1 rounded-lg border border-border-light bg-surface-container-lowest p-1 shadow-sm">
          {OWNER_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => changeFilter(setOwnerFilter)(filter.key)}
              className={`rounded px-3 py-1.5 text-label-md font-bold whitespace-nowrap transition-colors ${
                ownerFilter === filter.key
                  ? 'bg-surface-container text-on-surface'
                  : 'text-on-surface-variant hover:bg-surface-subtle'
              }`}
            >
              {filter.label}{' '}
              <span className="opacity-70 tabular-nums">
                {counts?.[filter.count] ?? '–'}
              </span>
            </button>
          ))}
        </div>
        {staffFilter && (
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container py-1.5 pr-1.5 pl-3 text-label-md font-bold text-on-secondary-container">
            Assignee: {staffFilterName}
            <button
              type="button"
              onClick={() => {
                setSearchParams({}, { replace: true })
                setPage(1)
              }}
              aria-label="Clear assignee filter"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-on-secondary-container/15 hover:bg-on-secondary-container/25"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-unit-lg gap-y-1 rounded-lg border border-dashed border-border-light bg-surface-container-lowest px-unit-md py-unit-sm text-label-md text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          Staff tasks lock for editing once past <strong className="text-on-surface">To Do</strong>.
        </span>
      </div>

      <div className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
        <TaskTable tasks={tasks} onEdit={setEditingTask} isLoading={isLoading} isError={isError} />
      </div>

      <TaskPager pagination={pagination} onPageChange={setPage} />

      {editingTask && (
        <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </>
  )
}
