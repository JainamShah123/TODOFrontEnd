import { isSameDay, toDateKey } from '@/features/schedule/utils/calendar.utils'

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const eventDotClass = (type) => (type === 'deadline' ? 'bg-status-pending' : 'bg-status-scheduled')

const eventPillClass = (type) =>
  type === 'deadline'
    ? 'bg-status-pending/10 border-status-pending text-status-pending'
    : 'bg-status-scheduled/10 border-status-scheduled text-status-scheduled'

export default function MonthGrid({ weeks, monthDate, today, selectedDate, eventsByDate, onSelectDate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-border-light bg-surface-subtle">
        {WEEKDAY_HEADERS.map((label) => (
          <div
            key={label}
            className="p-unit-sm text-center text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 gap-px bg-border-light">
        {weeks.map((week) =>
          week.map((date) => {
            const isCurrentMonth = date.getMonth() === monthDate.getMonth()
            const isToday = isSameDay(date, today)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const dayEvents = eventsByDate[toDateKey(date)] ?? []

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`flex min-h-[72px] flex-col items-start gap-2 bg-surface-container-lowest p-2 text-left transition-colors sm:min-h-[104px] sm:p-2 ${
                  isCurrentMonth ? '' : 'opacity-40'
                } ${isSelected ? 'bg-secondary-container/40' : 'hover:bg-surface-subtle'}`}
              >
                {isToday ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-label-bold font-bold text-on-primary">
                    {date.getDate()}
                  </span>
                ) : (
                  <span className="text-label-md text-on-surface">{date.getDate()}</span>
                )}

                <div className="hidden w-full flex-col gap-2 sm:flex">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`truncate rounded-r border-l-2 px-2 py-0.5 text-[16px] font-bold ${eventPillClass(event.type)}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[16px] font-bold text-on-surface-variant">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>

                {dayEvents.length > 0 && (
                  <div className="mt-auto flex gap-2 sm:hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span key={event.id} className={`h-2 w-2 rounded-full ${eventDotClass(event.type)}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
