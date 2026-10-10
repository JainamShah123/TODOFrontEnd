import StarterKit from '@tiptap/starter-kit'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extensions'

// The editor's formatting set. The API keeps exactly these tags (see TODOBackEnd/src/utils/richText.js),
// so anything added here needs adding there too.
export const richTextExtensions = ({ placeholder, onReadOnlyChecked } = {}) => [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    codeBlock: false,
    horizontalRule: false,
    link: false,
  }),
  TaskList,
  TaskItem.configure({ nested: true, onReadOnlyChecked }),
  ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
]
