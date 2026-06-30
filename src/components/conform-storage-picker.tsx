"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useEffect, useState } from "react"
import type { ListData } from "react-stately"
import { cn } from "@/lib/utils"
import { FieldError, Label } from "@/components/field"

/**
 * Device storage helpers (inlined to keep this component self-contained).
 *
 * Storage is tracked internally in gigabytes. `DEVICE_STORAGE_OPTIONS` is the
 * canonical set of sizes offered; `normalizeStorageValue` parses a free-form
 * label (e.g. "1TB", "512 gb") back into a GB number; `formatStorageDisplay`
 * renders a GB number back into a human label (e.g. 1024 → "1TB").
 */
export const DEVICE_STORAGE_OPTIONS = [32, 64, 128, 256, 512, 1024, 2048] as const

/** Render a GB amount as a human label, collapsing whole TB values. */
export function formatStorageDisplay(storageGb: number): string {
  if (storageGb >= 1024 && storageGb % 1024 === 0) {
    return `${storageGb / 1024}TB`
  }
  return `${storageGb}GB`
}

/** Parse a free-form storage label into a GB number. */
export function normalizeStorageValue(value: string | number): number {
  if (typeof value === "number") return value

  const match = value.trim().match(/([\d.]+)\s*(tb|gb)?/i)
  if (!match) return 0

  const amount = Number.parseFloat(match[1])
  if (Number.isNaN(amount)) return 0

  const unit = (match[2] ?? "gb").toLowerCase()
  return unit === "tb" ? Math.round(amount * 1024) : Math.round(amount)
}

interface ConformStoragePickerProps {
  // Loose value type param: the field carries a comma-joined string of storage
  // labels; only name/default/required/errors/valid are read here.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  list: ListData<{ id: number; name: string }>
  description?: string
  className?: string
}

/**
 * ConformStoragePicker — a multi-select chip group of device storage sizes,
 * wired to Conform.
 *
 * Selected sizes are kept in a react-stately list (so they can be surfaced as
 * removable tags elsewhere) and mirrored into a hidden input as a comma-joined
 * string for form submission. Validity is derived from the Conform field.
 */
export function ConformStoragePicker({
  field,
  label,
  list,
  description,
  className,
}: ConformStoragePickerProps) {
  // Normalize existing storage values on mount (convert to "128GB" / "1TB" form).
  useEffect(() => {
    for (const item of list.items) {
      const normalized = normalizeStorageValue(item.name)
      const formatted = formatStorageDisplay(normalized)
      if (formatted !== item.name) {
        list.update(item.id, { ...item, name: formatted })
      }
    }
  }, [list])

  const [selectedStorage, setSelectedStorage] = useState<Set<number>>(
    new Set(list.items.map((item) => normalizeStorageValue(item.name))),
  )

  const hasErrors = !field.valid && !!field.errors

  const handleStorageToggle = (storageGb: number) => {
    const newSelection = new Set(selectedStorage)

    if (newSelection.has(storageGb)) {
      // Remove storage
      newSelection.delete(storageGb)
      const formatted = formatStorageDisplay(storageGb)
      const item = list.items.find((i) => i.name === formatted)
      if (item) {
        list.remove(item.id)
      }
    } else {
      // Add storage
      newSelection.add(storageGb)
      const maxId = list.items.length > 0 ? Math.max(...list.items.map((i) => i.id)) : 0
      const formatted = formatStorageDisplay(storageGb)
      list.append({ id: maxId + 1, name: formatted })
    }

    setSelectedStorage(newSelection)
  }

  // Sync state when the list changes externally (e.g. a tag is removed elsewhere).
  const currentStorageValues = new Set(list.items.map((item) => normalizeStorageValue(item.name)))
  if (
    selectedStorage.size !== currentStorageValues.size ||
    !Array.from(selectedStorage).every((s) => currentStorageValues.has(s))
  ) {
    setSelectedStorage(currentStorageValues)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      {description && <p className="text-[12px] text-quebi-fg-muted">{description}</p>}

      <div className="flex flex-wrap gap-2">
        {DEVICE_STORAGE_OPTIONS.map((storageGb) => {
          const isSelected = selectedStorage.has(storageGb)
          return (
            <button
              key={storageGb}
              type="button"
              onClick={() => handleStorageToggle(storageGb)}
              className={cn(
                "rounded-quebi-sm px-3 py-1.5 font-medium text-sm transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
                isSelected
                  ? "bg-quebi-brand text-quebi-bg shadow-quebi-glow hover:bg-quebi-brand-hover"
                  : "border border-cyan-500/20 bg-transparent text-quebi-fg-muted hover:-translate-y-0.5 hover:text-white",
              )}
            >
              {formatStorageDisplay(storageGb)}
            </button>
          )
        })}
      </div>

      {/* Hidden input to sync selection with the form. */}
      <input
        type="hidden"
        name={field.name}
        value={list.items.map((item) => item.name).join(",")}
      />

      <FieldError>{hasErrors && field.errors?.join(", ")}</FieldError>
    </div>
  )
}
