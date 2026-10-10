import { useEffect } from 'react'

export default function Toast({ message, tone = 'success', onDismiss, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  const isError = tone === 'error'

  return (
    <div className="fixed top-6 right-6 z-[60] flex items-center gap-4 rounded-lg border border-border-light bg-surface-container-lowest px-unit-md py-unit-sm shadow-xl">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isError ? 'bg-error-container text-error' : 'bg-status-completed/10 text-status-completed'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">{isError ? 'error' : 'check_circle'}</span>
      </span>
      <p className="text-body-md font-bold text-on-surface">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-2 text-on-surface-variant hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  )
}
