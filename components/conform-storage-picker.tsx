import type { FieldMetadata } from "@conform-to/react"
import { useEffect, useState } from "react"
import type { ListData } from "react-stately"
import {
  DEVICE_STORAGE_OPTIONS,
  formatStorageDisplay,
  normalizeStorageValue,
} from "../lib/device-storage"
import { FieldError, Label } from "./field"

interface ConformStoragePickerProps {
  field: FieldMetadata<string[] | string>
  label?: string
  list: ListData<{ id: number; name: string }>
  description?: string
}

export function ConformStoragePicker({
  field,
  label,
  list,
  description,
}: ConformStoragePickerProps) {
  // Normalize existing storage values on mount (convert to "128GB" format)
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

  const hasErrors = !field.valid && field.errors

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

  // Sync state when list changes externally (e.g., tag removal)
  const currentStorageValues = new Set(list.items.map((item) => normalizeStorageValue(item.name)))
  if (
    selectedStorage.size !== currentStorageValues.size ||
    !Array.from(selectedStorage).every((s) => currentStorageValues.has(s))
  ) {
    setSelectedStorage(currentStorageValues)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {description && <p className="text-sm text-muted-fg">{description}</p>}

      <div className="flex flex-wrap gap-2">
        {DEVICE_STORAGE_OPTIONS.map((storageGb) => {
          const isSelected = selectedStorage.has(storageGb)
          return (
            <button
              key={storageGb}
              type="button"
              onClick={() => handleStorageToggle(storageGb)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-fg"
                  : "bg-muted text-muted-fg hover:bg-muted/80"
              }`}
            >
              {formatStorageDisplay(storageGb)}
            </button>
          )
        })}
      </div>

      {/* Hidden input to sync with form */}
      <input
        type="hidden"
        name={field.name}
        value={list.items.map((item) => item.name).join(",")}
      />

      <FieldError>{hasErrors && field.errors?.join(", ")}</FieldError>
    </div>
  )
}
