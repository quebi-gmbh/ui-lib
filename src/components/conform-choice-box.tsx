"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { cn } from "@/lib/utils"
import { ChoiceBox, type ChoiceBoxProps } from "@/components/choice-box"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"

export interface ConformChoiceBoxProps<T extends object>
  extends Omit<
    ChoiceBoxProps<T>,
    "selectedKeys" | "defaultSelectedKeys" | "onSelectionChange"
  > {
  /**
   * A choice box bound to a form value: one key with `selectionMode="single"`,
   * a key per selected card with `"multiple"` — which submits the name once per
   * key, so the parsed value is an array.
   */
  field: FieldMetadata<string | string[]>
  label?: string
  description?: string
  /**
   * Every selectable key, in order. Needed only so a select-all (Ctrl+A in
   * multiple-selection mode) can be turned into an explicit list — react-aria
   * reports it as the sentinel `"all"`, which carries no keys. Without it a
   * select-all leaves the submitted value unchanged.
   */
  keys?: string[]
}

/** Read the field's initial value as a key list, accepting either wire shape. */
function toDefaultKeys(initialValue: unknown): string[] {
  if (Array.isArray(initialValue)) return initialValue.map(String)
  if (typeof initialValue === "string" && initialValue !== "") return [initialValue]
  return []
}

/**
 * ConformChoiceBox — ChoiceBox wired to Conform.
 *
 * Binds a Conform field to the quebi ChoiceBox through a registered hidden
 * `<select>`, which is where the selection becomes a form value.
 *
 * ChoiceBox is a react-aria GridList: it has no `name`, renders no native form
 * control, and its value is a `Set<Key>` rather than a string — so without the
 * hidden control it submits nothing. `BaseControl` renders it with the `hidden`
 * attribute and no React `value` prop; both matter, see `conform-time-field`.
 *
 * The registered control mirrors the selection mode, because that is what
 * decides whether an *empty* selection still submits the field:
 *
 * - `"multiple"` registers a `<select multiple>`. With nothing selected it has
 *   no selected option and submits nothing, which is right: Conform parses an
 *   absent key for an array field as `[]`, so a `v.array(...)` schema reports
 *   the author's own `minLength` message.
 * - `"single"` (and `"none"`) registers a plain `<select>`, whose empty state
 *   is an `<option value="">` — the same trick react-aria's `HiddenSelect`
 *   uses. It matters: a `<select multiple>` with nothing selected leaves the
 *   key out of `FormData` entirely, and for a string field that is not the
 *   author's "Pick a plan" but valibot's internal `Invalid key: Expected
 *   "plan" but received undefined`. Submitting `""` puts the key back, and the
 *   message the consumer wrote is the one that shows.
 */
export function ConformChoiceBox<T extends object>({
  field,
  label,
  description,
  keys,
  children,
  className,
  selectionMode = "single",
  ...props
}: ConformChoiceBoxProps<T>) {
  const isMultiple = selectionMode === "multiple"
  const defaultKeys = toDefaultKeys(field.initialValue)
  const control = useControl<string | string[]>({
    defaultValue: isMultiple ? defaultKeys : (defaultKeys[0] ?? ""),
  })
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const selected = isMultiple
    ? (control.options ?? [])
    : control.value
      ? [control.value]
      : []

  return (
    <Field className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}

      <BaseControl
        type="select"
        multiple={isMultiple}
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue ?? (isMultiple ? [] : "")}
      />

      <ChoiceBox<T>
        {...props}
        selectionMode={selectionMode}
        selectedKeys={new Set(selected)}
        onSelectionChange={(selection) => {
          if (selection === "all") {
            // Only reachable in multiple-selection mode; react-aria never
            // reports the sentinel for a single selection.
            if (keys) control.change(keys)
            return
          }
          const next = Array.from(selection).map(String)
          control.change(isMultiple ? next : (next[0] ?? ""))
        }}
        aria-label={props["aria-label"] ?? label}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
      >
        {children}
      </ChoiceBox>

      {/* These ids are ours to set: the control above is not a react-aria
          field, so nothing generates them and its aria-describedby is their
          only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
