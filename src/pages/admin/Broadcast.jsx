import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import NoticeTable from '@/features/broadcast/components/NoticeTable'
import { useDeleteNotice, useNoticesList, useUpdateNoticeStatus } from '@/hooks/useNotices'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Toast from '@/components/common/Toast'
import Pagination from '@/components/common/Pagination'
import { ROUTES } from '@/constants/routes'

const STATUS_FILTER_OPTIONS = [
  { key: 'all', label: 'All Statuses' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Deactivated' },
]

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

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
  const togglingNoticeId = updateNoticeStatus.isPending ? updateNoticeStatus.variables?.noticeId : null

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

  const handlePageSizeChange = (event) => {
    setLimit(Number(event.target.value))
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
        message: error?.response?.data?.message ?? 'Unable to update the notice status. Please try again.',
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
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Broadcast / Notice
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_BROADCAST_CREATE)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create Notice
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-unit-md">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search notices by title..."
          className="h-10 min-w-[224px] flex-1 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={limit}
          onChange={handlePageSizeChange}
          className="h-10 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      <NoticeTable
        notices={filteredNotices}
        onToggleStatus={handleToggleStatus}
        togglingNoticeId={togglingNoticeId}
        onEdit={(notice) => navigate(`${ROUTES.ADMIN_BROADCAST}/${notice.id}/edit`, { state: { notice } })}
        onDelete={(notice) => {
          deleteNotice.reset()
          setNoticeToDelete(notice)
        }}
        isLoading={isLoading}
        isError={isError}
      />

      <div className="flex flex-col items-center justify-between gap-unit-sm sm:flex-row">
        <p className="text-label-md text-on-surface-variant">
          Showing {filteredNotices.length} of {pagination?.total ?? 0} notices
        </p>
        {pagination && pagination.totalPages > 1 && (
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        )}
      </div>

      {noticeToDelete && (
        <ConfirmDialog
          title="Delete Notice"
          description={`Are you sure you want to delete "${noticeToDelete.title}"? It will also disappear for everyone it was sent to. This action cannot be undone.`}
          confirmLabel="Yes, Delete"
          cancelLabel="No"
          error={
            deleteNotice.isError
              ? (deleteNotice.error?.response?.data?.message ?? 'Unable to delete the notice. Please try again.')
              : null
          }
          isConfirming={deleteNotice.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setNoticeToDelete(null)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </>
  )
}
