import TaskCard from '@/features/tasks/components/TaskCard'

export default function TaskColumn({ def, tasks, onEdit, onStatusChange }) {
  return (
    <div className="flex min-w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm lg:min-w-0 lg:shrink">
      <div
        className={`flex items-center justify-between border-b border-t-4 border-border-light p-unit-sm ${def.borderClass}`}
      >
        <h3 className="flex items-center gap-2 text-label-bold font-bold tracking-[0.03em] text-on-surface uppercase">
          <span className={`h-2 w-2 rounded-full ${def.dotClass}`} />
          {def.label}
        </h3>
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-label-md font-bold text-on-surface-variant">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-unit-sm p-unit-sm">
        {tasks.length === 0 && (
          <p className="p-unit-sm text-center text-label-md text-on-surface-variant">No tasks</p>
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  )
}
