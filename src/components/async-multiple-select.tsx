"use client"

import { useMemo, useRef, useState } from "react"
import { useAsyncList } from "react-stately"
import {
  MultiSelectControl,
  type MultiSelectOption,
  multiSelectKey,
} from "@/components/multiple-select"

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
 *
 * The control it draws is `MultiSelectControl`, shared with Multiple Select
 * (task #157). The two components are the same field; the only thing that
 * chooses between them is who supplies the options — a local collection there,
 * the `load` below here. Everything async lives in this file: the list, the
 * debounce, and the "load the next page" the control reports by scroll.
 */

/** An option: an id and a label for its chip — the same shape Multiple Select takes. */
export type AsyncMultipleSelectOption = MultiSelectOption

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
  /** The `<form>` to associate the hidden inputs with, by id. */
  form?: string
  className?: string
  id?: string
  "aria-label"?: string
  /** ids of the elements describing this control — a hint, an error message. */
  "aria-describedby"?: string
}

const toMap = <T extends AsyncMultipleSelectOption>(items: T[]) =>
  new Map(items.map((item) => [multiSelectKey(item), item]))

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
  form,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: AsyncMultipleSelectProps<T>) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [search, setSearch] = useState("")

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

  const runSearch = (text: string) => {
    setSearch(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => list.setFilterText(text), searchDelay)
  }

  const toggle = (item: T) => {
    const key = multiSelectKey(item)
    const next = new Map(selected)
    if (next.has(key)) next.delete(key)
    else next.set(key, item)
    commit(next)
  }

  const remove = (item: T) => {
    const key = multiSelectKey(item)
    if (!selected.has(key)) return
    const next = new Map(selected)
    next.delete(key)
    commit(next)
  }

  return (
    <MultiSelectControl<T>
      options={list.items}
      selected={selectedItems}
      onToggle={toggle}
      onRemove={remove}
      search={search}
      onSearchChange={runSearch}
      isLoading={list.loadingState === "loading" || list.loadingState === "filtering"}
      isLoadingMore={list.loadingState === "loadingMore"}
      onLoadMore={() => {
        if (list.loadingState === "idle") list.loadMore()
      }}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      name={name}
      form={form}
      className={className}
      id={id}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    />
  )
}
