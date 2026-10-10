export default function StatusChip({ status }) {
  const isActive = status === 'active'

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-label-bold font-bold ${
        isActive ? 'bg-status-completed/10 text-status-completed' : 'bg-secondary/10 text-secondary'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-status-completed' : 'bg-secondary'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
