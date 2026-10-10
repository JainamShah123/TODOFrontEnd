import { Link } from 'react-router-dom'
import { EmptyRow, Panel, PanelHeader } from '@/features/dashboard/components/DashboardPanel'
import PrivateNotesPanel from '@/features/dashboard/components/PrivateNotesPanel'
import CompleteTaskButton from '@/features/tasks/components/CompleteTaskButton'
import { formatNoticeDate } from '@/features/broadcast/utils/broadcast.utils'
import { useNoticesList } from '@/hooks/useNotices'
import { useTaskList } from '@/hooks/useTasks'
import { STATUS_META, STATUS_TABS, formatDue, formatShortDate, formatTime, getDisplayStatus, isTaskOverdue } from '@/features/tasks/utils/task.utils'
import { ROUTES } from '@/constants/routes'

const NOTICE_LIMIT = 3

// "Do now" is everything delayed plus what's still to do today. The API works out "today" (server time
// zone), so the browser's clock can't put a task on the wrong day. The delayed list is unfiltered by date,
// so its counts.byStatus are the staff member's overall numbers for the tiles.
const DELAYED_FILTERS = { status: 'delayed' }
const TODAY_FILTERS = { status: 'todo', range: 'today' }

export default function StaffDashboard() {
  const delayed = useTaskList(DELAYED_FILTERS)
  const today = useTaskList(TODAY_FILTERS)
  // The server already scopes this to active notices sent to the caller, and
  // sorts newest-first, so no client-side filtering/sorting is needed here.
  const { data: noticesData, isLoading: noticesLoading, isError: noticesError } = useNoticesList({
    page: 1,
    limit: NOTICE_LIMIT,
  })
  const myNotices = noticesData?.data ?? []

  // Both lists come back oldest-due first, so delayed ones lead.
  const doNow = [...delayed.tasks, ...today.tasks]
  const counts = delayed.counts?.byStatus
  const isLoading = delayed.isLoading || today.isLoading
  const isError = delayed.isError || today.isError

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md sm:flex-row sm:items-start">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Dashboard
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-border-light bg-surface-container-lowest px-4 py-2 text-label-md font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          {todayLabel}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-unit-md lg:grid-cols-4">
        {STATUS_TABS.map((key) => {
          const meta = STATUS_META[key]
          return (
            <Link
              key={key}
              to={`${ROUTES.STAFF_TASK_BOARD}?tab=${key}`}
              className="flex flex-col gap-2 rounded-xl border border-border-light bg-surface-container-lowest p-unit-lg shadow-sm transition-colors hover:bg-surface-subtle"
            >
              <span className={`flex items-center gap-2 text-label-md font-bold ${meta.textClass}`}>
                <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                {meta.label}
              </span>
              <span className="font-[var(--font-headline)] text-headline-md text-on-surface tabular-nums">
                {counts?.[key] ?? '–'}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-margin-desktop lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader
            icon="bolt"
            title="Do Now"
            subtitle="Delayed tasks and today's tasks"
            to={ROUTES.STAFF_TASK_BOARD}
            linkLabel="All my tasks"
          />

          {isLoading ? (
            <EmptyRow>Loading tasks…</EmptyRow>
          ) : isError ? (
            <EmptyRow>Couldn't load tasks. Please refresh the page.</EmptyRow>
          ) : doNow.length === 0 ? (
            <EmptyRow>All caught up. Nothing is delayed or due today.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border-light">
              {doNow.map((task) => {
                const status = STATUS_META[getDisplayStatus(task)]
                const overdue = isTaskOverdue(task)
                return (
                  <li key={task.id} className="flex items-center gap-unit-md px-unit-lg py-unit-md">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${status.dotClass}`} title={status.label} />
                    <span className="min-w-0 flex-1">
                      <Link
                        to={`${ROUTES.STAFF_TASK_BOARD}/${task.id}`}
                        className="block truncate text-body-md font-bold text-on-surface hover:text-primary hover:underline"
                      >
                        {task.title}
                      </Link>
                      <span
                        className={`block text-label-md ${overdue ? 'font-bold text-status-delayed' : 'text-on-surface-variant'}`}
                      >
                        {[formatShortDate(task.dueDate), formatTime(task.time)].filter(Boolean).join(', ')}
                        {overdue && ` · ${formatDue(task)}`}
                        {task.broker && <span className="font-normal text-on-surface-variant"> · {task.broker}</span>}
                      </span>
                    </span>
                    <CompleteTaskButton task={task} />
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <div className="flex min-w-0 flex-col gap-margin-desktop lg:col-span-2">
          <PrivateNotesPanel />

          <Panel>
            <PanelHeader icon="campaign" title="Broadcast / Notice" />
            {noticesLoading ? (
              <EmptyRow>Loading notices…</EmptyRow>
            ) : noticesError ? (
              <EmptyRow>Couldn't load notices. Please refresh the page.</EmptyRow>
            ) : myNotices.length === 0 ? (
              <EmptyRow>No notices.</EmptyRow>
            ) : null}
            {!noticesLoading &&
              !noticesError &&
              myNotices.map((notice) => (
              <div key={notice.id} className="flex gap-4 border-b border-border-light px-unit-lg py-unit-md last:border-b-0">
                <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] bg-status-scheduled/10 text-status-scheduled">
                  <span className="material-symbols-outlined text-[16px]">campaign</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-md font-bold text-on-surface">{notice.title}</span>
                  {notice.message && (
                    <span className="block text-label-md text-on-surface-variant">{notice.message}</span>
                  )}
                  <span className="mt-2 block text-label-md text-on-surface-variant">
                    From Admin · {formatNoticeDate(notice.createdAt)}
                  </span>
                </span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </>
  )
}
