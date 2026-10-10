import { useEffect, useMemo, useRef, useState } from 'react'
import NotesList from '@/features/notes/components/NotesList'
import NoteEditor from '@/features/notes/components/NoteEditor'
import Toast from '@/components/common/Toast'
import {
  useNotesList,
  useCreateNote,
  useUpdateNote,
  useToggleNotePin,
  useToggleNoteArchive,
  useDeleteNote,
} from '@/hooks/useNotes'
import { stripHtml } from '@/features/notes/utils/notes.utils'

const mapNote = (note) => ({
  id: note.id ?? note._id,
  title: note.title ?? '',
  contentHtml: note.contentHtml ?? '',
  pinned: note.pinned ?? false,
  archived: note.archived ?? false,
  updatedAt: note.updatedAt ?? note.createdAt ?? new Date().toISOString(),
  isNew: false,
})

export default function PrivateNotes() {
  const { data, isLoading, isError, error } = useNotesList()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const toggleNotePin = useToggleNotePin()
  const toggleNoteArchive = useToggleNoteArchive()
  const deleteNote = useDeleteNote()
  const creatingRef = useRef(new Set())
  const [notes, setNotes] = useState([])
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!data?.data) return
    const merged = [...data.data.all, ...data.data.archive].map(mapNote)
    const deduped = Array.from(new Map(merged.map((note) => [note.id, note])).values())
    setNotes(deduped)
    setSelectedNoteId((current) => current ?? deduped[0]?.id ?? null)
  }, [data])

  const counts = useMemo(
    () => ({
      all: notes.filter((note) => !note.archived).length,
      pinned: notes.filter((note) => !note.archived && note.pinned).length,
    }),
    [notes],
  )

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase()

    let list = notes.filter((note) => (activeTab === 'archive' ? note.archived : !note.archived))
    if (activeTab === 'pinned') list = list.filter((note) => note.pinned)

    list = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    if (activeTab === 'recent') list = list.slice(0, 5)

    if (query) {
      list = list.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          stripHtml(note.contentHtml).toLowerCase().includes(query),
      )
    }

    return list
  }, [notes, activeTab, search])

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null

  const handleCreateNote = () => {
    const newNote = {
      id: `note-${Date.now()}`,
      title: '',
      contentHtml: '',
      pinned: false,
      archived: false,
      updatedAt: new Date().toISOString(),
      isNew: true,
    }
    setNotes((prev) => [newNote, ...prev])
    setSelectedNoteId(newNote.id)
    setActiveTab('all')
    setSearch('')
  }

  const handleSaveNote = async (id, { title, contentHtml }) => {
    const note = notes.find((item) => item.id === id)
    if (!note) return

    if (!note.isNew) {
      try {
        const response = await updateNote.mutateAsync({
          noteId: id,
          payload: { title, contentHtml },
        })
        const updated = response.data.note
        setNotes((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  title: updated.title,
                  contentHtml: updated.contentHtml,
                  updatedAt: updated.updatedAt,
                }
              : item,
          ),
        )
      } catch (err) {
        setToast({
          message: err?.response?.data?.message ?? 'Unable to save note. Please try again.',
          tone: 'error',
        })
        throw err
      }
      return
    }

    if (creatingRef.current.has(id)) {
      setNotes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title, contentHtml } : item)),
      )
      return
    }

    creatingRef.current.add(id)
    try {
      const response = await createNote.mutateAsync({ title, contentHtml })
      const created = response.data.note
      setNotes((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                id: created.id,
                title: created.title,
                contentHtml: created.contentHtml,
                updatedAt: created.updatedAt,
                isNew: false,
              }
            : item,
        ),
      )
      setSelectedNoteId((current) => (current === id ? created.id : current))
    } catch (err) {
      setToast({
        message: err?.response?.data?.message ?? 'Unable to save note. Please try again.',
        tone: 'error',
      })
      throw err
    } finally {
      creatingRef.current.delete(id)
    }
  }

  const handleDeleteNote = async (id) => {
    const note = notes.find((item) => item.id === id)
    if (!note) return

    if (!note.isNew) {
      try {
        await deleteNote.mutateAsync(id)
      } catch (err) {
        setToast({
          message: err?.response?.data?.message ?? 'Unable to delete note. Please try again.',
          tone: 'error',
        })
        return
      }
    }

    const remaining = notes.filter((item) => item.id !== id)
    setNotes(remaining)
    if (selectedNoteId === id) {
      setSelectedNoteId(remaining[0]?.id ?? null)
    }
  }

  const handleTogglePin = async (id) => {
    const note = notes.find((item) => item.id === id)
    if (!note) return

    if (note.isNew) {
      setNotes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)),
      )
      return
    }

    try {
      const response = await toggleNotePin.mutateAsync(id)
      const updated = response.data.note
      setNotes((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, pinned: updated.pinned, updatedAt: updated.updatedAt } : item,
        ),
      )
    } catch (err) {
      setToast({
        message: err?.response?.data?.message ?? 'Unable to update pin status. Please try again.',
        tone: 'error',
      })
    }
  }

  const handleToggleArchive = async (id) => {
    const note = notes.find((item) => item.id === id)
    if (!note) return

    if (note.isNew) {
      setNotes((prev) =>
        prev.map((item) => (item.id === id ? { ...item, archived: !item.archived } : item)),
      )
      return
    }

    try {
      const response = await toggleNoteArchive.mutateAsync(id)
      const updated = response.data.note
      setNotes((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, archived: updated.archived, updatedAt: updated.updatedAt }
            : item,
        ),
      )
    } catch (err) {
      setToast({
        message:
          err?.response?.data?.message ?? 'Unable to update archive status. Please try again.',
        tone: 'error',
      })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-unit-md rounded-xl bg-surface-container-lowest p-unit-lg shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-unit-xs">
          <div className="flex items-center gap-unit-sm">
            <span className="h-2 w-2 rounded-full bg-primary-container" />
            <span className="text-label-bold font-bold tracking-[0.05em] text-primary uppercase">
              Confidential Storage
            </span>
          </div>
          <h1 className="font-[var(--font-headline)] text-headline-lg-mobile text-on-surface md:text-display-lg">
            Private Notes
          </h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Personal notes with rich text formatting. Visible only to you.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-unit-md sm:flex-row sm:items-center">
          <div className="relative min-w-[240px]">
            <span className="material-symbols-outlined pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[24px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes by title or keyword..."
              className="w-full rounded-lg bg-surface-container-low py-2 pr-4 pl-10 text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/70 focus:bg-surface-subtle focus:shadow-md focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleCreateNote}
            className="flex items-center justify-center gap-unit-sm rounded-lg bg-primary-container px-unit-lg py-2 text-label-bold font-bold text-on-primary shadow-md transition-all hover:opacity-95 active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
            Create New Note
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-unit-sm rounded-xl bg-surface-container-lowest p-unit-xl text-center text-body-md text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined animate-spin text-[24px]">
            progress_activity
          </span>
          Loading your notes…
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-xl bg-surface-container-lowest p-unit-xl text-center text-body-md text-error shadow-sm">
          {error?.response?.data?.message ?? 'Unable to load your notes. Please try again.'}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 items-start gap-unit-lg lg:grid-cols-12">
          <NotesList
            notes={filteredNotes}
            counts={counts}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
          />
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
          />
        </div>
      )}

      {toast && (
        <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />
      )}
    </>
  )
}
