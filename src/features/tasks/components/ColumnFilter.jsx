import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const POPOVER_WIDTH = 288

// A spreadsheet-style column header filter: the header opens a popover with sort buttons, a search box
// and a checkbox per value (with how many tasks have it). `selected` is the list of ticked values, or
// null for "no filter" (everything ticked). Applying with everything ticked clears the filter again.
// `options` are { value, label, count, swatch? }; `sort` is { asc, desc, current, onChange } or omitted.
// Without `onApply` there is no value list. `choices` ({ options: [{ value, label }], current, onChange })
// adds a pick-one list instead, such as the Due column's date ranges; value null is "any".
export default function ColumnFilter({
  label,
  options = [],
  selected,
  onApply,
  sort,
  choices,
  isLoading = false,
  align = 'left',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)
  const isFiltered = (Boolean(onApply) && selected != null) || Boolean(choices?.current)
  const isSorted = sort && (sort.current === sort.asc || sort.current === sort.desc)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`group inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase transition-colors hover:bg-surface-container ${
          isFiltered ? 'text-primary' : ''
        }`}
      >
        {label}
        {isSorted && (
          <span className="material-symbols-outlined text-[14px]">
            {sort.current === sort.asc ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
        <span className="material-symbols-outlined text-[16px] opacity-60 group-hover:opacity-100">
          {isFiltered ? 'filter_alt' : onApply || choices ? 'arrow_drop_down' : 'swap_vert'}
        </span>
      </button>
      {isOpen && (
        <FilterPopover
          anchorRef={buttonRef}
          label={label}
          options={options}
          selected={selected}
          sort={sort}
          choices={choices}
          isLoading={isLoading}
          align={align}
          onClose={() => setIsOpen(false)}
          filterable={Boolean(onApply)}
          onApply={(value) => {
            onApply(value)
            setIsOpen(false)
          }}
        />
      )}
    </>
  )
}

function FilterPopover({
  anchorRef,
  label,
  options,
  selected,
  sort,
  choices,
  isLoading,
  align,
  filterable,
  onClose,
  onApply,
}) {
  const popoverRef = useRef(null)
  const [position, setPosition] = useState(null)
  const [query, setQuery] = useState('')
  // Values ticked so far; nothing changes on the board until Apply.
  const [ticked, setTicked] = useState(
    () => new Set(selected ?? options.map((option) => option.value)),
  )
  // Options can arrive after the popover opens; with no filter set, those start ticked too.
  const [seeded, setSeeded] = useState(options.length > 0 || selected != null)
  if (!seeded && options.length > 0) {
    setSeeded(true)
    setTicked(new Set(options.map((option) => option.value)))
  }

  // A filtered value that no longer appears in the data still shows, so it can be unticked.
  const allOptions = useMemo(() => {
    const known = new Set(options.map((option) => option.value))
    const missing = (selected ?? [])
      .filter((value) => !known.has(value))
      .map((value) => ({ value, label: value, count: 0 }))
    return [...options, ...missing]
  }, [options, selected])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle
      ? allOptions.filter((option) => String(option.label).toLowerCase().includes(needle))
      : allOptions
  }, [allOptions, query])

  const allVisibleTicked = visible.length > 0 && visible.every((option) => ticked.has(option.value))

  useLayoutEffect(() => {
    const rect = anchorRef.current.getBoundingClientRect()
    const left = align === 'right' ? rect.right - POPOVER_WIDTH : rect.left
    setPosition({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8)),
    })
  }, [anchorRef, align])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!popoverRef.current?.contains(event.target) && !anchorRef.current?.contains(event.target))
        onClose()
    }
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    // The popover is fixed to where the header was, so it closes rather than drift when the page moves.
    const onScroll = (event) => !popoverRef.current?.contains(event.target) && onClose()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onClose)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onClose)
    }
  }, [anchorRef, onClose])

  const toggle = (value) =>
    setTicked((previous) => {
      const next = new Set(previous)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })

  const toggleAllVisible = () =>
    setTicked((previous) => {
      const next = new Set(previous)
      visible.forEach((option) =>
        allVisibleTicked ? next.delete(option.value) : next.add(option.value),
      )
      return next
    })

  const apply = () => {
    const everything = allOptions.every((option) => ticked.has(option.value))
    onApply(
      everything
        ? null
        : allOptions.filter((option) => ticked.has(option.value)).map((option) => option.value),
    )
  }

  if (!position) return null

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Filter ${label}`}
      style={{ top: position.top, left: position.left, width: POPOVER_WIDTH }}
      className="fixed z-50 flex max-h-[min(480px,70vh)] flex-col rounded-lg border border-border-light bg-surface-container-lowest text-[14px] font-normal tracking-normal text-on-surface normal-case shadow-xl"
    >
      {sort && (
        <div
          className={`flex flex-col p-1 ${filterable || choices ? 'border-b border-border-light' : ''}`}
        >
          {[
            { value: sort.asc, icon: 'arrow_upward', text: 'Sort A → Z' },
            { value: sort.desc, icon: 'arrow_downward', text: 'Sort Z → A' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                sort.onChange(sort.current === item.value ? null : item.value)
                onClose()
              }}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-surface-subtle ${
                sort.current === item.value ? 'font-bold text-primary' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.text}
              {sort.current === item.value && (
                <span className="material-symbols-outlined ml-auto text-[18px]">check</span>
              )}
            </button>
          ))}
        </div>
      )}
      {choices && (
        <div className="flex flex-col p-1">
          {choices.options.map((item) => (
            <button
              key={item.value ?? 'any'}
              type="button"
              onClick={() => {
                choices.onChange(item.value)
                onClose()
              }}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-surface-subtle ${
                (choices.current ?? null) === item.value ? 'font-bold text-primary' : ''
              }`}
            >
              {item.label}
              {(choices.current ?? null) === item.value && (
                <span className="material-symbols-outlined ml-auto text-[18px]">check</span>
              )}
            </button>
          ))}
        </div>
      )}
      {filterable && (
        <>
          <div className="p-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              autoFocus
              className="h-8 w-full rounded border border-border-light bg-surface-container-lowest px-2 focus:border-primary-container focus:outline-none"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1">
            {isLoading && options.length === 0 ? (
              <p className="px-2 py-3 text-on-surface-variant">Loading…</p>
            ) : visible.length === 0 ? (
              <p className="px-2 py-3 text-on-surface-variant">No matching values.</p>
            ) : (
              <>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 font-bold hover:bg-surface-subtle">
                  <input
                    type="checkbox"
                    checked={allVisibleTicked}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 accent-primary"
                  />
                  {query ? 'Select all results' : 'Select all'}
                </label>
                {visible.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-subtle"
                  >
                    <input
                      type="checkbox"
                      checked={ticked.has(option.value)}
                      onChange={() => toggle(option.value)}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    {option.swatch && (
                      <span className={`h-2 w-2 shrink-0 rounded-full ${option.swatch}`} />
                    )}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <span className="text-on-surface-variant tabular-nums">{option.count}</span>
                  </label>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border-light p-2">
            <button
              type="button"
              onClick={() => onApply(null)}
              className="rounded px-3 py-1.5 font-bold text-on-surface-variant hover:bg-surface-subtle"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={ticked.size === 0}
              className="rounded bg-primary-container px-3 py-1.5 font-bold text-on-primary hover:bg-primary disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}
