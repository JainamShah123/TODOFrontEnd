import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import ComposeNoticeForm from '@/features/broadcast/components/ComposeNoticeForm'
import { ROUTES } from '@/constants/routes'

export default function EditNotice() {
  const { noticeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  // There's no single-notice GET endpoint yet, so the notice comes along with
  // the navigation from the list (same approach as the detail page).
  const notice = location.state?.notice?.id === noticeId ? location.state.notice : null

  if (!notice) {
    return (
      <div className="flex flex-col items-center gap-unit-md rounded-xl border border-border-light bg-surface-container-lowest p-unit-xl text-center shadow-sm">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">search_off</span>
        <div>
          <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">Notice details unavailable</h2>
          <p className="text-body-md text-on-surface-variant">
            Open the edit option from the Broadcast / Notice list to edit a notice.
          </p>
        </div>
        <Link
          to={ROUTES.ADMIN_BROADCAST}
          className="rounded-lg border border-border-light px-4 py-2 text-label-bold font-bold text-on-surface hover:bg-surface-subtle"
        >
          Back to Broadcast / Notice
        </Link>
      </div>
    )
  }

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
        <span className="font-bold text-on-surface">Edit Notice</span>
      </div>

      <div>
        <h2 className="mb-unit-xs font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-headline-md">
          Edit Notice
        </h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-border-light bg-surface-container-lowest shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <ComposeNoticeForm key={notice.id} notice={notice} />
      </div>
    </>
  )
}
