import { useNavigate } from 'react-router-dom'
import { avatarColorFor, formatNoticeDate, initialsOf } from '@/features/broadcast/utils/broadcast.utils'
import { ROUTES } from '@/constants/routes'

export function RecipientStack({ recipients }) {
  const visible = recipients.slice(0, 3)
  const overflow = recipients.length - visible.length

  return (
    <div className="flex items-center">
      {visible.map((recipient, index) => {
        const [firstName, ...rest] = recipient.name.split(' ')
        return (
          <div
            key={recipient.id}
            title={recipient.name}
            style={{ backgroundColor: avatarColorFor(recipient.id), marginLeft: index === 0 ? 0 : '-8px' }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-surface-container-lowest text-[10px] font-bold text-on-primary"
          >
            {initialsOf(firstName, rest.join(' '))}
          </div>
        )
      })}
      {overflow > 0 && <span className="ml-2 text-label-md text-on-surface-variant">+{overflow}</span>}
    </div>
  )
}

export function StatusPill({ status }) {
  const isActive = status === 'active'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-md font-bold ${
        isActive ? 'bg-status-completed/10 text-status-completed' : 'bg-surface-container text-on-surface-variant'
      }`}
    >
      <span className="material-symbols-outlined text-[13px]">{isActive ? 'check_circle' : 'visibility_off'}</span>
      {isActive ? 'Active' : 'Deactivated'}
    </span>
  )
}

export default function NoticeTable({
  notices,
  onToggleStatus,
  togglingNoticeId = null,
  onEdit,
  onDelete,
  isLoading = false,
  isError = false,
}) {
  const navigate = useNavigate()

  const openDetail = (notice) => {
    navigate(`${ROUTES.ADMIN_BROADCAST}/${notice.id}`, { state: { notice } })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-light bg-surface-subtle text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
              <th className="p-unit-md py-unit-sm font-medium">Notice</th>
              <th className="p-unit-md py-unit-sm font-medium">Sent To</th>
              <th className="p-unit-md py-unit-sm font-medium">Date</th>
              <th className="p-unit-md py-unit-sm font-medium">Status</th>
              <th className="p-unit-md py-unit-sm text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-body-md text-on-surface">
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-unit-lg text-center text-on-surface-variant">
                  Loading notices…
                </td>
              </tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td colSpan={5} className="p-unit-lg text-center text-error">
                  Couldn't load notices. Please refresh the page.
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              notices.map((notice) => (
                <tr
                  key={notice.id}
                  onClick={() => openDetail(notice)}
                  className={`cursor-pointer transition-colors hover:bg-surface-subtle ${
                    notice.status === 'inactive' ? 'opacity-70' : ''
                  }`}
                >
                  <td className="p-unit-md">
                    <p className="font-bold text-on-surface hover:text-primary hover:underline">{notice.title}</p>
                    {notice.message && (
                      <p className="mt-0.5 max-w-xs truncate text-label-md text-on-surface-variant">{notice.message}</p>
                    )}
                  </td>
                  <td className="p-unit-md">
                    <RecipientStack recipients={notice.recipients} />
                  </td>
                  <td className="p-unit-md text-on-surface-variant">{formatNoticeDate(notice.createdAt)}</td>
                  <td className="p-unit-md">
                    <StatusPill status={notice.status} />
                  </td>
                  <td className="p-unit-md text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title={notice.status === 'active' ? 'Deactivate notice' : 'Activate notice'}
                        aria-label={notice.status === 'active' ? 'Deactivate notice' : 'Activate notice'}
                        disabled={togglingNoticeId === notice.id}
                        onClick={(event) => {
                          event.stopPropagation()
                          onToggleStatus(notice)
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          notice.status === 'active'
                            ? 'hover:bg-error-container hover:text-error'
                            : 'hover:bg-status-completed/20 hover:text-status-completed'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {notice.status === 'active' ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                      <button
                        type="button"
                        title="Edit notice"
                        aria-label="Edit notice"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEdit?.(notice)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        type="button"
                        title="Delete notice"
                        aria-label="Delete notice"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete?.(notice)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!isLoading && !isError && notices.length === 0 && (
              <tr>
                <td colSpan={5} className="p-unit-lg text-center text-on-surface-variant">
                  No notices match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
