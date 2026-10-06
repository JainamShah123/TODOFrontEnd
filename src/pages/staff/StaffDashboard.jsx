import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyRow, Panel, PanelHeader } from '@/features/dashboard/components/DashboardPanel'
import PrivateNotesPanel from '@/features/dashboard/components/PrivateNotesPanel'
import { formatNoticeDate } from '@/features/broadcast/utils/broadcast.utils'
import { useNoticesList } from '@/hooks/useNotices'
import { useSyncedTasks } from '@/hooks/useTasks'
import {
  STATUS_META,
  formatShortDate,
  formatTime,
  getDisplayStatus,
  isAssignedTo,
  isTaskOverdue,
} from '@/features/tasks/utils/task.utils'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/constants/routes'

const TASK_LIMIT = 8
const NOTICE_LIMIT = 3

const taskOrder = (task) => (task.status === 'completed' ? 2 : isTaskOverdue(task) ? 0 : 1)

export default function StaffDashboard() {
  const user = useAuthStore((state) => state.user)
  const { tasks, isLoading, isError } = useSyncedTasks()
  // The server already scopes this to active notices sent to the caller, and
  // sorts newest-first, so no client-side filtering/sorting is needed here.
  const { data: noticesData, isLoading: noticesLoading, isError: noticesError } = useNoticesList({
    page: 1,
    limit: NOTICE_LIMIT,
  })
  const myNotices = noticesData?.data ?? []

  const myTasks = useMemo(
    () =>
      tasks
        .filter((task) => isAssignedTo(task, user?.id))
        .sort(
          (a, b) =>
            taskOrder(a) - taskOrder(b) || a.dueDate.localeCompare(b.dueDate) || (a.time ?? '').localeCompare(b.time ?? ''),
        ),
    [tasks, user?.id],
  )

  const pendingCount = myTasks.filter((task) => task.status !== 'completed').length
  const delayedCount = myTasks.filter((task) => isTaskOverdue(task)).length

  const firstName = user?.name?.split(' ')[0] ?? 'there'
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
          <p className="text-body-lg text-on-surface-variant">
            Welcome back, {firstName}. Here's what's on your plate today.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-border-light bg-surface-container-lowest px-4 py-2 text-label-md font-bold text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          {todayLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-margin-desktop lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader
            icon="assignment"
            title="My Tasks"
            subtitle={`${myTasks.length} total · ${pendingCount} pending · ${delayedCount} delayed`}
            to={ROUTES.STAFF_TASK_BOARD}
            linkLabel="View Task Board"
          />

          {isLoading ? (
            <EmptyRow>Loading tasks…</EmptyRow>
          ) : isError ? (
            <EmptyRow>Couldn't load tasks. Please refresh the page.</EmptyRow>
          ) : myTasks.length === 0 ? (
            <EmptyRow>No tasks are assigned to you yet.</EmptyRow>
          ) : (
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-border-light bg-surface-subtle text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
                  <th className="py-unit-sm pr-2 pl-unit-lg font-medium">Task</th>
                  <th className="hidden w-[6.5rem] px-1 py-unit-sm font-medium sm:table-cell">Due date</th>
                  <th className="hidden w-24 px-1 py-unit-sm font-medium sm:table-cell">Due time</th>
                  <th className="w-36 py-unit-sm pr-unit-lg pl-1 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light text-body-md text-on-surface">
                {myTasks.slice(0, TASK_LIMIT).map((task) => {
                  const overdue = isTaskOverdue(task)
                  const status = STATUS_META[getDisplayStatus(task)]
                  return (
                    <tr key={task.id} className="transition-colors hover:bg-surface-subtle">
                      <td className="py-unit-md pr-2 pl-unit-lg">
                        <Link
                          to={`${ROUTES.STAFF_TASK_BOARD}/${task.id}`}
                          className="block font-bold text-on-surface hover:text-primary hover:underline sm:truncate"
                        >
                          {task.title}
                        </Link>
                        <span
                          className={`block text-label-md sm:hidden ${overdue ? 'font-bold text-status-delayed' : 'text-on-surface-variant'}`}
                        >
                          {formatShortDate(task.dueDate)}
                        </span>
                      </td>
                      <td
                        className={`hidden px-1 whitespace-nowrap sm:table-cell ${overdue ? 'font-bold text-status-delayed' : 'text-on-surface-variant'}`}
                      >
                        {formatShortDate(task.dueDate)}
                      </td>
                      <td className="hidden px-1 whitespace-nowrap text-on-surface-variant sm:table-cell">
                        {formatTime(task.time) ?? '—'}
                      </td>
                      <td className="pr-unit-lg pl-1 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-md font-bold whitespace-nowrap ${status.bgClass} ${status.textClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
              <EmptyRow>You're all caught up — no notices right now.</EmptyRow>
            ) : null}
            {!noticesLoading &&
              !noticesError &&
              myNotices.map((notice) => (
              <div key={notice.id} className="flex gap-3 border-b border-border-light px-unit-lg py-unit-md last:border-b-0">
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-status-scheduled/10 text-status-scheduled">
                  <span className="material-symbols-outlined text-[17px]">campaign</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-md font-bold text-on-surface">{notice.title}</span>
                  {notice.message && (
                    <span className="block text-label-md text-on-surface-variant">{notice.message}</span>
                  )}
                  <span className="mt-1 block text-label-md text-on-surface-variant">
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
