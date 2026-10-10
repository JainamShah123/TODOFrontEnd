import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { richTextExtensions } from '@/features/tasks/components/richTextExtensions'
import { toEditorHtml } from '@/features/tasks/utils/richText'

const TOOLS = [
  { icon: 'format_bold', label: 'Bold (Ctrl+B)', mark: 'bold', run: (chain) => chain.toggleBold() },
  {
    icon: 'format_italic',
    label: 'Italic (Ctrl+I)',
    mark: 'italic',
    run: (chain) => chain.toggleItalic(),
  },
  {
    icon: 'format_underlined',
    label: 'Underline (Ctrl+U)',
    mark: 'underline',
    run: (chain) => chain.toggleUnderline(),
  },
  {
    icon: 'strikethrough_s',
    label: 'Strikethrough',
    mark: 'strike',
    run: (chain) => chain.toggleStrike(),
  },
  null,
  {
    icon: 'title',
    label: 'Heading',
    mark: 'heading',
    run: (chain) => chain.toggleHeading({ level: 3 }),
  },
  {
    icon: 'format_list_bulleted',
    label: 'Bullet list',
    mark: 'bulletList',
    run: (chain) => chain.toggleBulletList(),
  },
  {
    icon: 'format_list_numbered',
    label: 'Numbered list',
    mark: 'orderedList',
    run: (chain) => chain.toggleOrderedList(),
  },
  {
    icon: 'checklist',
    label: 'Checklist',
    mark: 'taskList',
    run: (chain) => chain.toggleTaskList(),
  },
]

// Rich text description: bold / italic / underline / strike, a heading, lists and a tickable checklist.
// `value` and `onChange` are HTML strings, so it plugs into a react-hook-form Controller.
export default function RichTextEditor({ id, value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: richTextExtensions({ placeholder }),
    content: toEditorHtml(value),
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? '' : current.getHTML()),
    editorProps: {
      attributes: {
        id,
        class: 'rich-text min-h-[140px] px-4 py-3 focus:outline-none',
      },
    },
  })

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      Object.fromEntries(
        TOOLS.filter(Boolean).map((tool) => [tool.mark, current?.isActive(tool.mark) ?? false]),
      ),
  })

  return (
    <div className="overflow-hidden rounded-lg border border-border-light bg-surface-container-lowest transition-shadow focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/30">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border-light bg-surface-subtle px-2 py-1">
        {TOOLS.map((tool, index) =>
          tool ? (
            <button
              key={tool.mark}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={active?.[tool.mark]}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => tool.run(editor.chain().focus()).run()}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                active?.[tool.mark]
                  ? 'bg-primary-container/15 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
            </button>
          ) : (
            <span key={`divider-${index}`} className="mx-1 h-5 w-px bg-border-light" />
          ),
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
