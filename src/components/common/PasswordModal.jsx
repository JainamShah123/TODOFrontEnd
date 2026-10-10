import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const INPUT_CLASS =
  'w-full rounded-lg border border-border-light bg-surface-subtle px-4 py-2 text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none'

// Shared form for "reset a staff member's password" and "change my password". `fields` lists the
// password inputs ({ name, label, autoComplete }); `onSubmit` returns a promise that rejects on API error.
export default function PasswordModal({ title, fields, schema, submitLabel, onSubmit, onClose }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: Object.fromEntries(fields.map((field) => [field.name, ''])),
  })

  const submit = async (values) => {
    try {
      await onSubmit(values)
      onClose()
    } catch (error) {
      setError('root', { message: error?.response?.data?.message ?? 'Could not save the password. Please try again.' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between border-b border-border-light p-unit-lg">
          <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} noValidate className="space-y-unit-lg p-unit-lg">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label htmlFor={field.name} className="block text-label-bold font-bold text-on-surface">
                {field.label}
              </label>
              <input
                id={field.name}
                type="password"
                autoComplete={field.autoComplete}
                className={INPUT_CLASS}
                {...register(field.name)}
              />
              {errors[field.name] && <p className="text-sm text-error">{errors[field.name].message}</p>}
            </div>
          ))}

          {errors.root && <p className="text-sm text-error">{errors.root.message}</p>}

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
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-2 text-label-bold font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              {isSubmitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
