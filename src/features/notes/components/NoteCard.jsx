import { formatRelativeTimestamp, stripHtml } from '@/features/notes/utils/notes.utils'

export default function NoteCard({ note, isActive, onSelect }) {
  const excerpt = stripHtml(note.contentHtml) || 'No content yet.'

  return (
    <button
      type="button"
      onClick={() => onSelect(note.id)}
      className={`group relative w-full rounded-xl p-unit-md text-left shadow-sm transition-all hover:shadow-md ${
        isActive ? 'bg-primary-container/5 pl-[16px] shadow-md' : 'bg-surface-container-lowest'
      }`}
    >
      {isActive && <span className="absolute top-4 bottom-4 left-0 w-2 rounded-r-full bg-primary-container" />}
      <div className="flex items-start justify-between gap-unit-sm">
        <h3 className="line-clamp-1 font-[var(--font-headline)] text-headline-sm text-on-surface transition-colors group-hover:text-primary">
          {note.title || 'Untitled Note'}
        </h3>
        {note.pinned && (
          <span className="material-symbols-outlined shrink-0 text-[16px] text-primary-container" data-weight="fill">
            keep
          </span>
        )}
      </div>
      <p className="mt-unit-xs line-clamp-2 text-body-md text-on-surface-variant">{excerpt}</p>
      <div className="mt-unit-md flex items-center justify-between pt-unit-xs">
        {note.archived && (
          <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-md font-bold text-on-surface-variant">
            Archived
          </span>
        )}
        <span className="ml-auto shrink-0 text-label-md text-on-surface-variant">
          {formatRelativeTimestamp(note.updatedAt)}
        </span>
      </div>
    </button>
  )
}
