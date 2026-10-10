import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AddStaffModal from '@/features/staff/components/AddStaffModal'
import EditStaffModal from '@/features/staff/components/EditStaffModal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import PasswordModal from '@/components/common/PasswordModal'
import { resetPasswordSchema } from '@/features/auth/schemas/password.schema'
import Toast from '@/components/common/Toast'
import Pagination from '@/components/common/Pagination'
import StatusChip from '@/features/staff/components/StatusChip'
import { useStaffList, useDeleteStaff, useResetStaffPassword, useUpdateStaffStatus } from '@/hooks/useStaff'

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

export default function StaffDirectory() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
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
    if (!query) return staff
    return staff.filter((member) =>
      [`${member.firstName} ${member.lastName}`, member.staffId, member.email, member.phone].some((field) =>
        (field ?? '').toLowerCase().includes(query),
      ),
    )
  }, [staff, search])

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

  const handlePageSizeChange = (event) => {
    setLimit(Number(event.target.value))
    setPage(1)
  }

  const noStaffAtAll = !isLoading && !isError && (pagination?.total ?? staff.length) === 0

  return (
    <>
      <div className="flex flex-col justify-between gap-unit-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Staff Directory
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-md py-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase transition-colors hover:bg-primary"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Add Staff Member
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-unit-md">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, ID, email, or phone..."
          className="h-10 min-w-[224px] flex-1 rounded-lg border border-border-light bg-surface-container-lowest px-4 text-body-md text-on-surface shadow-sm transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
        />
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
        <div className="flex shrink-0 items-center gap-2 text-label-md text-on-surface-variant">
          <span className="h-2 w-2 rounded-full bg-status-completed" />
          <span className="font-medium text-on-surface">{pagination?.total ?? 0}</span> total
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-light bg-surface-subtle text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
                <th className="p-unit-md py-unit-sm font-medium">Employee ID</th>
                <th className="p-unit-md py-unit-sm font-medium">Name</th>
                <th className="p-unit-md py-unit-sm font-medium">Email</th>
                <th className="p-unit-md py-unit-sm font-medium">Phone Number</th>
                <th className="p-unit-md py-unit-sm font-medium">Status</th>
                <th className="p-unit-md py-unit-sm text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-body-md text-on-surface">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-unit-lg text-center text-on-surface-variant">
                    Loading staff directory…
                  </td>
                </tr>
              )}

              {isError && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-unit-lg text-center text-error">
                    {error?.response?.data?.message ?? 'Unable to load the staff directory. Please try again.'}
                  </td>
                </tr>
              )}

              {!isLoading && !isError && noStaffAtAll && (
                <tr>
                  <td colSpan={6} className="p-unit-xl text-center">
                    <div className="flex flex-col items-center gap-unit-sm text-on-surface-variant">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                        <span className="material-symbols-outlined text-[24px]">group_off</span>
                      </span>
                      <p className="text-body-md">
                        No staff added yet. You can add one using the{' '}
                        <span className="font-bold text-on-surface">Add Staff Member</span> button above.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                !noStaffAtAll &&
                filteredStaff.map((member) => (
                  <tr
                    key={member.staffId}
                    className={`group transition-colors hover:bg-surface-subtle ${
                      member.status === 'inactive' ? 'opacity-70' : ''
                    }`}
                  >
                    <td className="p-unit-md text-on-surface-variant">#{member.staffId}</td>
                    <td className="p-unit-md font-bold text-on-surface">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="p-unit-md text-on-surface-variant">{member.email || '—'}</td>
                    <td className="p-unit-md text-on-surface-variant">{member.phone || '—'}</td>
                    <td className="p-unit-md">
                      <StatusChip status={member.status} />
                    </td>
                    <td className="p-unit-md text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => setStaffToEdit(member)}
                          className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[24px]">edit</span>
                        </button>
                        <button
                          type="button"
                          title="Reset Password"
                          onClick={() => setStaffToReset(member)}
                          className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[24px]">lock_reset</span>
                        </button>
                        <button
                          type="button"
                          title={member.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          onClick={() => toggleStatus(member)}
                          disabled={updateStaffStatus.isPending}
                          className={`flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            member.status === 'active'
                              ? 'hover:bg-error-container hover:text-error'
                              : 'hover:bg-status-completed/20 hover:text-status-completed'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[24px]">
                            {member.status === 'active' ? 'person_off' : 'person_add'}
                          </span>
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => {
                            deleteStaff.reset()
                            setStaffToDelete(member)
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                        >
                          <span className="material-symbols-outlined text-[24px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && !isError && !noStaffAtAll && filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-unit-lg text-center text-on-surface-variant">
                    No staff members match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center justify-between gap-unit-sm border-t border-border-light bg-surface-subtle px-unit-md py-unit-sm text-label-md text-on-surface-variant sm:flex-row">
          <span>
            Showing {filteredStaff.length} of {staff.length} on this page
          </span>
          {pagination && pagination.totalPages > 1 && (
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>

      {isModalOpen && <AddStaffModal onClose={() => setIsModalOpen(false)} onAdd={handleAddStaff} />}

      {staffToEdit && (
        <EditStaffModal staff={staffToEdit} onClose={() => setStaffToEdit(null)} onSave={handleEditStaff} />
      )}

      {staffToReset && (
        <PasswordModal
          title={`Reset password for ${staffToReset.firstName} ${staffToReset.lastName}`}
          fields={[
            { name: 'newPassword', label: 'New password', autoComplete: 'new-password' },
            { name: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
          ]}
          schema={resetPasswordSchema}
          submitLabel="Reset Password"
          onSubmit={async ({ newPassword }) => {
            await resetStaffPassword.mutateAsync({ staffId: staffToReset.staffId, password: newPassword })
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
              ? (deleteStaff.error?.response?.data?.message ?? 'Unable to delete staff member. Please try again.')
              : null
          }
          isConfirming={deleteStaff.isPending}
          onConfirm={handleConfirmDelete}
          onCancel={() => setStaffToDelete(null)}
        />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </>
  )
}
