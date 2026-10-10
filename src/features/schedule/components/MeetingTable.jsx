import {
  formatDay,
  formatTimeRange,
  isMeetingOverdue,
} from '@/features/schedule/utils/meeting.utils'

const COLUMNS = [
  { key: 'done', label: <span className="sr-only">Done</span>, className: 'w-12' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'with', label: 'With', className: 'w-44' },
  { key: 'where', label: 'Where', className: 'w-44' },
  { key: 'when', label: 'When', className: 'w-44' },
  { key: 'actions', label: <span className="sr-only">Actions</span>, className: 'w-20' },
]

const iconButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant/70 transition-colors hover:bg-surface-container hover:text-primary'

const isLink = (value) => /^https?:\/\//i.test(value)

// The tick that marks a meeting done (or reopens it on the Done list). It's a faint circle until the row
// is hovered, then it turns green and shows the check, so finishing a meeting is one click from the list.
function DoneToggle({ meeting, onToggle }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onToggle(meeting)
      }}
      title={meeting.done ? 'Reopen meeting' : 'Mark as done'}
      aria-label={meeting.done ? `Reopen “${meeting.title}”` : `Mark “${meeting.title}” as done`}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        meeting.done
          ? 'text-status-completed hover:bg-surface-container hover:text-on-surface-variant'
          : 'text-outline-variant group-hover:text-status-completed hover:bg-status-completed/10'
      }`}
    >
      {meeting.done ? (
        <span className="material-symbols-outlined text-[24px]">check_circle</span>
      ) : (
        <>
          <span className="material-symbols-outlined text-[24px] group-hover:hidden">
            radio_button_unchecked
          </span>
          <span className="material-symbols-outlined hidden text-[24px] group-hover:inline">
            task_alt
          </span>
        </>
      )}
    </button>
  )
}

function WhenCell({ meeting }) {
  if (!meeting.date) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-status-pending/10 px-2.5 py-1 text-[12px] font-semibold text-status-pending">
        <span className="material-symbols-outlined text-[14px]">all_inclusive</span>
        Anytime
      </span>
    )
  }
  const overdue = isMeetingOverdue(meeting)
  const time = formatTimeRange(meeting)
  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${
        overdue ? 'font-semibold text-status-delayed' : ''
      }`}
    >
      {overdue && <span className="material-symbols-outlined text-[16px]">schedule</span>}
      <span className="font-semibold">{formatDay(meeting.date)}</span>
      <span className={overdue ? '' : 'text-on-surface-variant'}>{time || '· any time'}</span>
    </span>
  )
}

// Compact meeting list, styled like the task board's table. `groups` is [{ key, label, icon, tone,
// meetings }]; each group gets a thin header row. Clicking a row opens it (the edit modal is the detail
// view); the tick and the actions don't.
export default function MeetingTable({
  groups,
  onOpen,
  onToggleDone,
  isLoading = false,
  isError = false,
  emptyMessage,
}) {
  const total = groups.reduce((sum, group) => sum + group.meetings.length, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-y border-border-light bg-surface-container text-[12px] font-extrabold tracking-[0.06em] text-on-surface uppercase">
            {COLUMNS.map((column) => (
              <th key={column.key} className={`px-3 py-3 font-extrabold ${column.className ?? ''}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-on-surface">
          {isLoading &&
            Array.from({ length: 5 }, (_, index) => (
              <tr key={index} aria-hidden="true" className="border-b border-border-light">
                {COLUMNS.map((column) => (
                  <td key={column.key} className="px-3 py-3.5">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-container" />
                  </td>
                ))}
              </tr>
            ))}
          {isError && !isLoading && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-12 text-center text-error">
                Couldn't load meetings. Please refresh the page.
              </td>
            </tr>
          )}
          {!isLoading &&
            !isError &&
            groups.map((group) => (
              <GroupRows
                key={group.key}
                group={group}
                showHeader={groups.length > 1 || group.key !== 'done'}
                onOpen={onOpen}
                onToggleDone={onToggleDone}
              />
            ))}
          {!isLoading && !isError && total === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-12 text-center">
                <span className="material-symbols-outlined mb-2 block text-[36px] text-outline-variant">
                  event_available
                </span>
                <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function GroupRows({ group, showHeader, onOpen, onToggleDone }) {
  return (
    <>
      {showHeader && (
        <tr className="border-b border-border-light bg-surface-subtle/50">
          <td colSpan={COLUMNS.length} className="px-3 py-1.5">
            <span
              className={`inline-flex items-center gap-1.5 text-[12px] font-extrabold tracking-[0.06em] uppercase ${group.tone}`}
            >
              <span className="material-symbols-outlined text-[16px]">{group.icon}</span>
              {group.label}
              <span className="rounded-full bg-surface-container px-1.5 text-[11px] text-on-surface tabular-nums">
                {group.meetings.length}
              </span>
            </span>
          </td>
        </tr>
      )}
      {group.meetings.map((meeting) => {
        const overdue = isMeetingOverdue(meeting)
        return (
          <tr
            key={meeting.id}
            onClick={() => onOpen(meeting)}
            className={`group cursor-pointer border-b border-border-light transition-colors hover:bg-surface-subtle ${
              overdue ? 'shadow-[inset_3px_0_0_var(--color-status-delayed)]' : ''
            }`}
          >
            <td className="relative px-2 py-2">
              <div className="flex justify-center">
                <DoneToggle meeting={meeting} onToggle={onToggleDone} />
              </div>
            </td>
            <td className="px-3 py-2.5">
              <p
                title={meeting.title}
                className={`truncate font-semibold group-hover:text-primary ${
                  meeting.done ? 'text-on-surface-variant line-through decoration-1' : ''
                }`}
              >
                {meeting.title}
              </p>
              {meeting.notes && (
                <p className="truncate text-[12px] text-on-surface-variant" title={meeting.notes}>
                  {meeting.notes}
                </p>
              )}
            </td>
            <td className="truncate px-3 py-2.5 text-on-surface-variant" title={meeting.attendees}>
              {meeting.attendees || '—'}
            </td>
            <td className="truncate px-3 py-2.5 text-on-surface-variant" title={meeting.location}>
              {meeting.location && isLink(meeting.location) ? (
                <a
                  href={meeting.location}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  Join link
                </a>
              ) : (
                meeting.location || '—'
              )}
            </td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              <WhenCell meeting={meeting} />
            </td>
            <td className="px-3 py-2.5">
              <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpen(meeting)
                  }}
                  title="Open / edit"
                  className={iconButtonClass}
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>
            </td>
          </tr>
        )
      })}
    </>
  )
}
