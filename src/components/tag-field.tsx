"use client"

import { X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Button,
  composeRenderProps,
  FieldError,
  Input,
  type Key,
  Label,
  type Selection,
  Tag,
  TagGroup,
  TagList,
  Text,
  TextField,
  type TextFieldProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * TagField — quebi design system
 *
 * Built on react-aria-components. A text field that turns typed entries into
 * removable chips: press Enter, comma, or semicolon to commit the current
 * input. The field uses the quebi translucent-input styling (cyan-tinted
 * border, teal focus ring); committed tags render as hairline chips with a
 * remove button. Casing-insensitive de-duplication, optional split pattern,
 * and a hidden mirror input so the comma-joined value submits with a form.
 */

interface TagFieldProps
  extends Pick<
    TextFieldProps,
    "isDisabled" | "isReadOnly" | "aria-label" | "aria-labelledby"
  > {
  /** Controlled set of tags. */
  value?: Selection
  /** Called with the next set of tags whenever they change. */
  onChange?: (next: Selection) => void
  /** Uncontrolled initial tags. */
  defaultValue?: string[]
  /** Splits a single entry into multiple tags. Defaults to comma/semicolon. */
  splitPattern?: RegExp
  className?: string
  /** Controlled value of the text input. */
  inputValue?: string
  onInputValueChange?: (v: string) => void
  isRequired?: boolean
  requiredMessage?: string
  /** Name of the hidden mirror input that carries the comma-joined value. */
  name?: string
  /** Field label. */
  label?: React.ReactNode
  /** Muted hint shown under the field. */
  description?: React.ReactNode
  placeholder?: string
}

export function TagField({
  value,
  onChange,
  defaultValue = [],
  splitPattern = /[,;]/,
  className,
  inputValue: controlledInput,
  onInputValueChange,
  isRequired,
  requiredMessage,
  name = "tags",
  label,
  description,
  placeholder,
  ...props
}: TagFieldProps) {
  const [internalSelection, setInternalSelection] = useState<Selection>(new Set(defaultValue))
  const [uncontrolledInput, setUncontrolledInput] = useState("")
  const [touched, setTouched] = useState(false)
  const hiddenRef = useRef<HTMLInputElement>(null)

  const selection: Selection = value ?? internalSelection
  const inputValue = controlledInput ?? uncontrolledInput
  const setInputValue = onInputValueChange ?? setUncontrolledInput
  const applySelection = (next: Selection) => (onChange ?? setInternalSelection)(next)

  const list = useMemo(() => {
    return selection === "all" ? [] : Array.from(selection).map((v) => String(v))
  }, [selection])

  const isInvalid = Boolean(isRequired && list.length === 0 && touched)
  const errorText = requiredMessage ?? "At least one item is required"

  useEffect(() => {
    const input = hiddenRef.current
    const form = input?.form
    if (!form || !input) return
    const onSubmit = (e: Event) => {
      if (isRequired && list.length === 0) {
        e.preventDefault()
        setTouched(true)
        input.setCustomValidity(errorText)
        form.reportValidity()
      } else {
        input.setCustomValidity("")
      }
    }
    form.addEventListener("submit", onSubmit)
    return () => form.removeEventListener("submit", onSubmit)
  }, [isRequired, list.length, errorText])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault()
      addTag()
    }
  }

  function addTag() {
    if (selection === "all") return
    const next = new Set<Key>(Array.from(selection))
    inputValue.split(splitPattern).forEach((raw) => {
      const formatted = raw
        .trim()
        .replace(/\s\s+/g, " ")
        .replace(/\t|\\t|\r|\\r|\n|\\n/g, "")
      if (formatted === "") return
      const exists = Array.from(next).some(
        (id) => String(id).toLocaleLowerCase() === formatted.toLocaleLowerCase(),
      )
      if (!exists) next.add(formatted)
    })
    applySelection(next)
    setInputValue("")
    setTouched(true)
  }

  function removeKeys(keys: Selection) {
    if (selection === "all") return
    const next = new Set<Key>(Array.from(selection))
    if (keys !== "all") {
      for (const k of keys) next.delete(k)
    }
    applySelection(next)
    setTouched(true)
  }

  return (
    <div className={cn("flex w-full flex-col gap-y-1.5", className)}>
      <TextField
        value={inputValue}
        onChange={setInputValue}
        onKeyDown={handleKeyDown}
        onBlur={() => setTouched(true)}
        isInvalid={isInvalid}
        isDisabled={props.isDisabled}
        isReadOnly={props.isReadOnly}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        className="group flex w-full flex-col gap-y-1.5"
      >
        {label != null && (
          <Label className="select-none font-semibold text-[13px] text-white group-disabled:opacity-50">
            {label}
          </Label>
        )}
        <span data-slot="control" className="relative block w-full">
          <Input
            placeholder={placeholder}
            className={cn(
              "relative block w-full appearance-none text-sm text-white placeholder:text-quebi-fg-subtle",
              "rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02] px-3 py-2.5",
              "transition-[border-color,box-shadow] duration-200",
              "enabled:hover:border-cyan-500/40",
              "outline-none focus:outline-none focus:border-quebi-brand focus:ring-2 focus:ring-quebi-brand/50",
              isInvalid && "border-red-500 focus:ring-red-500/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "scheme-dark",
            )}
          />
        </span>
        {description != null && (
          <Text slot="description" className="block text-[12px] text-quebi-fg-muted">
            {description}
          </Text>
        )}
        <FieldError className="block text-[12px] text-red-500">
          {isInvalid ? errorText : undefined}
        </FieldError>
      </TextField>

      {list.length > 0 ? (
        <TagGroup
          disabledKeys={props.isDisabled ? new Set(list) : undefined}
          className="mt-0.5"
          aria-label="Selected tags"
          {...(!props.isReadOnly && !props.isDisabled ? { onRemove: removeKeys } : {})}
        >
          <TagList className="flex flex-wrap gap-1.5 outline-none">
            {list.map((id) => (
              <Tag
                key={id}
                id={id}
                textValue={id}
                className={composeRenderProps("", (_, { allowsRemoving }) =>
                  cn(
                    "group inline-flex items-center gap-1 whitespace-nowrap",
                    "rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
                    "border-cyan-500/20 bg-white/[0.06] text-quebi-fg-muted",
                    "transition-colors duration-150",
                    allowsRemoving && "hover:border-cyan-500/40 hover:text-white",
                    "data-[selected]:border-quebi-brand/40 data-[selected]:bg-quebi-brand/10 data-[selected]:text-quebi-brand",
                    "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
                    "data-[disabled]:opacity-50",
                    "outline-none",
                  ),
                )}
              >
                {({ allowsRemoving }) => (
                  <>
                    <span>{id}</span>
                    {allowsRemoving && (
                      <Button
                        slot="remove"
                        aria-label={`Remove ${id}`}
                        className={cn(
                          "-mr-1 flex size-4 shrink-0 items-center justify-center rounded-full",
                          "text-quebi-fg-subtle transition-colors duration-150",
                          "hover:bg-white/10 hover:text-white",
                          "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50",
                          "cursor-pointer",
                        )}
                      >
                        <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                      </Button>
                    )}
                  </>
                )}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      ) : null}

      <input
        ref={hiddenRef}
        name={name}
        value={list.join(",")}
        required={Boolean(isRequired)}
        readOnly
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only absolute -z-10 h-0 w-0 opacity-0"
      />
    </div>
  )
}
