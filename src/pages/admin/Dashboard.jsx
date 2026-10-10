import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RecipientStack, StatusPill } from '@/features/broadcast/components/NoticeTable'
import { formatNoticeDate } from '@/features/broadcast/utils/broadcast.utils'
import { useNoticesList } from '@/hooks/useNotices'
import { useSyncedTasks } from '@/hooks/useTasks'
import { avatarColorFor, initialsOf, isAdminAssignee, isTaskOverdue } from '@/features/tasks/utils/task.utils'
import { EmptyRow, PanelHeader } from '@/features/dashboard/components/DashboardPanel'
import PrivateNotesPanel from '@/features/dashboard/components/PrivateNotesPanel'
import { ROUTES } from '@/constants/routes'

const LIST_LIMIT = 3

export default function Dashboard() {
  const { tasks, isLoading, isError } = useSyncedTasks()
  const { data: noticesData, isLoading: noticesLoading, isError: noticesError } = useNoticesList({
    page: 1,
    limit: LIST_LIMIT,
  })

  const staffSummary = useMemo(() => {
    const byStaff = new Map()
    tasks
      .filter((task) => !isAdminAssignee(task))
      .forEach((task) => {
        const staffId = task.assignee?.id
        const row = byStaff.get(staffId) ?? { id: staffId, name: task.assignee?.name ?? staffId, total: 0, done: 0, delayed: 0 }
        row.total += 1
        if (task.status === 'completed') row.done += 1
        if (isTaskOverdue(task)) row.delayed += 1
        byStaff.set(staffId, row)
      })
    return Array.from(byStaff.values())
      .map((row) => ({
        ...row,
        pending: row.total - row.done,
        percent: Math.round((row.done / row.total) * 100),
      }))
      .sort((a, b) => b.delayed - a.delayed || b.total - a.total)
  }, [tasks])

  // The API already sorts newest-first and this only ever fetches LIST_LIMIT
  // notices, so no client-side sorting/slicing is needed.
  const latestNotices = noticesData?.data ?? []

  return (
    <>
      <div>
        <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
          Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-1 items-start gap-margin-desktop lg:grid-cols-5">
        <section className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between gap-unit-sm border-b border-border-light px-unit-lg py-unit-md">
            <h3 className="flex items-center gap-2 font-[var(--font-headline)] text-headline-sm text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
              Staff-wise Task Summary
            </h3>
            <span className="hidden text-label-md text-on-surface-variant sm:block">Most delayed first</span>
          </div>

          {isLoading ? (
            <EmptyRow>Loading tasks…</EmptyRow>
          ) : isError ? (
            <EmptyRow>Couldn't load tasks. Please refresh the page.</EmptyRow>
          ) : staffSummary.length === 0 ? (
            <EmptyRow>No tasks have been assigned to staff yet.</EmptyRow>
          ) : (
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-border-light bg-surface-subtle text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
                  <th className="py-unit-sm pr-2 pl-unit-lg font-medium">Staff</th>
                  <th className="w-14 px-2 py-unit-sm font-medium">Total</th>
                  <th className="hidden w-14 px-2 py-unit-sm font-medium sm:table-cell">Done</th>
                  <th className="hidden w-[72px] px-2 py-unit-sm font-medium sm:table-cell">Pending</th>
                  <th className="w-[72px] px-2 py-unit-sm font-medium">Delayed</th>
                  <th className="w-20 py-unit-sm pr-unit-lg pl-2 text-right font-medium whitespace-nowrap">Done %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light text-body-md text-on-surface tabular-nums">
                {staffSummary.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-surface-subtle">
                    <td className="py-unit-md pr-2 pl-unit-lg">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-on-primary sm:flex"
                          style={{ backgroundColor: avatarColorFor(row.id) }}
                        >
                          {initialsOf(row.name)}
                        </span>
                        <Link
                          to={`${ROUTES.ADMIN_TASK_BOARD}?staff=${encodeURIComponent(row.id)}`}
                          title={`View ${row.name}'s tasks`}
                          className="truncate font-bold text-on-surface hover:text-primary hover:underline"
                        >
                          {row.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-2">{row.total}</td>
                    <td className={`hidden px-2 sm:table-cell ${row.done ? 'font-bold text-status-completed' : 'text-on-surface-variant/60'}`}>
                      {row.done}
                    </td>
                    <td className={`hidden px-2 sm:table-cell ${row.pending ? 'font-bold text-status-pending' : 'text-on-surface-variant/60'}`}>
                      {row.pending}
                    </td>
                    <td className={`px-2 ${row.delayed ? 'font-bold text-status-delayed' : 'text-on-surface-variant/60'}`}>
                      {row.delayed}
                    </td>
                    <td
                      className={`pr-unit-lg pl-2 text-right font-bold ${
                        row.percent >= 50 ? 'text-status-completed' : 'text-status-pending'
                      }`}
                    >
                      {row.percent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex items-center gap-2 border-t border-border-light bg-surface-subtle px-unit-lg py-unit-sm text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            Click a name to see only that person's tasks on the Task Board.
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-margin-desktop lg:col-span-2">
          <PrivateNotesPanel />

          <section className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
            <PanelHeader icon="campaign" title="Broadcast / Notice" to={ROUTES.ADMIN_BROADCAST} />
            {noticesLoading ? (
              <EmptyRow>Loading notices…</EmptyRow>
            ) : noticesError ? (
              <EmptyRow>Couldn't load notices. Please refresh the page.</EmptyRow>
            ) : latestNotices.length === 0 ? (
              <EmptyRow>No notices sent yet.</EmptyRow>
            ) : null}
            {!noticesLoading &&
              !noticesError &&
              latestNotices.map((notice) => (
              <Link
                key={notice.id}
                to={ROUTES.ADMIN_BROADCAST}
                className={`flex gap-4 border-b border-border-light px-unit-lg py-unit-md transition-colors last:border-b-0 hover:bg-surface-subtle ${
                  notice.status === 'inactive' ? 'opacity-60' : ''
                }`}
              >
                <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] bg-status-scheduled/10 text-status-scheduled">
                  <span className="material-symbols-outlined text-[16px]">campaign</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-body-md font-bold text-on-surface">{notice.title}</span>
                    <StatusPill status={notice.status} />
                  </span>
                  {notice.message && (
                    <span className="block truncate text-label-md text-on-surface-variant">{notice.message}</span>
                  )}
                  <span className="mt-2 flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant">
                    <RecipientStack recipients={notice.recipients} />
                    {notice.recipients.length} staff · {formatNoticeDate(notice.createdAt)}
                  </span>
                </span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}
