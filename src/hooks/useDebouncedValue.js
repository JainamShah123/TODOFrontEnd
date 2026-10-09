import { useEffect, useState } from 'react'

// Returns `value` only after it has stopped changing for `delayMs`, so typing in a search box doesn't
// send a request per keystroke.
export const useDebouncedValue = (value, delayMs = 300) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
