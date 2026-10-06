import CreateTaskForm from '@/features/tasks/components/CreateTaskForm'

export default function CreateTask() {
  return (
    <>
      <div>
        <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-headline-md">
          Create New Task
        </h2>
        <p className="text-body-lg text-on-surface-variant md:text-body-md">
          Set up a new task for yourself — due date, timeline and priority.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <CreateTaskForm />
      </div>
    </>
  )
}
