"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useState } from "react"
import type { Selection } from "react-aria-components"
import { ListBox, ListBoxItem } from "react-aria-components"
import type { ListData } from "react-stately"
import { cn } from "@/lib/utils"
import { ColorSwatch } from "@/components/color-swatch"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"

/** A selectable color: a stable `key` submitted to the form plus its `hex` swatch. */
export interface SwatchColor {
  key: string
  hex: string
  label?: string
}

/** Default palette used when no `colors` prop is supplied. */
export const DEFAULT_SWATCH_COLORS: SwatchColor[] = [
  { key: "black", hex: "#1a1a1a" },
  { key: "white", hex: "#f5f5f5" },
  { key: "gray", hex: "#9ca3af" },
  { key: "red", hex: "#ef4444" },
  { key: "orange", hex: "#f97316" },
  { key: "yellow", hex: "#eab308" },
  { key: "green", hex: "#22c55e" },
  { key: "teal", hex: "#14b8a6" },
  { key: "blue", hex: "#3b82f6" },
  { key: "purple", hex: "#a855f7" },
]

export interface ConformColorSwatchPickerProps {
  /**
   * A field whose value is a set of color keys. List-backed fields surface as
   * `string | string[]` (a comma-joined string on the wire, an array after
   * parsing); only name/errors/validity are read off the metadata.
   */
  field: FieldMetadata<string | string[]>
  label?: string
  description?: string
  /** Conform list-data binding. Each item's `name` is a color key. */
  list: ListData<{ id: number; name: string }>
  /** Selectable colors. Defaults to {@link DEFAULT_SWATCH_COLORS}. */
  colors?: SwatchColor[]
  className?: string
}

/**
 * ConformColorSwatchPicker — multi-select color picker wired to Conform.
 *
 * A wrapping grid of named color swatches that submits an array of color keys.
 *
 * The grid is a multi-select `ListBox` rather than the quebi ColorSwatchPicker,
 * and that is the whole point of the component. react-aria's ColorSwatchPicker
 * hardcodes `selectionMode: "single"` and derives its selection from a single
 * color *value*, so a multi-select grid cannot be built on it: every swatch
 * renders `role="option" aria-selected="false"`, including the selected ones,
 * and a ring drawn by hand is the only thing that says otherwise. Here the
 * selection is real — `aria-selected`, `data-[selected]`, `aria-multiselectable`
 * and keyboard multi-select (arrow keys across the grid, Space/Enter to toggle)
 * all come from the listbox. The single-select quebi ColorSwatchPicker stays the
 * right component for picking one color.
 *
 * Unlike the other variants this one does not own its value: the selection
 * lives in the `list` the caller passes, because a Conform list binding is what
 * lets the same tags be rendered and removed elsewhere on the page. The hidden
 * input below mirrors that list, so repopulation after a failed submit comes
 * from re-seeding the list from `field.initialValue` — it is the caller's state
 * that has to survive, and Conform cannot reset a list it does not own.
 */
export function ConformColorSwatchPicker({
  field,
  label,
  description,
  list,
  colors = DEFAULT_SWATCH_COLORS,
  className,
}: ConformColorSwatchPickerProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(list.items.map((item) => item.name))

  const hasErrors = !field.valid && !!field.errors

  // Sync local state when the list changes externally (e.g. a tag removed elsewhere).
  const currentKeys = list.items.map((item) => item.name)
  if (
    selectedKeys.length !== currentKeys.length ||
    !selectedKeys.every((c, i) => c === currentKeys[i])
  ) {
    setSelectedKeys(currentKeys)
  }

  /**
   * Apply the listbox's selection to the list and the mirror below it.
   *
   * `"all"` reaches here from Ctrl+A, which react-aria reports as the whole
   * collection rather than as a set of keys.
   */
  const applySelection = (selection: Selection) => {
    const next =
      selection === "all" ? colors.map((color) => color.key) : [...selection].map(String)
    const nextSet = new Set(next)

    for (const item of list.items) {
      if (!nextSet.has(item.name)) list.remove(item.id)
    }

    const present = new Set(currentKeys)
    let nextId = list.items.length > 0 ? Math.max(...list.items.map((i) => i.id)) : 0
    for (const key of next) {
      if (present.has(key)) continue
      nextId += 1
      list.append({ id: nextId, name: key })
    }

    setSelectedKeys(next)
  }

  return (
    <Field className={cn("space-y-1.5", className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {field.required && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}
      {/* These ids are ours to set: the swatch grid is not a react-aria field,
          so nothing generates them and the aria-describedby below is their only
          reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}

      {/* `data-invalid` rather than `aria-invalid`: react-aria's ListBox filters
          its incoming DOM props down to `id`, the labelable set and `data-*`, so
          an aria-invalid here would be dropped without a word. The error text is
          still announced — aria-describedby is in the labelable set and survives. */}
      <ListBox
        data-slot="control"
        aria-label={label ?? "Colors"}
        data-invalid={hasErrors || undefined}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
        layout="grid"
        selectionMode="multiple"
        selectionBehavior="toggle"
        selectedKeys={selectedKeys}
        onSelectionChange={applySelection}
        className="flex flex-wrap gap-2 outline-hidden"
      >
        {colors.map((color) => (
          <ListBoxItem
            key={color.key}
            id={color.key}
            textValue={color.label ?? color.key}
            aria-label={color.label ?? color.key}
            // The quebi ColorSwatchPickerItem's look, on a listbox option: the
            // ring is keyed off `data-[selected]`, which react-aria now sets,
            // rather than off a className the component computes for itself.
            className={cn(
              "relative rounded-quebi-sm outline-hidden",
              "*:rounded-quebi-sm",
              "transition-opacity duration-150",
              "data-[selected]:ring-2 data-[selected]:ring-quebi-brand data-[selected]:ring-offset-2 data-[selected]:ring-offset-quebi-bg",
              "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
              "hover:opacity-90",
            )}
          >
            {({ isSelected }) => (
              <>
                <ColorSwatch color={color.hex} className="size-8" />
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/80 shadow-quebi-glow"
                  />
                )}
              </>
            )}
          </ListBoxItem>
        ))}
      </ListBox>

      {/* Mirror the selection into the form as a comma-joined list of keys. */}
      <input type="hidden" name={field.name} form={field.formId} value={currentKeys.join(",")} />

      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
