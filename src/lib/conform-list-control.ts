"use client"

/**
 * The binding shared by the two list-backed pickers — `conform-storage-picker`
 * and `conform-color-swatch-picker`. Both edit a set of string keys that
 * travels as one comma-joined form value, and both can mirror that set into a
 * react-stately `ListData` the caller owns, so the same keys can be rendered
 * and removed as tags elsewhere on the page.
 *
 * Why the value does not live in that list: a picker that keeps its selection
 * in the caller's `ListData` and renders `<input type="hidden" value={…} />`
 * beside it does not reset with the form, and `form.update({ name, value })`
 * never reaches it. Conform writes the field elements it has registered, and a
 * React-controlled mirror is not one of them — so a reset snaps the rest of the
 * form back and leaves the chips where the user left them.
 *
 * So the value lives in a registered control here and the list becomes a
 * projection of it: still the surface the caller renders tags from and removes
 * from, no longer the source of truth. Removing a tag elsewhere pushes into the
 * control; a reset, a `form.update()` or a failed submit's `lastResult` pushes
 * back out and re-seeds the list.
 */

import type { Control } from "@conform-to/react/future"
import { useControl } from "@conform-to/react/future"
import { useEffect, useRef } from "react"
import type { ListData } from "react-stately"

/** An item of the list a picker can mirror its selection into. */
export interface ConformListItem {
  id: number
  name: string
}

export interface UseConformListControlOptions {
  /**
   * The field's initial value, in either wire shape — the comma-joined string
   * that comes off the form, or the array a schema parsed it into.
   */
  initialValue: unknown
  /**
   * A caller-owned list to keep in step with the selection. Optional: without
   * it the picker owns its value outright, which is the common case.
   */
  list?: ListData<ConformListItem>
  /**
   * Canonicalize a key before it is compared or submitted — the storage picker
   * rewrites a free-form `"512 gb"` as `"512GB"`. Must be idempotent, and must
   * not produce a comma: one comma-joined input carries the whole set, so a key
   * containing one would come back off the wire as two.
   */
  canonicalize?: (name: string) => string
}

export interface ConformListControl {
  /** The selected keys, in submission order. */
  keys: string[]
  /** Whether `key` is part of the selection. */
  isSelected: (key: string) => boolean
  /** Replace the whole selection. */
  select: (keys: string[]) => void
  /** Add `key` if it is missing, remove it if it is there. */
  toggle: (key: string) => void
  /** Ref for the `BaseControl` that carries the value into the form. */
  register: Control<string>["register"]
  /** `defaultValue` for that same `BaseControl`. */
  defaultValue: string
}

const identity = (name: string) => name

/** Split the comma-joined wire value back into keys. */
function splitKeys(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
}

/** Read a field's initial value as a key list, accepting either wire shape. */
function toKeys(initialValue: unknown): string[] {
  if (Array.isArray(initialValue)) return initialValue.map(String)
  if (typeof initialValue === "string") return splitKeys(initialValue)
  return []
}

function sameKeys(a: string[], b: string[]) {
  return a.length === b.length && a.every((key, index) => key === b[index])
}

/**
 * Rewrite `list` so its item names are exactly `keys`, in order.
 *
 * Items are kept up to the first divergence and the tail is replaced, so the
 * ordinary edits — one key appended, one key removed — leave every surviving
 * item's `id` alone, and anything more tangled still converges in one pass.
 * `list.items` is the pre-update snapshot for the whole function: `useListData`
 * dispatches functional updates, so the calls compose, but none of them is
 * visible here until the next render.
 */
function writeList(
  list: ListData<ConformListItem>,
  keys: string[],
  canonicalize: (name: string) => string,
) {
  const items = list.items

  // Names first: a caller can seed the list in whatever shape they have, and
  // the canonical spelling is the one that goes on the wire.
  for (const item of items) {
    const name = canonicalize(item.name)
    if (name !== item.name) list.update(item.id, { ...item, name })
  }

  let common = 0
  while (common < items.length && common < keys.length) {
    if (canonicalize(items[common].name) !== keys[common]) break
    common += 1
  }

  const stale = items.slice(common)
  if (stale.length > 0) list.remove(...stale.map((item) => item.id))

  // Ids are taken from the pre-update snapshot, so they cannot collide with an
  // id this pass has already handed out — nor with one it is about to remove.
  let nextId = items.reduce((max, item) => Math.max(max, item.id), 0)
  for (const key of keys.slice(common)) {
    nextId += 1
    list.append({ id: nextId, name: key })
  }
}

/**
 * Bind a set of string keys to a Conform field, optionally mirrored into a
 * caller-owned `ListData`. See the note at the top of this file for why the
 * control owns the value and the list only follows it.
 */
export function useConformListControl({
  initialValue,
  list,
  canonicalize = identity,
}: UseConformListControlOptions): ConformListControl {
  // The field owns the default. A list the caller seeded is only a fallback for
  // a field that declares none, and only its first render counts — read live it
  // would follow the selection, and a reset would have nothing to go back to.
  const seed = useRef<string[] | null>(null)
  if (seed.current === null) {
    seed.current = list ? list.items.map((item) => canonicalize(item.name)) : []
  }

  const fromField = toKeys(initialValue).map(canonicalize)
  const defaultKeys = fromField.length > 0 ? fromField : seed.current

  const control = useControl<string>({ defaultValue: defaultKeys.join(",") })
  const keys = splitKeys(control.value).map(canonicalize)

  // Keep the two sides in step, and let whichever of them moved win.
  //
  // Deliberately without a dependency array: `useListData` returns a fresh
  // object every render, so a dependency on the list would re-run this anyway,
  // and the direction is decided from what actually changed rather than from
  // identity. Both branches converge — the render each one causes sees the two
  // sides agree and does nothing.
  const syncedList = useRef<string[] | null>(null)
  useEffect(() => {
    if (!list) {
      syncedList.current = null
      return
    }
    const listKeys = list.items.map((item) => canonicalize(item.name))
    const isCanonical = list.items.every((item) => canonicalize(item.name) === item.name)
    const previous = syncedList.current
    syncedList.current = listKeys

    if (sameKeys(listKeys, keys) && isCanonical) return

    if (previous !== null && !sameKeys(listKeys, previous)) {
      // A tag was added or removed elsewhere on the page: the list moved, so it
      // is the one saying what the value should be.
      control.change(listKeys.join(","))
    } else {
      // The control moved — a toggle here, or Conform pushing a value in
      // through a reset, a `form.update()`, or a failed submit's result. This
      // also covers the first pass, which is what canonicalizes and re-seeds a
      // list the caller handed over.
      writeList(list, keys, canonicalize)
      syncedList.current = keys
    }
  })

  const select = (next: string[]) => {
    control.change(next.map(canonicalize).join(","))
  }

  return {
    keys,
    isSelected: (key) => keys.includes(canonicalize(key)),
    select,
    toggle: (key) => {
      const canonical = canonicalize(key)
      select(keys.includes(canonical) ? keys.filter((k) => k !== canonical) : [...keys, canonical])
    },
    register: control.register,
    defaultValue: control.defaultValue ?? "",
  }
}
