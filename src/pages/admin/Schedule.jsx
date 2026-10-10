import { useEffect, useMemo, useState } from 'react'
import MeetingTable from '@/features/schedule/components/MeetingTable'
import MeetingFormModal from '@/features/schedule/components/MeetingFormModal'
import UpNextCards from '@/features/schedule/components/UpNextCards'
import { useCreateMeeting, useMeetings, useSetMeetingDone } from '@/hooks/useMeetings'
import {
  GROUPS,
  groupMeetings,
  isMeetingOverdue,
  matchesSearch,
} from '@/features/schedule/utils/meeting.utils'

const UP_NEXT_LIMIT = 4

// Meetings, not a calendar: most meetings here have no fixed slot, so the page is a compact list grouped
// by how soon they are (Slipped, Today, Next 7 days, Later, Anytime), with the next few dated ones as
// cards on top. A meeting is captured in one line from the quick-add bar and ticked off from its row.
export default function Schedule() {
  const [tab, setTab] = useState('open')
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)

  const { data, isLoading, isError } = useMeetings(tab)
  const createMeeting = useCreateMeeting()
  const setDone = useSetMeetingDone()

  const meetings = useMemo(() => data?.data?.meetings ?? [], [data])
  const counts = data?.counts ?? { open: 0, done: 0 }

  const openGroups = useMemo(() => (tab === 'open' ? groupMeetings(meetings) : []), [tab, meetings])
  const upNext = useMemo(
    () =>
      openGroups
        .filter((group) => ['today', 'week', 'later'].includes(group.key))
        .flatMap((group) => group.meetings)
        .filter((meeting) => !isMeetingOverdue(meeting))
        .slice(0, UP_NEXT_LIMIT),
    [openGroups],
  )

  const query = search.trim()
  const visibleGroups =
    tab === 'open'
      ? openGroups
          .filter((group) => !groupFilter || group.key === groupFilter)
          .map((group) => ({
            ...group,
            meetings: group.meetings.filter((m) => matchesSearch(m, query)),
          }))
          .filter((group) => group.meetings.length > 0)
      : [
          {
            key: 'done',
            label: 'Done',
            icon: 'task_alt',
            tone: 'text-status-completed',
            meetings: meetings.filter((m) => matchesSearch(m, query)),
          },
        ]

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleToggleDone = (meeting) => {
    const done = !meeting.done
    setDone.mutate(
      { meetingId: meeting.id, done },
      {
        onError: () => setToast({ message: 'Could not update the meeting.', tone: 'error' }),
      },
    )
    setToast({
      message: done ? `Done: ${meeting.title}` : `Reopened: ${meeting.title}`,
      undo: () => setDone.mutate({ meetingId: meeting.id, done: !done }),
    })
  }

  // Enter saves straight away as an undated meeting; the button opens the full form with the title kept.
  const handleQuickAdd = async (event) => {
    event.preventDefault()
    const title = quickTitle.trim()
    if (!title) return
    try {
      await createMeeting.mutateAsync({ title })
      setQuickTitle('')
      setTab('open')
      setToast({ message: 'Added to Anytime' })
    } catch (err) {
      setToast({
        message: err?.response?.data?.message ?? 'Could not add the meeting.',
        tone: 'error',
      })
    }
  }

  const groupCount = (key) => openGroups.find((group) => group.key === key)?.meetings.length ?? 0

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Meetings
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            Everything you need to meet about, dated or not.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({})}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Meeting
        </button>
      </div>

      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-border-light bg-surface-container-lowest p-2 pl-4 transition-colors focus-within:border-primary-container focus-within:border-solid"
      >
        <span className="material-symbols-outlined text-primary">add_task</span>
        <input
          type="text"
          value={quickTitle}
          onChange={(event) => setQuickTitle(event.target.value)}
          placeholder="Jot down a meeting and press Enter, e.g. “Discuss renewal with Mehta & Co.”"
          aria-label="Quick add meeting"
          className="h-10 min-w-0 flex-1 border-0 bg-transparent text-body-md text-on-surface placeholder-outline focus:ring-0 focus:outline-none"
        />
        {quickTitle.trim() && (
          <button
            type="button"
            onClick={() => {
              setModal({ initial: { title: quickTitle.trim(), when: 'datetime' } })
              setQuickTitle('')
            }}
            className="hidden items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-bold text-on-surface-variant hover:bg-surface-subtle sm:flex"
          >
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            Set time
          </button>
        )}
        <button
          type="submit"
          disabled={!quickTitle.trim() || createMeeting.isPending}
          className="rounded-lg bg-primary-container px-4 py-2 text-[13px] font-bold text-on-primary transition-colors hover:bg-primary disabled:opacity-40"
        >
          Add
        </button>
      </form>

      {tab === 'open' && !query && !groupFilter && (
        <UpNextCards
          meetings={upNext}
          onOpen={(meeting) => setModal({ meeting })}
          onToggleDone={handleToggleDone}
        />
      )}

      <section className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex rounded-lg bg-surface-subtle p-1" role="tablist">
            {[
              { value: 'open', label: 'Open', count: counts.open },
              { value: 'done', label: 'Done', count: counts.done },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={tab === option.value}
                onClick={() => {
                  setTab(option.value)
                  setGroupFilter(null)
                }}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-bold transition-colors ${
                  tab === option.value
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {option.label}
                <span className="rounded-full bg-surface-container px-2 text-[11px] tabular-nums">
                  {option.count}
                </span>
              </button>
            ))}
          </div>

          {tab === 'open' && (
            <div className="flex flex-wrap gap-1.5">
              {GROUPS.filter((group) => groupCount(group.key) > 0).map((group) => {
                const active = groupFilter === group.key
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setGroupFilter(active ? null : group.key)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-bold transition-colors ${
                      active
                        ? 'border-primary-container bg-primary-container/10 text-primary'
                        : 'border-border-light text-on-surface-variant hover:bg-surface-subtle'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[15px] ${active ? '' : group.tone}`}
                    >
                      {group.icon}
                    </span>
                    {group.label}
                    <span className="tabular-nums">{groupCount(group.key)}</span>
                  </button>
                )
              })}
            </div>
          )}

          <label className="relative ml-auto min-w-[200px] flex-1 md:max-w-xs">
            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search meetings…"
              className="h-10 w-full rounded-lg border border-border-light bg-surface-subtle/50 pr-3 pl-10 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 focus:outline-none"
            />
          </label>
        </div>

        <MeetingTable
          groups={visibleGroups}
          onOpen={(meeting) => setModal({ meeting })}
          onToggleDone={handleToggleDone}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={
            query || groupFilter
              ? 'No meetings match.'
              : tab === 'open'
                ? 'No meetings lined up. Jot one down above.'
                : 'Nothing ticked off yet.'
          }
        />
      </section>

      {modal && (
        <MeetingFormModal
          meeting={modal.meeting}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={(message) => setToast({ message })}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-on-surface px-4 py-2.5 text-surface-container-lowest shadow-xl"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              toast.tone === 'error' ? 'text-error-container' : 'text-primary-fixed-dim'
            }`}
          >
            {toast.tone === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="max-w-[60vw] truncate text-[14px] font-semibold">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo()
                setToast(null)
              }}
              className="rounded px-2 py-1 text-[13px] font-extrabold text-primary-fixed-dim uppercase hover:bg-white/10"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </>
  )
}
