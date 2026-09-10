"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl } from "@conform-to/react/future"
import { useRef } from "react"
import { Button } from "react-aria-components"
import type { ListData } from "react-stately"
import { type ConformListItem, useConformListControl } from "@/lib/conform-list-control"
import { cn } from "@/lib/utils"
import {
  describedBy,
  Description,
  Field,
  FieldError,
  focusFirstControl,
  Label,
} from "@/components/field"

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

/** The label a free-form storage value is stored and submitted under. */
const canonicalStorageLabel = (name: string) =>
  formatStorageDisplay(normalizeStorageValue(name))

export interface ConformStoragePickerProps {
  // A list-backed field: the storage labels surface as a comma-joined string on
  // the wire (`string`) or an array after parsing (`string[]`); only
  // name/default/required/errors/valid are read off the metadata.
  field: FieldMetadata<string | string[]>
  label?: string
  /**
   * Optional react-stately list mirroring the selection, so the same sizes can
   * be rendered and removed as tags elsewhere on the page. The picker owns the
   * value either way: removing an item pushes into the field, and a reset or a
   * `form.update()` re-seeds the list.
   */
  list?: ListData<ConformListItem>
  description?: string
  className?: string
}

/**
 * ConformStoragePicker — a multi-select chip group of device storage sizes,
 * wired to Conform.
 *
 * The selected sizes are submitted as one comma-joined string (e.g.
 * `"128GB,1TB"`) through a registered hidden control, so they repopulate after
 * a failed submit and reset with the form like every other variant. Validity
 * and the error message come from the field.
 *
 * `list` is optional and is a projection of that value rather than its home —
 * see `@/lib/conform-list-control` for why. The default selection is the
 * field's, not the list's: seed `useForm({ defaultValue: { storage: "128GB" } })`
 * and the list follows, which is also what a reset goes back to.
 */
export function ConformStoragePicker({
  field,
  label,
  list,
  description,
  className,
}: ConformStoragePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const selection = useConformListControl({
    initialValue: field.initialValue,
    list,
    canonicalize: canonicalStorageLabel,
    // Conform focuses the first errored field after a failed submit; that is
    // the registered control, which nobody can see — hand it to the visible one.
    onFocus() {
      focusFirstControl(fieldRef.current)
    },
  })
  const hasErrors = !field.valid && !!field.errors

  return (
    <Field ref={fieldRef} className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {field.required && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}

      {/* These ids are ours to set: a chip group is not a react-aria field, so
          nothing generates them and the aria-describedby below is their only
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

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={label ?? "Storage"}
        aria-invalid={hasErrors || undefined}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      >
        {DEVICE_STORAGE_OPTIONS.map((storageGb) => {
          const value = formatStorageDisplay(storageGb)
          const isSelected = selection.isSelected(value)
          return (
            <Button
              key={storageGb}
              aria-pressed={isSelected}
              onPress={() => selection.toggle(value)}
              className={cn(
                "rounded-quebi-sm px-3 py-1.5 font-medium text-sm transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
                isSelected
                  ? "bg-quebi-brand text-quebi-on-brand shadow-quebi-glow hover:bg-quebi-brand-hover"
                  : "border border-quebi-line/20 bg-transparent text-quebi-fg-muted hover:-translate-y-0.5 hover:text-quebi-fg",
              )}
            >
              {value}
            </Button>
          )
        })}
      </div>

      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
