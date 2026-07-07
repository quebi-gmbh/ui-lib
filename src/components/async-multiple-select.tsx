"use client"

import { Check, Loader2, X } from "lucide-react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useAsyncList } from "react-stately"
import { PopoverContent } from "@/components/popover"
import { cn } from "@/lib/utils"

/**
 * Async Multiple Select — quebi design system
 *
 * A tokenizer combobox whose options are loaded from a remote source. Selected
 * values render as removable chips *inline* with a single text input — the input
 * is the one focus/click target: focusing or typing opens the dropdown and
 * re-queries the source live (debounced), and scrolling the results loads the
 * next page. There is no separate search box and no add button, so nothing
 * double-fires; removing a chip (✕ or Backspace on an empty input) never opens
 * the menu. Built as an ARIA 1.2 combobox with `aria-activedescendant` keyboard
 * navigation over the results listbox.
 */

export interface AsyncMultipleSelectOption {
  id: string | number
  name: string
}

export interface AsyncMultipleSelectLoadParams {
  /** Current search string; empty on the initial page. */
  search: string
  /** Opaque pagination cursor returned by the previous page, if any. */
  cursor?: string
  /** Aborted automatically when a newer request supersedes this one. */
  signal: AbortSignal
}

export interface AsyncMultipleSelectLoadResult<T> {
  items: T[]
  /** Return a cursor to enable "load more" on scroll; omit when exhausted. */
  cursor?: string
}

export interface AsyncMultipleSelectProps<T extends AsyncMultipleSelectOption> {
  /** Loads a page of options for a given search string / cursor. */
  load: (params: AsyncMultipleSelectLoadParams) => Promise<AsyncMultipleSelectLoadResult<T>>
  /** Controlled selection (full option objects, so chips can render labels). */
  value?: T[]
  /** Uncontrolled initial selection. */
  defaultValue?: T[]
  onChange?: (value: T[]) => void
  placeholder?: string
  /** Debounce (ms) before a keystroke re-queries the source. */
  searchDelay?: number
  isDisabled?: boolean
  isInvalid?: boolean
  /** When set, the selection is mirrored into hidden inputs for form submission. */
  name?: string
  className?: string
  id?: string
  "aria-label"?: string
}

const keyOf = (option: AsyncMultipleSelectOption) => String(option.id)
const toMap = <T extends AsyncMultipleSelectOption>(items: T[]) =>
  new Map(items.map((item) => [keyOf(item), item]))

export function AsyncMultipleSelect<T extends AsyncMultipleSelectOption>({
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
  "aria-label": ariaLabel = "Select items",
}: AsyncMultipleSelectProps<T>) {
  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const optionId = (key: string) => `${reactId}-opt-${key}`

  const containerRef = useRef<HTMLDivElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const list = useAsyncList<T>({
    async load({ signal, cursor, filterText }) {
      const result = await load({ search: filterText ?? "", cursor, signal })
      return { items: result.items, cursor: result.cursor }
    },
  })

  // Selection is tracked as a map of full option objects so chips stay labelled
  // even when the option scrolls out of the currently loaded page.
  const isControlled = value !== undefined
  const [internal, setInternal] = useState<Map<string, T>>(() => toMap(defaultValue ?? []))
  const selected = isControlled ? toMap(value ?? []) : internal
  const selectedItems = useMemo(() => Array.from(selected.values()), [selected])

  const commit = (next: Map<string, T>) => {
    if (!isControlled) setInternal(next)
    onChange?.(Array.from(next.values()))
  }

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

  const toggle = (key: string) => {
    const next = new Map(selected)
    if (next.has(key)) {
      next.delete(key)
    } else {
      const item = list.items.find((i) => keyOf(i) === key)
      if (item) next.set(key, item)
    }
    commit(next)
  }

  const removeKey = (key: string) => {
    if (!selected.has(key)) return
    const next = new Map(selected)
    next.delete(key)
    commit(next)
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
          toggle(activeKey)
        }
        break
      case "Escape":
        if (open) {
          e.preventDefault()
          handleOpenChange(false)
        }
        break
      case "Backspace":
        if (inputValue === "" && selectedItems.length > 0) {
          e.preventDefault()
          removeKey(keyOf(selectedItems[selectedItems.length - 1]))
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
          // Clicking the bare surface (padding) — not a chip, ✕, or the input —
          // focuses the input without stealing it from those controls.
          if (e.target === e.currentTarget && !isDisabled) {
            e.preventDefault()
            inputRef.current?.focus()
            openMenu()
          }
        }}
        data-invalid={isInvalid || undefined}
        className={cn(
          "flex w-full flex-wrap items-center gap-1.5 rounded-quebi-sm border border-cyan-500/10 bg-white/[0.02] p-1.5",
          "transition-colors duration-150 focus-within:border-quebi-brand",
          isInvalid && "border-red-500",
          isDisabled ? "cursor-not-allowed opacity-50" : "cursor-text",
        )}
      >
        {selectedItems.map((item) => {
          const k = keyOf(item)
          return (
            <span
              key={k}
              data-slot="chip"
              className="inline-flex items-center gap-x-1 rounded-full border border-cyan-500/10 bg-white/[0.03] py-0.5 pe-1 ps-2.5 font-medium text-quebi-fg-muted text-xs"
            >
              {item.name}
              {!isDisabled && (
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  tabIndex={-1}
                  // Keep focus in the input so removing a chip never opens/closes
                  // the menu or blurs the field.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeKey(k)
                  }}
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-quebi-fg-subtle outline-none transition-colors duration-150",
                    "hover:bg-cyan-500/10 hover:text-white focus-visible:ring-2 focus-visible:ring-quebi-brand/50",
                  )}
                >
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                </button>
              )}
            </span>
          )
        })}

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
          placeholder={selectedItems.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            runSearch(e.target.value)
            openMenu()
          }}
          onFocus={openMenu}
          onClick={openMenu}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-w-24 flex-1 bg-transparent px-1.5 py-0.5 text-sm text-white outline-none",
            "placeholder:text-quebi-fg-subtle placeholder:italic",
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
          aria-multiselectable="true"
          aria-label={ariaLabel}
          onScroll={handleScroll}
          className="max-h-72 overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:size-0.5"
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
              const isSel = selected.has(k)
              const isActive = activeKey === k
              return (
                // biome-ignore lint/a11y/useFocusableInteractive: options use virtual focus via the combobox input's aria-activedescendant
                // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled centrally on the combobox input (Enter toggles the active option)
                <div
                  key={k}
                  id={optionId(k)}
                  role="option"
                  aria-selected={isSel}
                  // Keep focus in the input while clicking an option.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveKey(k)}
                  onClick={() => toggle(k)}
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

      {name &&
        selectedItems.map((item) => (
          <input key={keyOf(item)} type="hidden" name={name} value={keyOf(item)} />
        ))}
    </div>
  )
}
