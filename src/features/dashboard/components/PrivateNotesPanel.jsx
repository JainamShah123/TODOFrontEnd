import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyRow, Panel, PanelHeader } from '@/features/dashboard/components/DashboardPanel'
import { formatRelativeTimestamp, stripHtml } from '@/features/notes/utils/notes.utils'
import { useDashboardNotes } from '@/hooks/useNotes'
import { ROUTES } from '@/constants/routes'

const LIST_LIMIT = 3

export default function PrivateNotesPanel() {
  const { data, isLoading, isError } = useDashboardNotes()

  const notes = useMemo(() => {
    const buckets = data?.data
    if (!buckets) return []
    const pinned = buckets.pinned ?? []
    const others = (buckets.all ?? []).filter((note) => !pinned.some((item) => item.id === note.id))
    return [...pinned, ...others].slice(0, LIST_LIMIT)
  }, [data])

  return (
    <Panel>
      <PanelHeader icon="lock" title="Private Notes" to={ROUTES.PRIVATE_NOTES} />
      {isLoading && <EmptyRow>Loading your notes…</EmptyRow>}
      {isError && !isLoading && <EmptyRow>Unable to load your notes right now.</EmptyRow>}
      {!isLoading && !isError && notes.length === 0 && <EmptyRow>No notes yet.</EmptyRow>}
      {notes.map((note) => (
        <Link
          key={note.id}
          to={ROUTES.PRIVATE_NOTES}
          className="flex gap-4 border-b border-border-light px-unit-lg py-unit-md transition-colors last:border-b-0 hover:bg-surface-subtle"
        >
          <span
            className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] ${
              note.pinned ? 'bg-status-pending/10 text-status-pending' : 'bg-status-completed/10 text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{note.pinned ? 'keep' : 'description'}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-md font-bold text-on-surface">{note.title}</span>
            <span className="block truncate text-label-md text-on-surface-variant">
              {stripHtml(note.contentHtml) || 'No content yet.'}
            </span>
            <span className="mt-2 block text-label-md text-on-surface-variant">
              {formatRelativeTimestamp(note.updatedAt)}
            </span>
          </span>
        </Link>
      ))}
    </Panel>
  )
}
