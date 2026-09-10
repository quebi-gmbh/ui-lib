"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl } from "@conform-to/react/future"
import { useRef } from "react"
import { ColorSwatch } from "react-aria-components"
import type { ListData } from "react-stately"
import { type ConformListItem, useConformListControl } from "@/lib/conform-list-control"
import { cn } from "@/lib/utils"
import { ColorSwatchPicker, ColorSwatchPickerItem } from "@/components/color-swatch-picker"
import {
  describedBy,
  Description,
  Field,
  FieldError,
  focusFirstControl,
  Label,
} from "@/components/field"

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
  /**
   * Optional react-stately list mirroring the selection, so the same colors can
   * be rendered and removed as tags elsewhere on the page. The picker owns the
   * value either way: removing an item pushes into the field, and a reset or a
   * `form.update()` re-seeds the list.
   */
  list?: ListData<ConformListItem>
  /** Selectable colors. Defaults to {@link DEFAULT_SWATCH_COLORS}. */
  colors?: SwatchColor[]
  className?: string
}

/**
 * ConformColorSwatchPicker — multi-select color picker wired to Conform.
 *
 * A wrapping grid of named color swatches. The selected keys are submitted as
 * one comma-joined string through a registered hidden control, so they
 * repopulate after a failed submit and reset with the form like every other
 * variant. Built on the quebi ColorSwatchPicker for layout and tokens; toggling
 * is handled per-swatch since the underlying picker is single-select.
 *
 * `list` is optional and is a projection of that value rather than its home —
 * see `@/lib/conform-list-control` for why. The default selection is the
 * field's, not the list's: seed `useForm({ defaultValue: { colors: ["teal"] } })`
 * and the list follows, which is also what a reset goes back to.
 */
export function ConformColorSwatchPicker({
  field,
  label,
  description,
  list,
  colors = DEFAULT_SWATCH_COLORS,
  className,
}: ConformColorSwatchPickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const selection = useConformListControl({
    initialValue: field.initialValue,
    list,
    // Conform focuses the first errored field after a failed submit; that is
    // the registered control, which nobody can see — hand it to the visible one.
    onFocus() {
      focusFirstControl(fieldRef.current)
    },
  })
  const hasErrors = !field.valid && !!field.errors

  return (
    <Field ref={fieldRef} className={cn("space-y-1.5", className)}>
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

      <BaseControl
        name={field.name}
        form={field.formId}
        ref={selection.register}
        defaultValue={selection.defaultValue}
        hidden={false}
        tabIndex={-1}
        className="sr-only"
      />

      {/* The picker provides quebi layout/tokens; multi-select is driven by the
          control above, one toggle per swatch. */}
      <ColorSwatchPicker
        aria-label={label ?? "Colors"}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      >
        {colors.map((color) => {
          const isSelected = selection.isSelected(color.key)
          return (
            <ColorSwatchPickerItem
              key={color.key}
              color={color.hex}
              aria-label={color.label ?? color.key}
              onPress={() => selection.toggle(color.key)}
              className={cn(
                isSelected &&
                  "ring-2 ring-quebi-brand ring-offset-2 ring-offset-quebi-bg",
              )}
            >
              <ColorSwatch className="size-8" />
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/80 shadow-quebi-glow"
                />
              )}
            </ColorSwatchPickerItem>
          )
        })}
      </ColorSwatchPicker>

      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
