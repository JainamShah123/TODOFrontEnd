import { Link, useLocation, useParams } from 'react-router-dom'
import { StatusPill } from '@/features/broadcast/components/NoticeTable'
import {
  avatarColorFor,
  formatNoticeDate,
  initialsOf,
} from '@/features/broadcast/utils/broadcast.utils'
import { ROUTES } from '@/constants/routes'

function SectionLabel({ children }) {
  return (
    <p className="mb-unit-sm text-label-bold font-bold tracking-[0.05em] text-on-surface-variant uppercase">
      {children}
    </p>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-unit-md border-b border-border-light py-4 last:border-b-0">
      <span className="shrink-0 text-label-md text-on-surface-variant">{label}</span>
      <span className="flex flex-col items-end text-right text-body-md font-bold text-on-surface">
        {children}
      </span>
    </div>
  )
}

export default function NoticeDetail() {
  const { noticeId } = useParams()
  const location = useLocation()
  const notice = location.state?.notice?.id === noticeId ? location.state.notice : null

  if (!notice) {
    return (
      <div className="flex flex-col items-center gap-unit-md rounded-xl border border-border-light bg-surface-container-lowest p-unit-xl text-center shadow-sm">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
          search_off
        </span>
        <div>
          <h2 className="font-[var(--font-headline)] text-headline-sm text-on-surface">
            Notice details unavailable
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Open this notice from the Broadcast / Notice list to see its details.
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
      <nav className="flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant">
        <Link
          to={ROUTES.ADMIN_BROADCAST}
          className="flex items-center gap-2 font-bold hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Broadcast / Notice
        </Link>
        <span>/</span>
        <span className="truncate font-bold text-on-surface">{notice.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-unit-md">
        <div className="min-w-0 flex-1 basis-80">
          <h2 className="mb-unit-sm font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-headline-md">
            {notice.title}
          </h2>
          <StatusPill status={notice.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-margin-desktop lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="divide-y divide-border-light rounded-xl border border-border-light bg-surface-container-lowest shadow-sm">
          <div className="p-unit-lg">
            <SectionLabel>Message</SectionLabel>
            <p className="max-w-[62ch] text-body-md text-on-surface">
              {notice.message || 'No message added.'}
            </p>
          </div>

          <div className="p-unit-lg">
            <SectionLabel>Sent To ({notice.recipients.length})</SectionLabel>
            <div className="space-y-2">
              {notice.recipients.map((recipient) => {
                const [firstName, ...rest] = recipient.name.split(' ')
                return (
                  <div
                    key={recipient.id}
                    className="flex items-center gap-4 rounded-lg border border-border-light bg-surface-subtle p-2"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] font-bold text-on-primary"
                      style={{ backgroundColor: avatarColorFor(recipient.id) }}
                    >
                      {initialsOf(firstName, rest.join(' '))}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-body-md font-bold text-on-surface">
                        {recipient.name}
                      </p>
                      <p className="truncate text-label-md text-on-surface-variant">
                        {recipient.staffId}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-border-light bg-surface-container-lowest px-unit-lg py-2 shadow-sm">
          <DetailRow label="Status">
            <StatusPill status={notice.status} />
          </DetailRow>
          <DetailRow label="Sent on">{formatNoticeDate(notice.createdAt)}</DetailRow>
          <DetailRow label="Recipients">{notice.recipients.length}</DetailRow>
        </aside>
      </div>
    </>
  )
}
