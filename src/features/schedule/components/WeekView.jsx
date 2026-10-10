import { formatWeekdayShort, isSameDay, toDateKey } from '@/features/schedule/utils/calendar.utils'

const eventPillClass = (type) =>
  type === 'deadline'
    ? 'bg-status-pending/10 border-status-pending text-status-pending'
    : 'bg-status-scheduled/10 border-status-scheduled text-status-scheduled'

export default function WeekView({ weekDates, today, eventsByDate, onSelectDate }) {
  return (
    <div className="grid grid-cols-1 gap-unit-sm p-unit-md sm:grid-cols-2 lg:grid-cols-7">
      {weekDates.map((date) => {
        const isToday = isSameDay(date, today)
        const dayEvents = eventsByDate[toDateKey(date)] ?? []

        return (
          <button
            key={date.toISOString()}
            type="button"
            onClick={() => onSelectDate(date)}
            className={`flex flex-col rounded-lg border p-unit-sm text-left transition-colors ${
              isToday
                ? 'border-primary-container bg-primary-container/5'
                : 'border-border-light bg-surface-container-lowest hover:bg-surface-subtle'
            }`}
          >
            <div className="mb-unit-sm flex items-center justify-between lg:flex-col lg:items-start lg:gap-2">
              <span className="text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
                {formatWeekdayShort(date)}
              </span>
              <span
                className={`font-[var(--font-headline)] text-headline-sm ${isToday ? 'text-primary' : 'text-on-surface'}`}
              >
                {date.getDate()}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {dayEvents.length === 0 && <p className="text-label-md text-on-surface-variant">No events</p>}
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`truncate rounded-r border-l-2 px-2 py-2 text-label-md font-bold ${eventPillClass(event.type)}`}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
