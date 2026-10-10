// Task descriptions are rich text HTML from the editor. Older ones are plain text, so turn those into
// paragraphs (escaped) before handing them to the editor.
const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const toEditorHtml = (description) => {
  if (!description) return ''
  if (/^\s*</.test(description)) return description
  return description
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('')
}

// { done, total } for the description's checklist items, or null when it has no checklist.
export const checklistProgress = (description) => {
  if (!description || !description.includes('taskItem')) return null
  const items = new DOMParser()
    .parseFromString(description, 'text/html')
    .querySelectorAll('li[data-type="taskItem"]')
  if (items.length === 0) return null
  const done = [...items].filter((item) => item.getAttribute('data-checked') === 'true').length
  return { done, total: items.length }
}
