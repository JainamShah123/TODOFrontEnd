import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TaskTable from '@/features/tasks/components/TaskTable'
import EditTaskModal from '@/features/tasks/components/EditTaskModal'
import TaskPager from '@/features/tasks/components/TaskPager'
import StatusTabs from '@/features/tasks/components/StatusTabs'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useStatusTab } from '@/hooks/useStatusTab'
import { useTasksPage } from '@/hooks/useTasks'
import { STATUS_META } from '@/features/tasks/utils/task.utils'
import { ROUTES } from '@/constants/routes'

// `assigneeType` is what the API filters on; `count` is the key of the matching number in its `counts`.
const OWNER_FILTERS = [
  { key: 'all', label: 'All Tasks', assigneeType: undefined, count: 'all' },
  { key: 'mine', label: 'My Tasks', assigneeType: 'admin', count: 'admin' },
  { key: 'staff', label: 'Staff Tasks', assigneeType: 'staff', count: 'staff' },
]

export default function TaskBoard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const staffFilter = searchParams.get('staff')
  const [search, setSearch] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editingTask, setEditingTask] = useState(null)

  const debouncedSearch = useDebouncedValue(search.trim())
  const ownerOption = OWNER_FILTERS.find((filter) => filter.key === ownerFilter)

  // The default tab depends on the counts, but the counts come back with the list the tab requests, so
  // the last counts seen are kept here (state adjusted while rendering, as React recommends).
  const [statusCounts, setStatusCounts] = useState(null)
  const [tab, setTab] = useStatusTab(statusCounts)
  const { tasks, pagination, counts, isLoading, isFetching, isError } = useTasksPage({
    status: tab,
    search: debouncedSearch,
    assigneeType: ownerOption.assigneeType,
    assigneeId: staffFilter ?? undefined,
    page,
  })
  if (counts?.byStatus && counts.byStatus !== statusCounts) setStatusCounts(counts.byStatus)

  // Any change to what's being listed starts again from page 1.
  const changeFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  // If tasks drop out (deleted, completed) and the page we're on no longer exists, step back (state adjusted while rendering, as React recommends).
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
          <p className="text-body-lg text-on-surface-variant">All tasks for you and your team.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_TASKS_CREATE)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Task
        </button>
      </div>

      <StatusTabs value={tab} onChange={changeFilter(setTab)} counts={statusCounts} />

      <div className="flex flex-wrap items-center gap-unit-md">
        <input
          type="text"
          value={search}
          onChange={(event) => changeFilter(setSearch)(event.target.value)}
          placeholder="Search tasks..."
          className="h-10 min-w-[200px] flex-1 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        />
        <div className="flex items-center gap-2 rounded-lg border border-border-light bg-surface-container-lowest p-2 shadow-sm">
          {OWNER_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => changeFilter(setOwnerFilter)(filter.key)}
              className={`rounded px-4 py-2 text-label-md font-bold whitespace-nowrap transition-colors ${
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
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container py-2 pr-2 pl-4 text-label-md font-bold text-on-secondary-container">
            Assignee: {staffFilterName}
            <button
              type="button"
              onClick={() => {
                setSearchParams({}, { replace: true })
                setPage(1)
              }}
              aria-label="Clear assignee filter"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-on-secondary-container/15 hover:bg-on-secondary-container/25"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </span>
        )}
      </div>


      <div className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
        <TaskTable
          tasks={tasks}
          detailBase={ROUTES.ADMIN_TASK_BOARD}
          onEdit={setEditingTask}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={debouncedSearch ? 'No tasks match your search.' : `No ${STATUS_META[tab].label.toLowerCase()} tasks.`}
        />
      </div>

      <TaskPager pagination={pagination} onPageChange={setPage} />

      {editingTask && (
        <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </>
  )
}
