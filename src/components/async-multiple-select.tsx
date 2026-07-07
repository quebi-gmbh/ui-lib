"use client"

import { Loader2, Plus } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import type { Key, Selection } from "react-aria-components"
import { useAsyncList } from "react-stately"
import { Button } from "@/components/button"
import { ListBox, ListBoxItem } from "@/components/list-box"
import { PopoverContent } from "@/components/popover"
import { SearchField, SearchInput } from "@/components/search-field"
import { Tag, TagGroup, TagList } from "@/components/tag-group"
import { cn } from "@/lib/utils"

/**
 * Async Multiple Select — quebi design system
 *
 * A multi-value picker whose options are loaded from a remote source. The
 * dropdown opens on focus and shows the first page of results; typing in the
 * search field re-queries the source live (debounced) and scrolling to the
 * bottom loads the next page. Chosen options render as removable quebi tags —
 * the same control surface as Multiple Select — and out-of-view selections are
 * preserved across searches. Composes Tag Group (selected values), Popover +
 * Search Field + List Box (the dropdown). No apply/cancel — selection is live.
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
  /** Controlled selection (full option objects, so tags can render labels). */
  value?: T[]
  /** Uncontrolled initial selection. */
  defaultValue?: T[]
  onChange?: (value: T[]) => void
  placeholder?: string
  /** Placeholder shown inside the search input. */
  searchPlaceholder?: string
  /** Debounce (ms) before a keystroke re-queries the source. */
  searchDelay?: number
  isDisabled?: boolean
  isInvalid?: boolean
  /** When set, the selection is mirrored into hidden inputs for form submission. */
  name?: string
  className?: string
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
  placeholder = "No selected items",
  searchPlaceholder = "Search…",
  searchDelay = 250,
  isDisabled,
  isInvalid,
  name,
  className,
  "aria-label": ariaLabel = "Select items",
}: AsyncMultipleSelectProps<T>) {
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reopenGuard = useRef(false)
  const [open, setOpen] = useState(false)

  const list = useAsyncList<T>({
    async load({ signal, cursor, filterText }) {
      const result = await load({ search: filterText ?? "", cursor, signal })
      return { items: result.items, cursor: result.cursor }
    },
  })

  // Selection is tracked as a map of full option objects so tags stay labelled
  // even when the option scrolls out of the currently loaded page.
  const isControlled = value !== undefined
  const [internal, setInternal] = useState<Map<string, T>>(() => toMap(defaultValue ?? []))
  const selected = isControlled ? toMap(value ?? []) : internal
  const selectedItems = useMemo(() => Array.from(selected.values()), [selected])

  const commit = (next: Map<string, T>) => {
    if (!isControlled) setInternal(next)
    onChange?.(Array.from(next.values()))
  }

  const openList = () => {
    if (isDisabled || reopenGuard.current) return
    setOpen(true)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      // Focus is restored to the trigger on close — suppress the re-open that
      // the restored focus would otherwise trigger.
      reopenGuard.current = true
      setTimeout(() => {
        reopenGuard.current = false
      }, 150)
    }
  }

  const handleSearchChange = (search: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => list.setFilterText(search), searchDelay)
  }

  const handleSelectionChange = (keys: Selection) => {
    const visibleKeys =
      keys === "all"
        ? new Set(list.items.map(keyOf))
        : new Set(Array.from(keys, (k) => String(k)))
    const next = new Map(selected)
    for (const item of list.items) {
      const k = keyOf(item)
      if (visibleKeys.has(k)) next.set(k, item)
      else next.delete(k)
    }
    commit(next)
  }

  const handleRemove = (keys: Set<Key>) => {
    const next = new Map(selected)
    for (const k of keys) next.delete(String(k))
    commit(next)
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
    <div className={cn("w-full", className)} data-slot="control">
      {/** biome-ignore lint/a11y/useKeyWithClickEvents: focus/press already open the popover; the click only forwards a bare-surface click to the add control */}
      <div
        ref={triggerRef}
        onFocusCapture={openList}
        onClick={openList}
        aria-disabled={isDisabled || undefined}
        data-invalid={isInvalid || undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-quebi-sm border border-cyan-500/10 bg-white/[0.02] p-1.5",
          "transition-colors duration-150 focus-within:border-quebi-brand",
          isInvalid && "border-red-500",
          isDisabled && "cursor-not-allowed opacity-50",
        )}
      >
        <TagGroup
          aria-label={ariaLabel}
          onRemove={isDisabled ? undefined : handleRemove}
          className="flex-1"
        >
          <TagList
            items={selectedItems}
            renderEmptyState={() => (
              <span className="ps-1.5 text-quebi-fg-subtle text-sm italic">{placeholder}</span>
            )}
          >
            {(item) => <Tag>{item.name}</Tag>}
          </TagList>
        </TagGroup>
        <Button
          intent="outline"
          size="sq-xs"
          isCircle
          isDisabled={isDisabled}
          onPress={() => setOpen((o) => !o)}
          className="shrink-0 self-end"
          aria-label="Add item"
        >
          <Plus data-slot="icon" aria-hidden="true" />
        </Button>
      </div>

      <PopoverContent
        triggerRef={triggerRef}
        isOpen={open}
        onOpenChange={handleOpenChange}
        placement="bottom"
        className="flex w-(--trigger-width) flex-col p-0"
      >
        <SearchField
          autoFocus
          aria-label={ariaLabel}
          onChange={handleSearchChange}
          className="border-b border-cyan-500/10"
        >
          <SearchInput
            placeholder={searchPlaceholder}
            className="border-none bg-transparent outline-hidden focus:ring-0"
          />
        </SearchField>
        <ListBox
          aria-label={ariaLabel}
          selectionMode="multiple"
          selectedKeys={new Set(selected.keys())}
          onSelectionChange={handleSelectionChange}
          onScroll={handleScroll}
          items={list.items}
          className="rounded-none border-0 bg-transparent shadow-none"
          renderEmptyState={() => (
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
          )}
        >
          {(item) => <ListBoxItem id={keyOf(item)}>{item.name}</ListBoxItem>}
        </ListBox>
        {list.loadingState === "loadingMore" && (
          <div className="flex items-center justify-center border-t border-cyan-500/10 py-2">
            <Loader2 className="size-4 animate-spin text-quebi-fg-subtle" aria-hidden="true" />
          </div>
        )}
      </PopoverContent>

      {name &&
        selectedItems.map((item) => (
          <input key={keyOf(item)} type="hidden" name={name} value={keyOf(item)} />
        ))}
    </div>
  )
}
