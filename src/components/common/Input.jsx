import { forwardRef, useId } from 'react'

const Input = forwardRef(function Input(
  { label, error, icon, rightElement, className = '', ...props },
  ref,
) {
  const id = useId()

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-unit-xs block font-[var(--font-body)] text-label-bold font-bold tracking-[0.05em] text-on-surface uppercase"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[24px] text-outline-variant">
            {icon}
          </span>
        )}
        <input
          id={id}
          ref={ref}
          className={`block w-full rounded-lg border border-border-light bg-surface-container-lowest py-4 pr-4 font-[var(--font-body)] text-body-md text-on-surface placeholder-outline transition-shadow focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none ${icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightElement}
      </div>
      {error && <p className="mt-unit-xs text-sm text-error">{error}</p>}
    </div>
  )
})

export default Input
