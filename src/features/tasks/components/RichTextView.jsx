import { useEffect, useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { richTextExtensions } from '@/features/tasks/components/richTextExtensions'
import { checklistProgress, toEditorHtml } from '@/features/tasks/utils/richText'
import ChecklistProgress from '@/features/tasks/components/ChecklistProgress'

// Read-only description. When `onToggleItem(index, checked)` is given, checklist items can be ticked
// (it should return a promise; the tick is undone if it rejects). Shows checklist progress on top.
export default function RichTextView({ value, onToggleItem }) {
  const html = toEditorHtml(value)
  // The editor's extensions are set up once, so its tick handler reads the latest props from here.
  const [latest] = useState(() => ({}))

  const editor = useEditor({
    editable: false,
    content: html,
    extensions: richTextExtensions({
      onReadOnlyChecked: (node, checked) => {
        if (!latest.onToggleItem || !latest.editor) return false
        let index = -1
        let count = 0
        latest.editor.state.doc.descendants((child) => {
          if (child.type.name !== 'taskItem') return true
          if (child === node) index = count
          count += 1
          return true
        })
        if (index < 0) return false
        Promise.resolve(latest.onToggleItem(index, checked)).catch(() =>
          latest.editor.commands.setContent(latest.html, { emitUpdate: false }),
        )
        return true
      },
    }),
    editorProps: {
      attributes: { class: `rich-text ${onToggleItem ? 'rich-text-tickable' : ''}` },
    },
  })

  useEffect(() => {
    Object.assign(latest, { onToggleItem, html, editor })
  }, [latest, onToggleItem, html, editor])

  // A refetch (or someone else's tick) brings a new description: show it.
  useEffect(() => {
    if (editor && editor.getHTML() !== html) editor.commands.setContent(html, { emitUpdate: false })
  }, [editor, html])

  const progress = useEditorState({
    editor,
    selector: ({ editor: current }) => (current ? checklistProgress(current.getHTML()) : null),
  })

  return (
    <div className="space-y-unit-sm">
      {progress && <ChecklistProgress progress={progress} />}
      <EditorContent editor={editor} />
    </div>
  )
}
