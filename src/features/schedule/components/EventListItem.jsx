export default function EventListItem({ event }) {
  const isDeadline = event.type === 'deadline'

  return (
    <div className="relative overflow-hidden rounded-lg border border-border-light bg-surface-container-lowest p-unit-md shadow-sm transition-shadow hover:shadow-md">
      <div className={`absolute inset-y-0 left-0 w-2 ${isDeadline ? 'bg-status-pending' : 'bg-status-scheduled'}`} />
      <div className="pl-2">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h4 className="text-label-bold font-bold text-on-surface">{event.title}</h4>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[16px] font-bold ${
              isDeadline ? 'bg-status-pending/10 text-status-pending' : 'bg-status-scheduled/10 text-status-scheduled'
            }`}
          >
            {isDeadline ? 'Task' : 'Meeting'}
          </span>
        </div>
        {!isDeadline && event.startTime && (
          <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {event.startTime} - {event.endTime}
          </div>
        )}
        {event.location && (
          <div className="mt-2 flex items-center gap-2 text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            {event.location}
          </div>
        )}
        {event.description && (
          <p className="mt-2 text-body-md text-on-surface-variant">{event.description}</p>
        )}
      </div>
    </div>
  )
}
