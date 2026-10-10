export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  confirmIcon = 'delete',
  tone = 'danger',
  error,
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  const isDanger = tone === 'danger'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile">
      <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-xl">
        <div className="p-unit-lg">
          <div className="flex items-start gap-unit-md">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isDanger ? 'bg-error-container text-error' : 'bg-primary-container/10 text-primary'
              }`}
            >
              <span className="material-symbols-outlined">{isDanger ? 'warning' : confirmIcon}</span>
            </div>
            <div>
              <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">{title}</h2>
              <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
              {error && <p className="mt-2 text-sm text-error">{error}</p>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t border-border-light p-unit-lg pt-unit-md">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-lg border border-border-light bg-transparent px-6 py-2 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-label-bold font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
              isDanger
                ? 'bg-error text-on-error hover:opacity-90'
                : 'bg-primary-container text-on-primary hover:bg-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{confirmIcon}</span>
            {isConfirming ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
