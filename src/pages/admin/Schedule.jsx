import { useMemo, useState } from 'react'
import MonthGrid from '@/features/schedule/components/MonthGrid'
import WeekView from '@/features/schedule/components/WeekView'
import DayView from '@/features/schedule/components/DayView'
import UpcomingPanel from '@/features/schedule/components/UpcomingPanel'
import AddMeetingModal from '@/features/schedule/components/AddMeetingModal'
import { INITIAL_EVENTS } from '@/features/schedule/data/schedule.data'
import {
  addDays,
  addMonths,
  formatFullDate,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMonthMatrix,
  getWeekDates,
  toDateKey,
} from '@/features/schedule/utils/calendar.utils'

const VIEW_OPTIONS = ['month', 'week', 'day']
const today = new Date()

export default function Schedule() {
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(today)
  const [events, setEvents] = useState(INITIAL_EVENTS)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.date] = acc[event.date] ? [...acc[event.date], event] : [event]
      return acc
    }, {})
  }, [events])

  const upcomingMeetings = useMemo(
    () =>
      events
        .filter((event) => event.type === 'meeting')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  )
  const upcomingDeadlines = useMemo(
    () =>
      events
        .filter((event) => event.type === 'deadline')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  )

  const weeks = useMemo(() => getMonthMatrix(currentDate), [currentDate])
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate])

  const label = useMemo(() => {
    if (view === 'month') return formatMonthLabel(currentDate)
    if (view === 'week') return formatWeekRangeLabel(weekDates)
    return formatFullDate(currentDate)
  }, [view, currentDate, weekDates])

  const handlePrev = () => {
    if (view === 'month') setCurrentDate((date) => addMonths(date, -1))
    else if (view === 'week') setCurrentDate((date) => addDays(date, -7))
    else setCurrentDate((date) => addDays(date, -1))
  }

  const handleNext = () => {
    if (view === 'month') setCurrentDate((date) => addMonths(date, 1))
    else if (view === 'week') setCurrentDate((date) => addDays(date, 7))
    else setCurrentDate((date) => addDays(date, 1))
  }

  const handleToday = () => setCurrentDate(new Date())

  const handleSelectDate = (date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleAddMeeting = (values) => {
    setEvents((prev) => [...prev, { id: `evt-${Date.now()}`, ...values }])
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Schedule &amp; Meetings
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-unit-sm">
          <div className="flex items-center overflow-hidden rounded-lg border border-border-light bg-surface-container-lowest p-2 shadow-sm">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={`rounded px-4 py-2 text-label-bold font-bold capitalize transition-colors ${
                  view === option
                    ? 'bg-surface-container text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-subtle'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Add Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-margin-desktop lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border-light bg-surface-subtle p-unit-md">
            <div className="flex items-center gap-unit-sm">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous"
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <h3 className="w-40 text-center font-[var(--font-headline)] text-headline-sm text-on-surface sm:w-56">
                {label}
              </h3>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next"
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleToday}
              className="text-label-bold font-bold text-primary hover:underline"
            >
              Today
            </button>
          </div>

          {view === 'month' && (
            <MonthGrid
              weeks={weeks}
              monthDate={currentDate}
              today={today}
              selectedDate={currentDate}
              eventsByDate={eventsByDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === 'week' && (
            <WeekView
              weekDates={weekDates}
              today={today}
              eventsByDate={eventsByDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === 'day' && <DayView date={currentDate} eventsByDate={eventsByDate} />}
        </div>

        <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
          <UpcomingPanel meetings={upcomingMeetings} deadlines={upcomingDeadlines} />
        </div>
      </div>

      {isAddModalOpen && (
        <AddMeetingModal
          defaultDate={toDateKey(currentDate)}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddMeeting}
        />
      )}
    </>
  )
}
