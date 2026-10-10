import { useNavigate } from 'react-router-dom'
import {
  avatarColorFor,
  formatNoticeDate,
  initialsOf,
} from '@/features/broadcast/utils/broadcast.utils'
import { ROUTES } from '@/constants/routes'
import {
  IconAction,
  RowActions,
  StatusBadge,
  TableStateRows,
  cellClass,
  headCellClass,
  headRowClass,
  rowClass,
  tableClass,
} from '@/components/common/DataTable'

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
            style={{
              backgroundColor: avatarColorFor(recipient.id),
              marginLeft: index === 0 ? 0 : '-8px',
            }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-surface-container-lowest text-[11px] font-bold text-on-primary"
          >
            {initialsOf(firstName, rest.join(' '))}
          </div>
        )
      })}
      {overflow > 0 && (
        <span className="ml-2 text-label-md text-on-surface-variant">+{overflow}</span>
      )}
    </div>
  )
}

export function StatusPill({ status }) {
  return <StatusBadge active={status === 'active'} inactiveLabel="Deactivated" />
}

const COLUMNS = [
  { key: 'notice', label: 'Notice' },
  { key: 'to', label: 'Sent to', className: 'w-36' },
  { key: 'date', label: 'Date', className: 'w-36' },
  { key: 'status', label: 'Status', className: 'w-32' },
  { key: 'actions', label: <span className="sr-only">Actions</span>, className: 'w-32' },
]

// Compact notice list in the task board's style. Clicking a row opens the notice; the actions don't.
export default function NoticeTable({
  notices,
  onToggleStatus,
  togglingNoticeId = null,
  onEdit,
  onDelete,
  isLoading = false,
  isError = false,
  emptyMessage = 'No notices yet.',
}) {
  const navigate = useNavigate()

  const openDetail = (notice) => {
    navigate(`${ROUTES.ADMIN_BROADCAST}/${notice.id}`, { state: { notice } })
  }

  return (
    <div className="overflow-x-auto">
      <table className={`${tableClass} min-w-[760px]`}>
        <thead>
          <tr className={headRowClass}>
            {COLUMNS.map((column) => (
              <th key={column.key} className={`${headCellClass} ${column.className ?? ''}`}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light text-on-surface">
          <TableStateRows
            columns={COLUMNS.length}
            isLoading={isLoading}
            isError={isError && !isLoading}
            errorMessage="Couldn't load notices. Please refresh the page."
            isEmpty={!isLoading && !isError && notices.length === 0}
            emptyIcon="campaign"
            emptyMessage={emptyMessage}
          />
          {!isLoading &&
            !isError &&
            notices.map((notice) => {
              const isActive = notice.status === 'active'
              return (
                <tr
                  key={notice.id}
                  onClick={() => openDetail(notice)}
                  className={`${rowClass} cursor-pointer`}
                >
                  <td className={cellClass}>
                    <p
                      title={notice.title}
                      className={`truncate font-semibold group-hover:text-primary ${
                        isActive ? '' : 'text-on-surface-variant'
                      }`}
                    >
                      {notice.title}
                    </p>
                    {notice.message && (
                      <p className="truncate text-[12px] text-on-surface-variant">
                        {notice.message}
                      </p>
                    )}
                  </td>
                  <td className={cellClass}>
                    <RecipientStack recipients={notice.recipients} />
                  </td>
                  <td
                    className={`${cellClass} whitespace-nowrap text-on-surface-variant tabular-nums`}
                  >
                    {formatNoticeDate(notice.createdAt)}
                  </td>
                  <td className={cellClass}>
                    <StatusPill status={notice.status} />
                  </td>
                  <td className={cellClass}>
                    <RowActions>
                      <IconAction
                        icon={isActive ? 'visibility_off' : 'visibility'}
                        label={isActive ? 'Deactivate notice' : 'Activate notice'}
                        tone={isActive ? 'danger' : 'success'}
                        disabled={togglingNoticeId === notice.id}
                        onClick={() => onToggleStatus(notice)}
                      />
                      <IconAction
                        icon="edit"
                        label="Edit notice"
                        onClick={() => onEdit?.(notice)}
                      />
                      <IconAction
                        icon="delete"
                        label="Delete notice"
                        tone="danger"
                        onClick={() => onDelete?.(notice)}
                      />
                    </RowActions>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
