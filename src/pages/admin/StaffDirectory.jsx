import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AddStaffModal from '@/features/staff/components/AddStaffModal'
import EditStaffModal from '@/features/staff/components/EditStaffModal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import PasswordModal from '@/components/common/PasswordModal'
import { resetPasswordSchema } from '@/features/auth/schemas/password.schema'
import Toast from '@/components/common/Toast'
import {
  CountSummary,
  IconAction,
  PageHeader,
  PrimaryButton,
  RowActions,
  SearchField,
  SegmentedFilter,
  StatusBadge,
  TableFooter,
  TableStateRows,
  cellClass,
  headCellClass,
  headRowClass,
  rowClass,
  tableClass,
} from '@/components/common/DataTable'
import { avatarColorFor, initialsOf } from '@/features/tasks/utils/task.utils'
import {
  useStaffList,
  useDeleteStaff,
  useResetStaffPassword,
  useUpdateStaffStatus,
} from '@/hooks/useStaff'

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'Employee ID', className: 'w-32' },
  { key: 'email', label: 'Email', className: 'w-64' },
  { key: 'phone', label: 'Phone', className: 'w-40' },
  { key: 'status', label: 'Status', className: 'w-28' },
  { key: 'actions', label: <span className="sr-only">Actions</span>, className: 'w-40' },
]

export default function StaffDirectory() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [staffToEdit, setStaffToEdit] = useState(null)
  const [staffToDelete, setStaffToDelete] = useState(null)
  const [staffToReset, setStaffToReset] = useState(null)
  const [toast, setToast] = useState(null)

  const { data, isLoading, isError, error } = useStaffList({ page, limit })
  const deleteStaff = useDeleteStaff()
  const updateStaffStatus = useUpdateStaffStatus()
  const resetStaffPassword = useResetStaffPassword()
  const staff = data?.data ?? []
  const pagination = data?.pagination

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase()
    return staff.filter(
      (member) =>
        (statusFilter === 'all' || member.status === statusFilter) &&
        (!query ||
          [
            `${member.firstName} ${member.lastName}`,
            member.staffId,
            member.email,
            member.phone,
          ].some((field) => (field ?? '').toLowerCase().includes(query))),
    )
  }, [staff, search, statusFilter])

  const handleAddStaff = () => {
    queryClient.invalidateQueries({ queryKey: ['staff'] })
    setToast({ message: 'Staff Added Successfully.', tone: 'success' })
  }

  const handleEditStaff = () => {
    queryClient.invalidateQueries({ queryKey: ['staff'] })
    setToast({ message: 'Staff Updated Successfully.', tone: 'success' })
  }

  const toggleStatus = async (member) => {
    const nextStatus = member.status === 'active' ? 'inactive' : 'active'
    try {
      await updateStaffStatus.mutateAsync({ staffId: member.staffId, status: nextStatus })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    } catch (err) {
      setToast({
        message: err?.response?.data?.message ?? 'Unable to update staff status. Please try again.',
        tone: 'error',
      })
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteStaff.mutateAsync(staffToDelete.staffId)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      setStaffToDelete(null)
      setToast({ message: 'Staff Deleted Successfully.', tone: 'success' })
    } catch {
      // surfaced below via deleteStaff.isError
    }
  }

  const handlePageSizeChange = (value) => {
    setLimit(value)
    setPage(1)
  }

  const noStaffAtAll = !isLoading && !isError && (pagination?.total ?? staff.length) === 0

  return (
    <>
      <PageHeader
        title="Staff Directory"
        subtitle="Everyone on your team and their access."
        action={
          <PrimaryButton icon="person_add" onClick={() => setIsModalOpen(true)}>
            Add Staff
          </PrimaryButton>
        }
      />

      <section className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID, email, phone…"
          />
          <SegmentedFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <CountSummary count={pagination?.total}>staff members</CountSummary>
        </div>

        <div className="overflow-x-auto">
          <table className={`${tableClass} min-w-[860px]`}>
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
                errorMessage={
                  error?.response?.data?.message ??
                  'Unable to load the staff directory. Please try again.'
                }
                isEmpty={!isLoading && !isError && filteredStaff.length === 0}
                emptyIcon={noStaffAtAll ? 'group_off' : 'search_off'}
                emptyMessage={
                  noStaffAtAll
                    ? 'No staff yet. Add your first team member.'
                    : 'No staff members match.'
                }
              />
              {!isLoading &&
                !isError &&
                filteredStaff.map((member) => {
                  const name = `${member.firstName} ${member.lastName}`
                  const isActive = member.status === 'active'
                  return (
                    <tr
                      key={member.staffId}
                      onClick={() => setStaffToEdit(member)}
                      className={`${rowClass} cursor-pointer`}
                    >
                      <td className={cellClass}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-on-primary ${
                              isActive ? '' : 'opacity-50 grayscale'
                            }`}
                            style={{ backgroundColor: avatarColorFor(String(member.staffId)) }}
                          >
                            {initialsOf(name) || '?'}
                          </span>
                          <span
                            title={name}
                            className={`truncate font-semibold group-hover:text-primary ${
                              isActive ? '' : 'text-on-surface-variant'
                            }`}
                          >
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className={`${cellClass} font-mono text-[13px] text-on-surface-variant`}>
                        #{member.staffId}
                      </td>
                      <td
                        className={`${cellClass} truncate text-on-surface-variant`}
                        title={member.email}
                      >
                        {member.email || '—'}
                      </td>
                      <td className={`${cellClass} text-on-surface-variant tabular-nums`}>
                        {member.phone || '—'}
                      </td>
                      <td className={cellClass}>
                        <StatusBadge active={isActive} />
                      </td>
                      <td className={cellClass}>
                        <RowActions>
                          <IconAction
                            icon="edit"
                            label="Edit"
                            onClick={() => setStaffToEdit(member)}
                          />
                          <IconAction
                            icon="lock_reset"
                            label="Reset password"
                            onClick={() => setStaffToReset(member)}
                          />
                          <IconAction
                            icon={isActive ? 'person_off' : 'person_check'}
                            label={isActive ? 'Deactivate' : 'Reactivate'}
                            tone={isActive ? 'danger' : 'success'}
                            disabled={updateStaffStatus.isPending}
                            onClick={() => toggleStatus(member)}
                          />
                          <IconAction
                            icon="delete"
                            label="Delete"
                            tone="danger"
                            onClick={() => {
                              deleteStaff.reset()
                              setStaffToDelete(member)
                            }}
                          />
                        </RowActions>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        <TableFooter
          pagination={pagination}
          noun="staff"
          onPageChange={setPage}
          limit={limit}
          onLimitChange={handlePageSizeChange}
        />
      </section>

      {isModalOpen && (
        <AddStaffModal onClose={() => setIsModalOpen(false)} onAdd={handleAddStaff} />
      )}

      {staffToEdit && (
        <EditStaffModal
          staff={staffToEdit}
          onClose={() => setStaffToEdit(null)}
          onSave={handleEditStaff}
        />
      )}

      {staffToReset && (
        <PasswordModal
          title={`Reset password for ${staffToReset.firstName} ${staffToReset.lastName}`}
          fields={[
            { name: 'newPassword', label: 'New password', autoComplete: 'new-password' },
            {
              name: 'confirmPassword',
              label: 'Confirm new password',
              autoComplete: 'new-password',
            },
          ]}
          schema={resetPasswordSchema}
          submitLabel="Reset Password"
          onSubmit={async ({ newPassword }) => {
            await resetStaffPassword.mutateAsync({
              staffId: staffToReset.staffId,
              password: newPassword,
            })
            setToast({ message: 'Password reset.', tone: 'success' })
          }}
          onClose={() => setStaffToReset(null)}
        />
      )}

      {staffToDelete && (
        <ConfirmDialog
          title="Delete Staff Member"
          description={`Are you sure you want to delete ${staffToDelete.firstName} ${staffToDelete.lastName}'s staff detail? This action cannot be undone.`}
          confirmLabel="Yes, Delete"
          cancelLabel="No"
          error={
            deleteStaff.isError
              ? (deleteStaff.error?.response?.data?.message ??
                'Unable to delete staff member. Please try again.')
              : null
          }
          isConfirming={deleteStaff.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setStaffToDelete(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />
      )}
    </>
  )
}
