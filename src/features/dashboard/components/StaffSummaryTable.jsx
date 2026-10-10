export default function StaffSummaryTable({ staff }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border-light bg-surface-subtle p-unit-md">
        <h3 className="font-[var(--font-headline)] text-headline-sm text-on-surface">Staff-wise Task Summary</h3>
        <button className="flex items-center gap-2 text-label-bold font-bold tracking-[0.05em] text-primary hover:underline">
          View All
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-light bg-surface-subtle text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
              <th className="p-unit-md py-unit-sm font-medium">Staff Member</th>
              <th className="p-unit-md py-unit-sm font-medium">Total</th>
              <th className="p-unit-md py-unit-sm font-medium">Completed</th>
              <th className="p-unit-md py-unit-sm font-medium">Pending</th>
              <th className="w-48 p-unit-md py-unit-sm font-medium">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-body-md text-on-surface">
            {staff.map((member) => {
              const progress = Math.round((member.completed / member.total) * 100)
              return (
                <tr key={member.id} className="transition-colors hover:bg-surface-subtle">
                  <td className="flex items-center gap-unit-md p-unit-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-container text-label-bold font-bold text-on-secondary-container">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </td>
                  <td className="p-unit-md">{member.total}</td>
                  <td className="p-unit-md font-medium text-status-completed">{member.completed}</td>
                  <td className="p-unit-md text-status-pending">{member.pending}</td>
                  <td className="p-unit-md">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-border-light">
                        <div
                          className={`h-2 rounded-full ${progress >= 50 ? 'bg-status-completed' : 'bg-status-pending'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-label-md text-on-surface-variant">{progress}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
