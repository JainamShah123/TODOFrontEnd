export default function Button({
  children,
  isLoading,
  disabled,
  type = 'button',
  icon,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-4 font-[var(--font-body)] text-label-bold font-bold tracking-[0.05em] text-on-primary uppercase shadow-sm transition-all hover:bg-surface-tint focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    >
      {isLoading ? 'Please wait…' : children}
      {!isLoading && icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
    </button>
  )
}
