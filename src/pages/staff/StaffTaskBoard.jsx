import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StaffTaskTable from '@/features/tasks/components/StaffTaskTable'
import { useSyncedTasks } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'
import { STATUS_META, getDisplayStatus, isAssignedTo } from '@/features/tasks/utils/task.utils'
import { ROUTES } from '@/constants/routes'

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'All Statuses' },
  ...Object.entries(STATUS_META).map(([key, meta]) => ({ key, label: meta.label })),
]

export default function StaffTaskBoard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const { tasks: allTasks, isLoading, isError } = useSyncedTasks()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const myTasks = useMemo(() => allTasks.filter((task) => isAssignedTo(task, user?.id)), [allTasks, user?.id])

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return myTasks.filter((task) => {
      if (query && !task.title.toLowerCase().includes(query)) return false
      if (statusFilter !== 'all' && getDisplayStatus(task) !== statusFilter) return false
      return true
    })
  }, [myTasks, search, statusFilter])

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

      <div className="flex flex-wrap items-center gap-unit-md">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your tasks by title..."
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
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

      <StaffTaskTable tasks={filteredTasks} isLoading={isLoading} isError={isError} />

      <p className="text-label-md text-on-surface-variant">
        Showing {filteredTasks.length} of {myTasks.length} tasks
      </p>
    </>
  )
}
