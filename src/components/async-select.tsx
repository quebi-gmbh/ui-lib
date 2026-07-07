"use client"

import { Check, ChevronDown, Loader2, X } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { useAsyncList } from "react-stately"
import { PopoverContent } from "@/components/popover"
import { cn } from "@/lib/utils"

/**
 * Async Select — quebi design system
 *
 * A single-value combobox whose options are loaded from a remote source. The
 * input is the one focus/click target: focusing or typing opens the dropdown
 * and re-queries the source live (debounced), and scrolling the results loads
 * the next page. Picking an option commits it, shows its label in the input,
 * and closes the menu; a trailing ✕ clears the selection. Built as an ARIA 1.2
 * combobox with `aria-activedescendant` keyboard navigation over the results
 * listbox.
 */

export interface AsyncSelectOption {
  id: string | number
  name: string
}

export interface AsyncSelectLoadParams {
  /** Current search string; empty on the initial page. */
  search: string
  /** Opaque pagination cursor returned by the previous page, if any. */
  cursor?: string
  /** Aborted automatically when a newer request supersedes this one. */
  signal: AbortSignal
}

export interface AsyncSelectLoadResult<T> {
  items: T[]
  /** Return a cursor to enable "load more" on scroll; omit when exhausted. */
  cursor?: string
}

export interface AsyncSelectProps<T extends AsyncSelectOption> {
  /** Loads a page of options for a given search string / cursor. */
  load: (params: AsyncSelectLoadParams) => Promise<AsyncSelectLoadResult<T>>
  /** Controlled selection (a full option object, so the input can show its label). */
  value?: T | null
  /** Uncontrolled initial selection. */
  defaultValue?: T | null
  onChange?: (value: T | null) => void
  placeholder?: string
  /** Debounce (ms) before a keystroke re-queries the source. */
  searchDelay?: number
  isDisabled?: boolean
  isInvalid?: boolean
  /** When set, the selection is mirrored into a hidden input for form submission. */
  name?: string
  className?: string
  id?: string
  "aria-label"?: string
}

const keyOf = (option: AsyncSelectOption) => String(option.id)

export function AsyncSelect<T extends AsyncSelectOption>({
  load,
  value,
  defaultValue,
  onChange,
  placeholder = "Select…",
  searchDelay = 250,
  isDisabled,
  isInvalid,
  name,
  className,
  id,
  "aria-label": ariaLabel = "Select an item",
}: AsyncSelectProps<T>) {
  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const optionId = (key: string) => `${reactId}-opt-${key}`

  const containerRef = useRef<HTMLDivElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [open, setOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const list = useAsyncList<T>({
    async load({ signal, cursor, filterText }) {
      const result = await load({ search: filterText ?? "", cursor, signal })
      return { items: result.items, cursor: result.cursor }
    },
  })

  const isControlled = value !== undefined
  const [internal, setInternal] = useState<T | null>(defaultValue ?? null)
  const selected = isControlled ? (value ?? null) : internal
  const selectedName = selected?.name ?? ""

  // The input shows the committed selection's label while closed, and free
  // search text while open.
  const [inputValue, setInputValue] = useState<string>(() => (value ?? defaultValue)?.name ?? "")

  // Whenever the menu is closed, the input reflects the committed selection —
  // this reverts any abandoned search text and tracks controlled changes.
  useEffect(() => {
    if (!open) setInputValue(selectedName)
  }, [open, selectedName])

  const openMenu = () => {
    if (!isDisabled) setOpen(true)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setActiveKey(null)
  }

  const runSearch = (text: string) => {
    setInputValue(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => list.setFilterText(text), searchDelay)
  }

  const commit = (next: T | null) => {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  const selectKey = (key: string) => {
    const item = list.items.find((i) => keyOf(i) === key)
    if (!item) return
    commit(item)
    setActiveKey(null)
    setOpen(false) // the close effect sets inputValue to the new label
  }

  const clearSelection = () => {
    commit(null)
    setInputValue("")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    list.setFilterText("")
    setActiveKey(null)
    inputRef.current?.focus()
    setOpen(true)
  }

  // Keep the keyboard-highlighted option valid as the list filters/paginates.
  useEffect(() => {
    if (!open) return
    if (list.items.length === 0) {
      setActiveKey(null)
      return
    }
    setActiveKey((prev) =>
      prev && list.items.some((i) => keyOf(i) === prev) ? prev : keyOf(list.items[0]),
    )
  }, [open, list.items])

  // Scroll the active option into view during keyboard navigation.
  useEffect(() => {
    if (!open || !activeKey) return
    document.getElementById(`${reactId}-opt-${activeKey}`)?.scrollIntoView({ block: "nearest" })
  }, [activeKey, open, reactId])

  // Close on outside press. The popover is non-modal (so focus stays in the
  // input), which means react-aria's usePopover runs with isDismissable=false
  // and won't dismiss on outside interaction — so we own that here. Capture
  // phase runs before any child handler that might stop propagation.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (containerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
      setActiveKey(null)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [open])

  const moveActive = (dir: 1 | -1) => {
    const items = list.items
    if (items.length === 0) return
    const idx = activeKey ? items.findIndex((i) => keyOf(i) === activeKey) : -1
    const nextIdx = idx === -1 ? (dir === 1 ? 0 : items.length - 1) : (idx + dir + items.length) % items.length
    setActiveKey(keyOf(items[nextIdx]))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (open) moveActive(1)
        else openMenu()
        break
      case "ArrowUp":
        e.preventDefault()
        if (open) moveActive(-1)
        else openMenu()
        break
      case "Enter":
        if (open && activeKey) {
          e.preventDefault()
          selectKey(activeKey)
        }
        break
      case "Escape":
        if (open) {
          e.preventDefault()
          handleOpenChange(false)
        }
        break
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceToBottom < 60 && list.items.length > 0 && list.loadingState === "idle") {
      list.loadMore()
    }
  }

  const isLoading = list.loadingState === "loading" || list.loadingState === "filtering"

  return (
    <div className={cn("w-full", className)}>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: the control surface forwards bare-surface clicks to the combobox input; all real semantics live on the input/options */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          // Clicking the bare surface (padding/chevron) — not the ✕ or the input
          // — focuses the input without stealing it from those controls.
          if (e.target === e.currentTarget && !isDisabled) {
            e.preventDefault()
            inputRef.current?.focus()
            openMenu()
          }
        }}
        data-invalid={isInvalid || undefined}
        className={cn(
          "flex w-full items-center gap-1 rounded-quebi-sm border border-cyan-500/10 bg-white/[0.02] p-1.5 pe-2",
          "transition-colors duration-150 focus-within:border-quebi-brand",
          isInvalid && "border-red-500",
          isDisabled ? "cursor-not-allowed opacity-50" : "cursor-text",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          // biome-ignore lint/a11y/useSemanticElements: ARIA 1.2 combobox is authored on the text input
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && activeKey ? optionId(activeKey) : undefined}
          aria-label={ariaLabel}
          aria-invalid={isInvalid || undefined}
          disabled={isDisabled}
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => {
            runSearch(e.target.value)
            openMenu()
          }}
          onFocus={(e) => {
            e.currentTarget.select()
            openMenu()
          }}
          onClick={openMenu}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-1.5 py-0.5 text-sm text-white outline-none",
            "placeholder:text-quebi-fg-subtle placeholder:italic",
          )}
        />

        {selected && !isDisabled && (
          <button
            type="button"
            aria-label="Clear selection"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              clearSelection()
            }}
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full text-quebi-fg-subtle outline-none transition-colors duration-150",
              "hover:bg-cyan-500/10 hover:text-white focus-visible:ring-2 focus-visible:ring-quebi-brand/50",
            )}
          >
            <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}

        <ChevronDown
          aria-hidden="true"
          className={cn(
            "pointer-events-none size-4 shrink-0 text-quebi-fg-subtle transition-transform duration-150",
            open && "rotate-180",
          )}
        />
      </div>

      <PopoverContent
        ref={popoverRef}
        triggerRef={containerRef}
        isOpen={open && !isDisabled}
        onOpenChange={handleOpenChange}
        isNonModal
        placement="bottom start"
        className="w-(--trigger-width) p-0"
      >
        <div
          // biome-ignore lint/a11y/useFocusableInteractive: the listbox uses virtual focus via the combobox input's aria-activedescendant
          role="listbox"
          id={listboxId}
          aria-label={ariaLabel}
          onScroll={handleScroll}
          className="quebi-scrollbar max-h-72 overflow-y-auto overscroll-contain p-1"
        >
          {list.items.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-quebi-fg-subtle text-sm">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading…
                </>
              ) : (
                "No results"
              )}
            </div>
          ) : (
            list.items.map((item) => {
              const k = keyOf(item)
              const isSel = selected ? keyOf(selected) === k : false
              const isActive = activeKey === k
              return (
                // biome-ignore lint/a11y/useFocusableInteractive: options use virtual focus via the combobox input's aria-activedescendant
                // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled centrally on the combobox input (Enter selects the active option)
                <div
                  key={k}
                  id={optionId(k)}
                  role="option"
                  aria-selected={isSel}
                  // Keep focus in the input while clicking an option.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveKey(k)}
                  onClick={() => selectKey(k)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-quebi-sm px-2.5 py-1.5 text-sm text-white outline-none transition-colors duration-150",
                    isActive && "bg-white/[0.05]",
                    isSel && "text-quebi-brand",
                  )}
                >
                  <Check
                    className={cn("size-4 shrink-0", isSel ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                </div>
              )
            })
          )}
          {list.loadingState === "loadingMore" && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="size-4 animate-spin text-quebi-fg-subtle" aria-hidden="true" />
            </div>
          )}
        </div>
      </PopoverContent>

      {name && (
        <input type="hidden" name={name} value={selected ? keyOf(selected) : ""} />
      )}
    </div>
  )
}
