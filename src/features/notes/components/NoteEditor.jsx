import { useEffect, useRef, useState } from 'react'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { countChars, countWords, formatFullTimestamp } from '@/features/notes/utils/notes.utils'

const CHECKLIST_HTML =
  '<div class="flex flex-col gap-2 my-2 bg-surface-container-low/40 p-4 rounded-lg"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="h-4 w-4 rounded accent-primary" /><span>New action item</span></label></div>'

const CODE_BLOCK_HTML =
  '<pre class="bg-surface-subtle text-on-surface p-unit-md rounded-lg font-mono text-sm overflow-x-auto shadow-inner my-2"># Enter your code here...</pre>'

const TABLE_HTML =
  '<table class="w-full my-4 text-left text-sm"><thead><tr class="bg-surface-container-high text-on-surface"><th class="p-2 rounded-tl">Param</th><th class="p-2">Type</th><th class="p-2 rounded-tr">Description</th></tr></thead><tbody><tr class="bg-surface-container-lowest"><td class="p-2 font-mono">key</td><td class="p-2">string</td><td class="p-2">Description</td></tr></tbody></table>'

export default function NoteEditor({ note, onSave, onDelete, onTogglePin, onToggleArchive }) {
  const richEditorRef = useRef(null)
  const [title, setTitle] = useState(note?.title ?? '')
  const [contentHtml, setContentHtml] = useState(note?.contentHtml ?? '')
  const [isSourceMode, setIsSourceMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    setTitle(note?.title ?? '')
    setContentHtml(note?.contentHtml ?? '')
    setIsSourceMode(false)
    setSaveStatus('saved')
    if (richEditorRef.current) {
      richEditorRef.current.innerHTML = note?.contentHtml ?? ''
    }
  }, [note?.id])

  const commitSave = async (nextTitle, nextContentHtml) => {
    try {
      await onSave(note.id, { title: nextTitle, contentHtml: nextContentHtml })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  const handleTitleChange = (event) => {
    setTitle(event.target.value)
    setSaveStatus('dirty')
  }

  const handleRichInput = () => {
    setContentHtml(richEditorRef.current.innerHTML)
    setSaveStatus('dirty')
  }

  const handleSourceChange = (event) => {
    setContentHtml(event.target.value)
    setSaveStatus('dirty')
  }

  const exec = (command, value = null) => {
    richEditorRef.current?.focus()
    document.execCommand(command, false, value)
    handleRichInput()
  }

  const toggleSourceMode = () => {
    if (isSourceMode) {
      if (richEditorRef.current) richEditorRef.current.innerHTML = contentHtml
    }
    setIsSourceMode((value) => !value)
  }

  const handleManualSave = () => {
    setSaveStatus('saving')
    commitSave(title, contentHtml)
  }

  const handleDiscard = () => {
    setTitle(note.title)
    setContentHtml(note.contentHtml)
    if (richEditorRef.current) richEditorRef.current.innerHTML = note.contentHtml
    setSaveStatus('saved')
  }

  const handleInsertLink = () => {
    const url = window.prompt('Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center gap-unit-sm rounded-xl bg-surface-container-lowest p-unit-xl text-center shadow-md lg:col-span-8">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">note_stack</span>
        <p className="text-body-lg text-on-surface-variant">Select a note from the list, or create a new one.</p>
      </div>
    )
  }

  const canSave = saveStatus === 'dirty' || saveStatus === 'error'

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-md lg:col-span-8">
      <div className="flex flex-wrap items-center justify-between gap-unit-sm bg-surface-subtle px-unit-lg py-4">
        <div className="flex items-center gap-unit-xs text-on-surface-variant">
          <span
            className={`material-symbols-outlined text-[16px] ${
              saveStatus === 'error'
                ? 'text-error'
                : saveStatus === 'dirty'
                  ? 'text-status-pending'
                  : 'text-primary-container'
            }`}
          >
            {saveStatus === 'saving'
              ? 'sync'
              : saveStatus === 'error'
                ? 'error'
                : saveStatus === 'dirty'
                  ? 'edit'
                  : 'check_circle'}
          </span>
          <span
            className={`text-label-md font-medium ${
              saveStatus === 'error' ? 'text-error' : saveStatus === 'dirty' ? 'text-status-pending' : 'text-on-surface'
            }`}
          >
            {saveStatus === 'saving'
              ? 'Saving changes...'
              : saveStatus === 'error'
                ? "Couldn't save — try again"
                : saveStatus === 'dirty'
                  ? 'Unsaved changes'
                  : 'All changes saved'}
          </span>
          {note.archived && (
            <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-md font-bold text-on-surface-variant">
              Archived
            </span>
          )}
        </div>
        <div className="flex items-center gap-unit-xs">
          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            title={note.pinned ? 'Unpin note' : 'Pin note'}
            className={`rounded-lg p-2 transition-colors hover:bg-surface-container ${
              note.pinned ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]" data-weight={note.pinned ? 'fill' : undefined}>
              keep
            </span>
          </button>
          <button
            type="button"
            onClick={() => onToggleArchive(note.id)}
            title={note.archived ? 'Unarchive note' : 'Archive note'}
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[24px]">
              {note.archived ? 'unarchive' : 'archive'}
            </span>
          </button>
          <button
            type="button"
            onClick={toggleSourceMode}
            title="Toggle Code / Visual view"
            className={`flex items-center gap-2 rounded-lg px-2 py-2 text-label-bold font-bold transition-colors ${
              isSourceMode ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            <span className="hidden sm:inline">&lt; / &gt; HTML Source</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            title="Delete note"
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
          >
            <span className="material-symbols-outlined text-[24px]">delete</span>
          </button>
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!canSave}
            className="flex items-center gap-2 rounded-lg bg-primary-container px-unit-md py-2 text-label-bold font-bold text-on-primary shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Save Note
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-unit-sm p-unit-lg">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title..."
          className="w-full bg-transparent font-[var(--font-headline)] text-headline-md text-on-surface outline-none placeholder:text-on-surface-variant/40"
        />
        <span className="text-label-md text-on-surface-variant">
          Last modified: <strong className="font-medium text-on-surface">{formatFullTimestamp(note.updatedAt)}</strong>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-surface-container-low px-unit-lg py-2 text-on-surface-variant select-none">
        <div className="flex items-center gap-0.5 rounded-lg bg-surface-container-lowest p-2 shadow-sm">
          {[
            ['format_bold', 'bold', 'Bold'],
            ['format_italic', 'italic', 'Italic'],
            ['format_underlined', 'underline', 'Underline'],
            ['format_strikethrough', 'strikeThrough', 'Strikethrough'],
          ].map(([icon, command, label]) => (
            <button
              key={command}
              type="button"
              title={label}
              onMouseDown={(event) => {
                event.preventDefault()
                exec(command)
              }}
              className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center rounded-lg bg-surface-container-lowest px-2 py-2 shadow-sm">
          <select
            defaultValue="p"
            onChange={(event) => exec('formatBlock', `<${event.target.value}>`)}
            className="cursor-pointer bg-transparent text-label-bold font-bold text-on-surface outline-none"
          >
            <option value="p">Normal Text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg bg-surface-container-lowest p-2 shadow-sm">
          <button
            type="button"
            title="Bulleted List"
            onMouseDown={(event) => {
              event.preventDefault()
              exec('insertUnorderedList')
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
          </button>
          <button
            type="button"
            title="Numbered List"
            onMouseDown={(event) => {
              event.preventDefault()
              exec('insertOrderedList')
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">format_list_numbered</span>
          </button>
          <button
            type="button"
            title="Checklist"
            onMouseDown={(event) => {
              event.preventDefault()
              exec('insertHTML', CHECKLIST_HTML)
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">checklist</span>
          </button>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg bg-surface-container-lowest p-2 shadow-sm">
          <button
            type="button"
            title="Blockquote"
            onMouseDown={(event) => {
              event.preventDefault()
              exec('formatBlock', '<blockquote>')
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">format_quote</span>
          </button>
          <button
            type="button"
            title="Code Block"
            onMouseDown={(event) => {
              event.preventDefault()
              exec('insertHTML', CODE_BLOCK_HTML)
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
          </button>
          <button
            type="button"
            title="Hyperlink"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleInsertLink}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
          </button>
          <button
            type="button"
            title="Insert Table"
            onMouseDown={(event) => {
              event.preventDefault()
              exec('insertHTML', TABLE_HTML)
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">table_chart</span>
          </button>
          <button
            type="button"
            title="Horizontal Divider"
            onMouseDown={(event) => {
              event.preventDefault()
              exec('insertHorizontalRule')
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">horizontal_rule</span>
          </button>
        </div>
      </div>

      <div className="relative min-h-[384px] flex-1 p-unit-lg">
        <div
          ref={richEditorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleRichInput}
          className={`flex flex-col gap-unit-md text-body-lg leading-relaxed text-on-surface outline-none [&_blockquote]:rounded-r-lg [&_blockquote]:bg-surface-container-low [&_blockquote]:p-unit-md [&_blockquote]:text-on-surface-variant [&_blockquote]:italic [&_h1]:text-headline-md [&_h1]:font-bold [&_h2]:text-headline-sm [&_h2]:font-bold [&_h3]:text-headline-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-subtle [&_pre]:p-unit-md [&_pre]:font-mono [&_pre]:text-sm [&_pre]:shadow-inner [&_table]:w-full [&_ul]:list-disc [&_ul]:pl-6 ${
            isSourceMode ? 'hidden' : ''
          }`}
        />
        <textarea
          value={contentHtml}
          onChange={handleSourceChange}
          className={`min-h-[384px] w-full resize-y rounded-lg bg-inverse-surface p-unit-md font-mono text-sm text-inverse-on-surface outline-none ${
            isSourceMode ? '' : 'hidden'
          }`}
        />
      </div>

      <div className="flex flex-col items-center justify-between gap-unit-md bg-surface-subtle px-unit-lg py-unit-md sm:flex-row">
        <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>{countWords(contentHtml)} words</span>
          <span>•</span>
          <span>{countChars(contentHtml)} characters</span>
          <span>•</span>
          <span className="rounded bg-surface-container-high px-2 py-0.5 font-mono text-xs text-on-surface">
            HTML formatted
          </span>
        </div>
        <div className="flex w-full items-center gap-unit-sm sm:w-auto">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!canSave}
            className="flex-1 rounded-lg bg-surface-container-low px-unit-md py-2 text-label-bold font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!canSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-container px-unit-lg py-2 text-label-bold font-bold text-on-primary shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            Save Note
          </button>
        </div>
      </div>

      {isDeleteConfirmOpen && (
        <ConfirmDialog
          title="Delete this note?"
          description={`"${note.title || 'Untitled Note'}" will be permanently deleted. This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmIcon="delete"
          onConfirm={() => {
            setIsDeleteConfirmOpen(false)
            onDelete(note.id)
          }}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  )
}
