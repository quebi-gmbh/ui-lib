"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useState } from "react"
import { ColorSwatch } from "react-aria-components"
import type { ListData } from "react-stately"
import { cn } from "@/lib/utils"
import { ColorSwatchPicker, ColorSwatchPickerItem } from "@/components/color-swatch-picker"
import { Description, FieldError, Label } from "@/components/field"

/**
 * ConformColorSwatchPicker — multi-select color picker wired to Conform.
 *
 * A wrapping grid of named color swatches that submits an array of color keys.
 * Selection is mirrored into a Conform `ListData` binding and a hidden input so
 * the value (comma-joined keys) participates in the form and surfaces inline
 * validation errors. Built on the quebi ColorSwatchPicker for layout and tokens;
 * toggling is handled per-swatch since the underlying picker is single-select.
 */

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

interface ConformColorSwatchPickerProps {
  /**
   * A field whose value is an array of color keys. The value type param is loose
   * because list-backed fields surface as string | string[] depending on the
   * schema; only name/errors/validity are read here.
   */
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  description?: string
  /** Conform list-data binding. Each item's `name` is a color key. */
  list: ListData<{ id: number; name: string }>
  /** Selectable colors. Defaults to {@link DEFAULT_SWATCH_COLORS}. */
  colors?: SwatchColor[]
  className?: string
}

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

  const toggleColor = (key: string) => {
    if (selectedKeys.includes(key)) {
      const item = list.items.find((i) => i.name === key)
      if (item) list.remove(item.id)
      setSelectedKeys(selectedKeys.filter((k) => k !== key))
    } else {
      const maxId = list.items.length > 0 ? Math.max(...list.items.map((i) => i.id)) : 0
      list.append({ id: maxId + 1, name: key })
      setSelectedKeys([...selectedKeys, key])
    }
  }

  // Sync local state when the list changes externally (e.g. a tag removed elsewhere).
  const currentKeys = list.items.map((item) => item.name)
  if (
    selectedKeys.length !== currentKeys.length ||
    !selectedKeys.every((c, i) => c === currentKeys[i])
  ) {
    setSelectedKeys(currentKeys)
  }

  const selectedSet = new Set(selectedKeys)

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label>{label}</Label>}
      {description && <Description>{description}</Description>}

      {/* The picker provides quebi layout/tokens; multi-select is driven by `list`. */}
      <ColorSwatchPicker aria-label={label ?? "Colors"}>
        {colors.map((color) => {
          const isSelected = selectedSet.has(color.key)
          return (
            <ColorSwatchPickerItem
              key={color.key}
              color={color.hex}
              aria-label={color.label ?? color.key}
              onPress={() => toggleColor(color.key)}
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

      {/* Mirror the selection into the form as a comma-joined list of keys. */}
      <input type="hidden" name={field.name} value={currentKeys.join(",")} />

      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </div>
  )
}
