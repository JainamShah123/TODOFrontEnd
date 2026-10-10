import { forwardRef, useId } from 'react'

const SelectField = forwardRef(function SelectField(
  {
    label,
    error,
    required,
    placeholder,
    options,
    containerClassName = '',
    className = '',
    ...props
  },
  ref,
) {
  const id = useId()

  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={id} className="block text-label-bold font-bold text-on-surface">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className={`relative ${containerClassName}`}>
        <select
          id={id}
          ref={ref}
          defaultValue={placeholder ? '' : undefined}
          className={`w-full cursor-pointer appearance-none rounded-lg border border-border-light bg-surface-subtle py-2 pr-10 pl-4 text-body-md text-on-surface transition-shadow focus:border-primary-container focus:ring-2 focus:ring-primary-container focus:outline-none ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-on-surface-variant">
          expand_more
        </span>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  )
})

export default SelectField
