import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TaskTable from '@/features/tasks/components/TaskTable'
import TaskPager from '@/features/tasks/components/TaskPager'
import StatusTabs from '@/features/tasks/components/StatusTabs'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useStatusTab } from '@/hooks/useStatusTab'
import { useTasksPage } from '@/hooks/useTasks'
import { STATUS_META } from '@/features/tasks/utils/task.utils'
import { ROUTES } from '@/constants/routes'

export default function StaffTaskBoard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim())

  // The default tab depends on the counts, but the counts come back with the list the tab requests, so
  // the last counts seen are kept here (state adjusted while rendering, as React recommends).
  const [statusCounts, setStatusCounts] = useState(null)
  const [tab, setTab] = useStatusTab(statusCounts)
  // The API only ever returns the signed-in staff member's own tasks.
  const { tasks, pagination, counts, isLoading, isFetching, isError } = useTasksPage({
    status: tab,
    search: debouncedSearch,
    page,
  })
  if (counts?.byStatus && counts.byStatus !== statusCounts) setStatusCounts(counts.byStatus)

  // Any change to what's being listed starts again from page 1.
  const changeFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  // If tasks drop out (completed) and the page we're on no longer exists, step back (state adjusted while rendering, as React recommends).
  if (pagination && pagination.totalPages > 0 && page > pagination.totalPages) setPage(pagination.totalPages)

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            My Tasks
          </h2>
          <p className="text-body-lg text-on-surface-variant">Press Complete when a task is done.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.STAFF_TASKS_CREATE)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Task
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-unit-md">
        <StatusTabs value={tab} onChange={changeFilter(setTab)} counts={statusCounts} />
        <input
          type="search"
          value={search}
          onChange={(event) => changeFilter(setSearch)(event.target.value)}
          placeholder="Search tasks..."
          className="h-10 min-w-[200px] flex-1 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none md:max-w-xs"
        />
      </div>

      <div className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
        <TaskTable
          tasks={tasks}
          detailBase={ROUTES.STAFF_TASK_BOARD}
          showAssignee={false}
          canComplete={() => true}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={debouncedSearch ? 'No tasks match your search.' : `No ${STATUS_META[tab].label.toLowerCase()} tasks.`}
        />
      </div>

      <TaskPager pagination={pagination} onPageChange={setPage} />
    </>
  )
}
