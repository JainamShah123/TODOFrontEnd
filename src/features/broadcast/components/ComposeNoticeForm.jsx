import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createNoticeSchema } from '@/features/broadcast/schemas/notice.schema'
import { useStaffList } from '@/hooks/useStaff'
import { useCreateNotice, useUpdateNotice } from '@/hooks/useNotices'
import { avatarColorFor, initialsOf } from '@/features/broadcast/utils/broadcast.utils'
import { ROUTES } from '@/constants/routes'
import Toast from '@/components/common/Toast'

// Used for both creating a notice and (when `notice` is passed) editing one —
// same fields either way, so edit mode just pre-populates them and saves via PUT.
export default function ComposeNoticeForm({ notice }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(notice)
  const createNotice = useCreateNotice()
  const updateNotice = useUpdateNotice()
  const mutation = isEdit ? updateNotice : createNotice
  const [toast, setToast] = useState(null)
  const [recipientSearch, setRecipientSearch] = useState('')
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createNoticeSchema),
    defaultValues: {
      title: notice?.title ?? '',
      message: notice?.message ?? '',
      recipientIds: notice?.recipients.map((recipient) => recipient.id) ?? [],
    },
  })

  const message = watch('message')
  const { data, isLoading: staffLoading, isError: staffError } = useStaffList({ page: 1, limit: 50 })
  const staffMembers = useMemo(() => data?.data ?? [], [data])

  const filteredStaff = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase()
    if (!query) return staffMembers
    return staffMembers.filter((member) => `${member.firstName} ${member.lastName}`.toLowerCase().includes(query))
  }, [staffMembers, recipientSearch])

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateNotice.mutateAsync({ noticeId: notice.id, payload: values })
        // Make sure the list (and the dashboard panel) show the edited notice.
        queryClient.invalidateQueries({ queryKey: ['notices'] })
      } else {
        await createNotice.mutateAsync(values)
      }
      setToast({ message: isEdit ? 'Notice Updated Successfully.' : 'Notice Sent Successfully.', tone: 'success' })
      setTimeout(() => navigate(ROUTES.ADMIN_BROADCAST), 1200)
    } catch {
      // surfaced below via mutation.isError
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-unit-lg p-unit-lg md:p-margin-desktop">
      <div className="space-y-2">
        <label htmlFor="noticeTitle" className="block text-label-bold font-bold text-on-surface">
          Notice Title <span className="text-error">*</span>
        </label>
        <input
          id="noticeTitle"
          type="text"
          placeholder="e.g., Office Closed — Holiday Notice"
          className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
          {...register('title')}
        />
        {errors.title && <p className="text-sm text-error">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="noticeMessage" className="block text-label-bold font-bold text-on-surface">
          Message <span className="text-label-md font-medium text-on-surface-variant">(optional)</span>
        </label>
        <textarea
          id="noticeMessage"
          rows={5}
          placeholder="Write the announcement staff will see..."
          className="w-full resize-y rounded-lg border border-border-light bg-surface-subtle px-4 py-3 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
          {...register('message')}
        />
        <p className="text-right text-label-md text-on-surface-variant">{(message ?? '').length} characters</p>
      </div>

      <div className="h-px w-full bg-border-light" />

      <Controller
        control={control}
        name="recipientIds"
        render={({ field }) => {
          const selected = field.value ?? []
          const allIds = staffMembers.map((member) => member.id)
          const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id))

          const toggleOne = (id) => {
            field.onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
          }
          const toggleAll = () => {
            field.onChange(allSelected ? [] : allIds)
          }

          return (
            <div className="space-y-2">
              <label className="block text-label-bold font-bold text-on-surface">
                Send To <span className="text-error">*</span>
              </label>

              <div className="relative">
                <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(event) => setRecipientSearch(event.target.value)}
                  placeholder="Search staff by name..."
                  className="w-full rounded-lg border border-border-light bg-surface-subtle py-2 pr-4 pl-10 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-b border-dashed border-border-light px-1 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-label-bold font-bold text-on-surface">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-primary-container"
                  />
                  Select All Staff
                </label>
                <span className="rounded-full bg-status-completed/10 px-2.5 py-1 text-label-md font-bold text-primary">
                  {selected.length} of {allIds.length} selected
                </span>
              </div>

              <div className="max-h-60 space-y-0.5 overflow-y-auto rounded-lg border border-border-light p-1.5">
                {staffLoading && (
                  <p className="p-3 text-center text-label-md text-on-surface-variant">Loading staff…</p>
                )}
                {staffError && !staffLoading && (
                  <p className="p-3 text-center text-label-md text-error">
                    Couldn't load staff members. Please refresh the page.
                  </p>
                )}
                {!staffLoading &&
                  !staffError &&
                  filteredStaff.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-subtle"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(member.id)}
                      onChange={() => toggleOne(member.id)}
                      className="h-4 w-4 shrink-0 accent-primary-container"
                    />
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-on-primary"
                      style={{ backgroundColor: avatarColorFor(member.id) }}
                    >
                      {initialsOf(member.firstName, member.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-body-md font-bold text-on-surface">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="truncate text-label-md text-on-surface-variant">{member.email || '—'}</p>
                    </div>
                    <span
                      className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${
                        member.status === 'active' ? 'bg-status-completed' : 'bg-outline'
                      }`}
                      title={member.status === 'active' ? 'Active' : 'Inactive'}
                    />
                  </label>
                ))}
                {!staffLoading && !staffError && filteredStaff.length === 0 && (
                  <p className="p-3 text-center text-label-md text-on-surface-variant">No staff match your search.</p>
                )}
              </div>

              {errors.recipientIds && <p className="text-sm text-error">{errors.recipientIds.message}</p>}
            </div>
          )
        }}
      />

      {mutation.isError && (
        <p className="text-sm text-error">
          {mutation.error?.response?.data?.message ??
            (isEdit ? 'Unable to update the notice. Please try again.' : 'Unable to send the notice. Please try again.')}
        </p>
      )}

      <div className="flex flex-col items-center justify-between gap-4 border-t border-border-light pt-unit-lg md:flex-row">
        <p className="flex items-center gap-1.5 text-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-primary">info</span>
          {isEdit
            ? 'Staff removed from the list will no longer see this notice.'
            : 'Will be sent to staff immediately once submitted.'}
        </p>
        <div className="flex w-full gap-3 md:w-auto">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_BROADCAST)}
            className="w-full rounded-lg border border-border-light bg-transparent px-6 py-2.5 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-border-light md:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending || mutation.isSuccess}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-2.5 text-label-bold font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">{isEdit ? 'check' : 'send'}</span>
            {isSubmitting || mutation.isPending
              ? isEdit
                ? 'Saving…'
                : 'Sending…'
              : isEdit
                ? 'Save Changes'
                : 'Send Notice'}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
    </form>
  )
}
