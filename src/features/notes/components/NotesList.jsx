import NoteCard from '@/features/notes/components/NoteCard'

const TABS = [
  { key: 'all', label: 'All Notes' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'recent', label: 'Recent' },
  { key: 'archive', label: 'Archive' },
]

export default function NotesList({ notes, counts, activeTab, onTabChange, selectedNoteId, onSelectNote }) {
  return (
    <div className="flex flex-col gap-unit-md lg:col-span-4">
      <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-surface-container-lowest p-2 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex-1 rounded-lg px-unit-sm py-2 text-center text-label-md font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-primary-container text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-subtle'
            }`}
          >
            {tab.label}
            {typeof counts[tab.key] === 'number' && ` (${counts[tab.key]})`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-unit-sm">
        {notes.length === 0 && (
          <p className="rounded-xl bg-surface-container-lowest p-unit-md text-center text-body-md text-on-surface-variant shadow-sm">
            No notes here yet.
          </p>
        )}
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} isActive={note.id === selectedNoteId} onSelect={onSelectNote} />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-unit-md shadow-sm">
        <div className="flex items-center gap-unit-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary">
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-bold font-bold text-on-surface">Private to you</span>
            <span className="text-label-md text-on-surface-variant">Only you can see these notes</span>
          </div>
        </div>
        <span className="h-2 w-2 rounded-full bg-primary-container" />
      </div>
    </div>
  )
}
