import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TaskTable from '@/features/tasks/components/TaskTable'
import ColumnFilter from '@/features/tasks/components/ColumnFilter'
import EditTaskModal from '@/features/tasks/components/EditTaskModal'
import TaskPager from '@/features/tasks/components/TaskPager'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useBoardParams } from '@/hooks/useBoardParams'
import { useTaskFacets, useTasksPage } from '@/hooks/useTasks'
import { useAuthStore } from '@/store/authStore'
import { DISPLAY_STATUS, STATUS_META, STATUS_TABS } from '@/features/tasks/utils/task.utils'

// What the board shows before anyone touches the Status filter: the work still to do.
const DEFAULT_STATUSES = [DISPLAY_STATUS.TODO, DISPLAY_STATUS.DELAYED]
// In the URL, ?status=all means "every status" (the filter cleared); no ?status means the default.
const ALL_STATUSES = 'all'
// Brokers are free text, so "no broker" needs a token that can't be a real name in a comma list.
const NO_BROKER = '~'

const splitList = (value) => (value ? value.split(',').filter(Boolean) : null)
const joinList = (list) => (list == null ? null : list.join(','))

// The task board for both roles: one compact table where every column header is a spreadsheet-style
// filter (values with counts, search, sort). All filters live in the URL, so leaving the board (to
// create or open a task) and coming back restores exactly the same view. Admins can edit tasks;
// only a task's assignee can complete it.
export default function TaskBoardView({
  title,
  subtitle,
  detailBase,
  createRoute,
  canEdit = false,
}) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [get, set] = useBoardParams()
  const [editingTask, setEditingTask] = useState(null)

  // Older links still work: ?tab=delayed (dashboard tiles) and ?staff=<id> (dashboard staff table).
  const legacyTab = STATUS_TABS.includes(get('tab')) ? [get('tab')] : null
  const legacyStaff = get('staff') ? [`staff:${get('staff')}`] : null

  const statusParam = get('status')
  const statuses =
    statusParam === ALL_STATUSES
      ? STATUS_TABS
      : (splitList(statusParam)?.filter((status) => STATUS_TABS.includes(status)) ??
        legacyTab ??
        DEFAULT_STATUSES)
  const assignees = splitList(get('to')) ?? legacyStaff
  const creators = splitList(get('by'))
  const brokers = splitList(get('broker'))
  const sort = get('sort')
  const search = get('q') ?? ''
  const page = Number(get('page')) || 1
  const debouncedSearch = useDebouncedValue(search.trim())

  const filters = {
    search: debouncedSearch || undefined,
    statuses: statuses.join(','),
    assignees: joinList(assignees) ?? undefined,
    creators: joinList(creators) ?? undefined,
    brokers: brokers
      ? brokers.map((broker) => (broker === NO_BROKER ? '' : broker)).join(',') || ','
      : undefined,
  }
  const { tasks, pagination, isLoading, isFetching, isError } = useTasksPage({
    ...filters,
    sort: sort ?? undefined,
    page,
  })
  const { data: facets, isLoading: facetsLoading } = useTaskFacets(filters)

  // If tasks drop out (deleted, completed) and the page we're on no longer exists, step back.
  const lastPage = pagination?.totalPages ?? 0
  useEffect(() => {
    if (lastPage > 0 && page > lastPage) set({ page: lastPage })
  }, [lastPage, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const isMe = (id) => String(id) === String(user?.id)
  const personOptions = (list = []) =>
    list.map((person) => ({
      value: person.value,
      label: `${person.name ?? 'Unknown'}${isMe(person.id) ? ' (you)' : ''}`,
      count: person.count,
    }))

  const options = useMemo(
    () => ({
      status: STATUS_TABS.map((status) => ({
        value: status,
        label: STATUS_META[status].label,
        swatch: STATUS_META[status].dotClass,
        count: facets?.status.find((entry) => entry.value === status)?.count ?? 0,
      })),
      broker: (facets?.broker ?? []).map((entry) => ({
        value: entry.value || NO_BROKER,
        label: entry.value || '(No broker)',
        count: entry.count,
      })),
    }),
    [facets],
  )

  const sortProps = (asc, desc) => ({
    asc,
    desc,
    current: sort,
    onChange: (value) => set({ sort: value }),
  })

  // Clearing the status filter means "every status"; the other columns just drop their parameter.
  const setStatuses = (value) => set({ status: value ? value.join(',') : ALL_STATUSES, tab: null })
  const setList = (key) => (value) =>
    set({ [key]: joinList(value), ...(key === 'to' ? { staff: null } : {}) })

  const renderHeader = (key, label) => {
    switch (key) {
      case 'task':
        return <ColumnFilter label={label} sort={sortProps('title_asc', 'title_desc')} />
      case 'status':
        return (
          <ColumnFilter
            label={label}
            options={options.status}
            selected={statuses.length === STATUS_TABS.length ? null : statuses}
            onApply={setStatuses}
            isLoading={facetsLoading}
          />
        )
      case 'broker':
        return (
          <ColumnFilter
            label={label}
            options={options.broker}
            selected={brokers}
            onApply={setList('broker')}
            sort={sortProps('broker_asc', 'broker_desc')}
            isLoading={facetsLoading}
          />
        )
      case 'due':
        return <ColumnFilter label={label} sort={sortProps('due_asc', 'due_desc')} />
      case 'by':
        return (
          <ColumnFilter
            label={label}
            options={personOptions(facets?.creator)}
            selected={creators}
            onApply={setList('by')}
            isLoading={facetsLoading}
            align="right"
          />
        )
      case 'to':
        return (
          <ColumnFilter
            label={label}
            options={personOptions(facets?.assignee)}
            selected={assignees}
            onApply={setList('to')}
            isLoading={facetsLoading}
            align="right"
          />
        )
      default:
        return label
    }
  }

  const hasCustomView = ['status', 'tab', 'to', 'staff', 'by', 'broker', 'sort', 'q'].some(
    (key) => get(key) != null,
  )
  const statusSummary =
    statuses.length === STATUS_TABS.length
      ? 'all statuses'
      : statuses.map((status) => STATUS_META[status].label).join(', ')

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            {title}
          </h2>
          <p className="text-body-lg text-on-surface-variant">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(createRoute)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Task
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-unit-md">
        <input
          type="search"
          value={search}
          onChange={(event) => set({ q: event.target.value })}
          placeholder="Search task or broker…"
          className="h-10 min-w-[200px] flex-1 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
        />
        <p className="text-[14px] text-on-surface-variant">
          <span className="font-bold text-on-surface tabular-nums">{pagination?.total ?? '–'}</span>{' '}
          tasks · {statusSummary}
          {(assignees || creators || brokers) && ' · filtered'}
        </p>
        {hasCustomView && (
          <button
            type="button"
            onClick={() =>
              set({
                status: null,
                tab: null,
                to: null,
                staff: null,
                by: null,
                broker: null,
                sort: null,
                q: null,
              })
            }
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-bold text-primary hover:bg-surface-subtle"
          >
            <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
            Reset view
          </button>
        )}
      </div>

      <div
        className={
          isFetching && !isLoading ? 'opacity-70 transition-opacity' : 'transition-opacity'
        }
      >
        <TaskTable
          tasks={tasks}
          detailBase={detailBase}
          currentUserId={user?.id}
          onEdit={canEdit ? setEditingTask : undefined}
          renderHeader={renderHeader}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={
            hasCustomView ? 'No tasks match these filters.' : 'Nothing to do. No open tasks.'
          }
        />
      </div>

      <TaskPager pagination={pagination} onPageChange={(value) => set({ page: value })} />

      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </>
  )
}
