import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addStaffSchema } from '@/features/staff/schemas/staff.schema'
import { useUpdateStaff } from '@/hooks/useStaff'

export default function EditStaffModal({ staff, onClose, onSave }) {
  const updateStaff = useUpdateStaff()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email ?? '',
      phone: staff.phone ?? '',
    },
  })

  const onSubmit = async (values) => {
    try {
      const response = await updateStaff.mutateAsync({ staffId: staff.staffId, values })
      onSave(response.data.staff)
      onClose()
    } catch {
      // surfaced below via updateStaff.isError
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-border-light p-unit-lg">
          <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">Edit Staff Member</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-unit-lg p-unit-lg">
          <div className="grid grid-cols-1 gap-unit-lg md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="editStaffFirstName" className="block text-label-bold font-bold text-on-surface">
                First Name <span className="text-error">*</span>
              </label>
              <input
                id="editStaffFirstName"
                type="text"
                placeholder="e.g., Priya"
                className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
                {...register('firstName')}
              />
              {errors.firstName && <p className="text-sm text-error">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="editStaffLastName" className="block text-label-bold font-bold text-on-surface">
                Last Name <span className="text-error">*</span>
              </label>
              <input
                id="editStaffLastName"
                type="text"
                placeholder="e.g., Nair"
                className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
                {...register('lastName')}
              />
              {errors.lastName && <p className="text-sm text-error">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="editStaffEmail" className="block text-label-bold font-bold text-on-surface">
              Email
            </label>
            <input
              id="editStaffEmail"
              type="email"
              placeholder="e.g., priya.nair@taskmaster.pro"
              className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="editStaffPhone" className="block text-label-bold font-bold text-on-surface">
              Phone Number
            </label>
            <input
              id="editStaffPhone"
              type="tel"
              placeholder="e.g., +1 (415) 555-0136"
              className="w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none"
              {...register('phone')}
            />
            {errors.phone && <p className="text-sm text-error">{errors.phone.message}</p>}
          </div>

          {updateStaff.isError && (
            <p className="text-sm text-error">
              {updateStaff.error?.response?.data?.message ?? 'Unable to update staff member. Please try again.'}
            </p>
          )}

          <div className="flex justify-end gap-4 border-t border-border-light pt-unit-lg">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-light bg-transparent px-6 py-2 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || updateStaff.isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-2 text-label-bold font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              {isSubmitting || updateStaff.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
