import {
  formatDay,
  formatTimeRange,
  fromDateKey,
  isMeetingOverdue,
} from '@/features/schedule/utils/meeting.utils'

// The few dated meetings coming up soonest, as cards with a calendar-leaf date. Hovering a card reveals
// its done tick; clicking anywhere else opens it.
export default function UpNextCards({ meetings, onOpen, onToggleDone }) {
  if (meetings.length === 0) return null

  return (
    <section>
      <h3 className="mb-unit-sm flex items-center gap-2 text-[12px] font-extrabold tracking-[0.06em] text-on-surface-variant uppercase">
        <span className="material-symbols-outlined text-[18px] text-primary">bolt</span>
        Up next
      </h3>
      <div className="grid grid-cols-1 gap-unit-md sm:grid-cols-2 xl:grid-cols-4">
        {meetings.map((meeting) => {
          const date = fromDateKey(meeting.date)
          const overdue = isMeetingOverdue(meeting)
          const isToday = formatDay(meeting.date) === 'Today'
          return (
            <article
              key={meeting.id}
              onClick={() => onOpen(meeting)}
              className="group relative flex cursor-pointer gap-3 overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-container/50 hover:shadow-md"
            >
              <div
                className={`flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-lg border ${
                  overdue
                    ? 'border-status-delayed/40'
                    : isToday
                      ? 'border-primary-container/50'
                      : 'border-border-light'
                }`}
              >
                <span
                  className={`w-full py-0.5 text-center text-[10px] font-extrabold tracking-wider text-white uppercase ${
                    overdue
                      ? 'bg-status-delayed'
                      : isToday
                        ? 'bg-primary-container'
                        : 'bg-status-scheduled'
                  }`}
                >
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="pt-0.5 font-[var(--font-headline)] text-[22px] leading-tight font-bold text-on-surface">
                  {date.getDate()}
                </span>
                <span className="pb-1 text-[10px] font-semibold text-on-surface-variant uppercase">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>

              <div className="min-w-0 flex-1 pr-7">
                <p
                  className="truncate font-bold text-on-surface group-hover:text-primary"
                  title={meeting.title}
                >
                  {meeting.title}
                </p>
                <p
                  className={`mt-0.5 flex items-center gap-1 text-[13px] ${
                    overdue ? 'font-semibold text-status-delayed' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  {formatDay(meeting.date)}
                  {meeting.startTime ? ` · ${formatTimeRange(meeting)}` : ' · any time'}
                </p>
                {(meeting.attendees || meeting.location) && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[15px]">
                      {meeting.attendees ? 'group' : 'location_on'}
                    </span>
                    <span className="truncate">{meeting.attendees || meeting.location}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleDone(meeting)
                }}
                title="Mark as done"
                aria-label={`Mark “${meeting.title}” as done`}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-status-completed opacity-0 transition-opacity group-hover:opacity-100 hover:bg-status-completed/10 focus:opacity-100"
              >
                <span className="material-symbols-outlined text-[24px]">task_alt</span>
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
