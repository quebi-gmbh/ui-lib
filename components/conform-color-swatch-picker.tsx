import type { FieldMetadata } from "@conform-to/react"
import { useState } from "react"
import { ColorSwatch } from "react-aria-components"
import type { ListData } from "react-stately"
import { twMerge } from "tailwind-merge"
import { GENERIC_COLORS } from "../lib/device-colors"
import { FieldError, Label } from "./field"

/**
 * Generic-color swatch picker for device-variant forms.
 *
 * The picker exposes the 10 `GENERIC_COLORS` buckets and submits an array of
 * `GenericColor` keys (e.g. `["black", "blue"]`) — the same dimension used by
 * the matcher and the wizard color step. Manufacturer marketing names are a
 * separate concern that should be entered per-variant in a free-text field if
 * needed.
 */
interface ConformColorSwatchPickerProps {
  field: FieldMetadata<string[] | string>
  label?: string
  /** Conform list-data binding. Each `name` is a `GenericColor` key. */
  list: ListData<{ id: number; name: string }>
  description?: string
}

export function ConformColorSwatchPicker({
  field,
  label,
  list,
  description,
}: ConformColorSwatchPickerProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(list.items.map((item) => item.name))

  const hasErrors = !field.valid && field.errors

  const handleColorToggle = (key: string) => {
    const isSelected = selectedKeys.includes(key)
    let next: string[]

    if (isSelected) {
      next = selectedKeys.filter((k) => k !== key)
      const item = list.items.find((i) => i.name === key)
      if (item) list.remove(item.id)
    } else {
      next = [...selectedKeys, key]
      const maxId = list.items.length > 0 ? Math.max(...list.items.map((i) => i.id)) : 0
      list.append({ id: maxId + 1, name: key })
    }

    setSelectedKeys(next)
  }

  // Sync state when list changes externally (e.g., tag removal).
  const currentKeys = list.items.map((item) => item.name)
  if (
    selectedKeys.length !== currentKeys.length ||
    !selectedKeys.every((c, i) => c === currentKeys[i])
  ) {
    setSelectedKeys(currentKeys)
  }

  const selectedKeySet = new Set(selectedKeys)

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {description && <p className="text-sm text-muted-fg">{description}</p>}

      <div className="flex flex-wrap gap-2">
        {GENERIC_COLORS.map((color) => {
          const isSelected = selectedKeySet.has(color.key)
          return (
            <button
              key={color.key}
              type="button"
              aria-pressed={isSelected}
              aria-label={color.key}
              onClick={() => handleColorToggle(color.key)}
              className={twMerge(
                "relative rounded-lg outline-hidden",
                isSelected && "ring-3 ring-ring/20",
              )}
            >
              <ColorSwatch
                color={color.hex}
                className={twMerge(
                  "size-8 rounded-[calc(var(--radius-lg)-1px)]",
                  isSelected && "inset-ring inset-ring-current/40",
                )}
              />
              {isSelected && (
                <span
                  className="pointer-events-none absolute bottom-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-current/50"
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Hidden input to sync with form: submits comma-joined GenericColor keys. */}
      <input
        type="hidden"
        name={field.name}
        value={list.items.map((item) => item.name).join(",")}
      />

      <FieldError>{hasErrors && field.errors?.join(", ")}</FieldError>
    </div>
  )
}
