import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import NoticeTable from '@/features/broadcast/components/NoticeTable'
import { useDeleteNotice, useNoticesList, useUpdateNoticeStatus } from '@/hooks/useNotices'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Toast from '@/components/common/Toast'
import {
  CountSummary,
  PageHeader,
  PrimaryButton,
  SearchField,
  SegmentedFilter,
  TableFooter,
} from '@/components/common/DataTable'
import { ROUTES } from '@/constants/routes'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
]

export default function Broadcast() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [noticeToDelete, setNoticeToDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const deleteNotice = useDeleteNotice()
  const updateNoticeStatus = useUpdateNoticeStatus()

  const { data, isLoading, isError } = useNoticesList({ page, limit })
  const pagination = data?.pagination
  const notices = useMemo(() => data?.data ?? [], [data])
  const togglingNoticeId = updateNoticeStatus.isPending
    ? updateNoticeStatus.variables?.noticeId
    : null

  // Search/status filtering isn't sent to the API yet, so this only narrows
  // the page currently loaded, not the full list — acceptable for now.
  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase()
    return notices.filter((notice) => {
      if (query && !notice.title.toLowerCase().includes(query)) return false
      if (statusFilter !== 'all' && notice.status !== statusFilter) return false
      return true
    })
  }, [notices, search, statusFilter])

  const handlePageSizeChange = (value) => {
    setLimit(value)
    setPage(1)
  }

  const handleToggleStatus = async (notice) => {
    const nextStatus = notice.status === 'active' ? 'inactive' : 'active'
    try {
      await updateNoticeStatus.mutateAsync({ noticeId: notice.id, status: nextStatus })
      // Refetch every cached notice list (this page, and the dashboard's panel).
      queryClient.invalidateQueries({ queryKey: ['notices'] })
    } catch (error) {
      setToast({
        message:
          error?.response?.data?.message ?? 'Unable to update the notice status. Please try again.',
        tone: 'error',
      })
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteNotice.mutateAsync(noticeToDelete.id)
      // Refetch every cached notice list (this page, and the dashboard's panel).
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      // Deleting the only notice on a later page would otherwise leave us on an empty page.
      if (notices.length === 1 && page > 1) setPage(page - 1)
      setNoticeToDelete(null)
      setToast({ message: 'Notice Deleted Successfully.', tone: 'success' })
    } catch {
      // surfaced in the dialog via deleteNotice.isError
    }
  }

  return (
    <>
      <PageHeader
        title="Broadcast"
        subtitle="Notices sent to your staff."
        action={
          <PrimaryButton icon="campaign" onClick={() => navigate(ROUTES.ADMIN_BROADCAST_CREATE)}>
            New Notice
          </PrimaryButton>
        }
      />

      <section className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <SearchField value={search} onChange={setSearch} placeholder="Search notices by title…" />
          <SegmentedFilter
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <CountSummary count={pagination?.total}>notices</CountSummary>
        </div>

        <NoticeTable
          notices={filteredNotices}
          onToggleStatus={handleToggleStatus}
          togglingNoticeId={togglingNoticeId}
          onEdit={(notice) =>
            navigate(`${ROUTES.ADMIN_BROADCAST}/${notice.id}/edit`, { state: { notice } })
          }
          onDelete={(notice) => {
            deleteNotice.reset()
            setNoticeToDelete(notice)
          }}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={
            search.trim() || statusFilter !== 'all'
              ? 'No notices match.'
              : 'No notices yet. Send your first one.'
          }
        />

        <TableFooter
          pagination={pagination}
          noun="notices"
          onPageChange={setPage}
          limit={limit}
          onLimitChange={handlePageSizeChange}
        />
      </section>

      {noticeToDelete && (
        <ConfirmDialog
          title="Delete Notice"
          description={`Are you sure you want to delete "${noticeToDelete.title}"? It will also disappear for everyone it was sent to. This action cannot be undone.`}
          confirmLabel="Yes, Delete"
          cancelLabel="No"
          error={
            deleteNotice.isError
              ? (deleteNotice.error?.response?.data?.message ??
                'Unable to delete the notice. Please try again.')
              : null
          }
          isConfirming={deleteNotice.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setNoticeToDelete(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />
      )}
    </>
  )
}
