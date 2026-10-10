import { useNavigate } from 'react-router-dom'
import ComposeNoticeForm from '@/features/broadcast/components/ComposeNoticeForm'
import { ROUTES } from '@/constants/routes'

export default function CreateNotice() {
  const navigate = useNavigate()

  return (
    <>
      <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_BROADCAST)}
          className="hover:text-on-surface hover:underline"
        >
          Broadcast / Notice
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-bold text-on-surface">Create Notice</span>
      </div>

      <div>
        <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-headline-md">
          Create Notice
        </h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <ComposeNoticeForm />
      </div>
    </>
  )
}
