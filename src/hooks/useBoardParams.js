import { useSearchParams } from 'react-router-dom'

// A task board's filters (tab, search, owner, page...) live in the URL, so leaving the board (to create
// a task, open one, or follow a link) and coming back restores the same view. Returns [get, set];
// `set` takes { key: value } updates, drops empty values, and resets to page 1 unless `page` is being set.
export const useBoardParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const get = (key) => searchParams.get(key)
  const set = (updates) =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (!('page' in updates)) next.delete('page')
        for (const [key, value] of Object.entries(updates)) {
          if (value == null || value === '' || (key === 'page' && value === 1)) next.delete(key)
          else next.set(key, String(value))
        }
        return next
      },
      { replace: true },
    )
  return [get, set]
}
