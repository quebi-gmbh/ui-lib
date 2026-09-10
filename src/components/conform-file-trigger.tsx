"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { DropZone } from "@/components/drop-zone"
import {
  describedBy,
  Description,
  Field,
  FieldError,
  focusFirstControl,
  Label,
} from "@/components/field"
import { FileTrigger, type FileTriggerProps } from "@/components/file-trigger"

export interface ConformFileTriggerProps
  extends Omit<FileTriggerProps, "onSelect" | "ref"> {
  /**
   * A file input bound to a `File` form value; `allowsMultiple` makes it
   * `File[]`. The two are a union of metadata objects rather than metadata of
   * a union: Conform maps a field's shape into its own type, and `File` has
   * properties an array does not.
   */
  field: FieldMetadata<File> | FieldMetadata<File[]>
  label?: string
  description?: string
  /** Also accept files dropped onto a DropZone surface. */
  hasDropZone?: boolean
  /** The text inside the drop surface. */
  dropZoneLabel?: string
  className?: string
}

/**
 * ConformFileTrigger — FileTrigger (and an optional DropZone) wired to Conform.
 *
 * Binds a file Conform field through a registered hidden `<input type="file">`,
 * which is where the real `File` objects live: the control writes them with a
 * DataTransfer, so `FormData.get(name)` returns a File, not a filename.
 *
 * The hidden input is required. `FileTriggerProps` has no `name` — react-aria's
 * `filterDOMProps` drops one silently if you pass it — and the picker it opens
 * is an implementation detail with no form value of its own. Same for DropZone,
 * which is a drop target, not a form control.
 *
 * That input is hidden by CSS rather than by the `hidden` attribute, and
 * carries no React `value` prop; both are load-bearing and both fail silently
 * — see `conform-time-field`.
 */
export function ConformFileTrigger({
  field,
  label,
  description,
  hasDropZone = false,
  dropZoneLabel = "Drop files here",
  className,
  ...props
}: ConformFileTriggerProps) {
  const fieldRef = useRef<HTMLDivElement>(null)
  const control = useControl<File[]>({
    // Conform focuses the first errored field after a failed submit; that is
    // the registered control, which nobody can see — hand it to the visible one.
    onFocus() {
      focusFirstControl(fieldRef.current)
    },
  })
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false
  const files = control.files ?? []

  const select = (list: FileList | null) => control.change(list ? Array.from(list) : [])

  return (
    <Field ref={fieldRef} className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}

      <BaseControl
        type="file"
        name={field.name}
        form={field.formId}
        multiple={props.allowsMultiple}
        ref={control.register}
        aria-describedby={describedBy(
          hasErrors && field.errorId,
          description && field.descriptionId,
        )}
        hidden={false}
        tabIndex={-1}
        className="sr-only"
      />

      {hasDropZone ? (
        <DropZone
          onDrop={async (event) => {
            const dropped = await Promise.all(
              event.items
                .filter((item) => item.kind === "file")
                .map((item) => (item as { getFile: () => Promise<File> }).getFile()),
            )
            if (dropped.length > 0) {
              control.change(props.allowsMultiple ? [...files, ...dropped] : [dropped[0]])
            }
          }}
          className={cn("flex-col gap-3", hasErrors && "border-red-500")}
        >
          <span>{dropZoneLabel}</span>
          <FileTrigger {...props} onSelect={select} />
        </DropZone>
      ) : (
        <FileTrigger {...props} onSelect={select} />
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-1 text-[12px] text-quebi-fg-muted">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name}</li>
          ))}
        </ul>
      )}

      {/* These ids are ours to set: the control above is not a react-aria
          field, so nothing generates them and its aria-describedby is their
          only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
