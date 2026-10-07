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
import { useFieldSizing } from "@/lib/field-size"
import { cn } from "@/lib/utils"

/**
 * TagField — quebi design system
 *
 * Built on react-aria-components. A text field that turns typed entries into
 * removable chips: press Enter, comma, or semicolon to commit the current
 * input. The input is drawn like `Input` — boxed by default (underlined inside
 * `quebi-editorial`), its frame doubled on focus; committed tags render as pills with a remove button. Casing-insensitive de-duplication, optional split pattern,
 * and a hidden mirror input so the comma-joined value submits with a form.
 */

/**
 * The field size scale — `Input`'s three steps, on the text input a TagField
 * draws: `xs` is 30px, `sm` 38px, `md` 42px and the default. The chips under
 * the input keep their own `text-xs`; they are chips, not a line of the field.
 *
 * Written out rather than imported from `input.tsx`, as in `select.tsx` and
 * `number-field.tsx`: three strings are not worth making `Input` a registry
 * dependency of this file.
 */
const tagFieldSizeStyles = {
  xs: "text-xs px-(--q-field-px) py-1.5",
  sm: "text-sm px-(--q-field-px) py-2",
  md: "text-sm px-(--q-field-px) py-2.5",
} as const

type TagFieldSize = keyof typeof tagFieldSizeStyles

export interface TagFieldProps
  extends Pick<
    TextFieldProps,
    "isDisabled" | "isReadOnly" | "aria-label" | "aria-labelledby" | "aria-describedby"
  > {
  /**
   * Force the invalid styling on. Left undefined the field decides for itself
   * (empty + `isRequired` + touched), which is what a standalone TagField does;
   * a field whose validity is owned elsewhere — a Conform schema, say — passes
   * it in.
   */
  isInvalid?: boolean
  /** id of the visible text input, so an external Label can point at it. */
  id?: string
  /** The `<form>` to associate the hidden mirror input with, by id. */
  form?: string
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
  /**
   * Control height. Matches `Input`'s scale and `Button`'s `xs` / `sm`. Left
   * out, it is whatever the surrounding surface asked for — a table cell being
   * the one that does. See `@/lib/field-size`.
   */
  size?: TagFieldSize
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
  isInvalid: isInvalidProp,
  requiredMessage,
  name = "tags",
  id,
  form,
  label,
  description,
  placeholder,
  size: sizeProp,
  ...props
}: TagFieldProps) {
  const { size } = useFieldSizing({ size: sizeProp })
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

  const isInvalid = isInvalidProp ?? Boolean(isRequired && list.length === 0 && touched)
  const errorText = requiredMessage ?? "At least one item is required"

  useEffect(() => {
    const input = hiddenRef.current
    // Resolved from the DOM rather than the `form` prop: the input may simply
    // be nested inside its form, and either way this is the element that fires.
    const formEl = input?.form
    if (!formEl || !input) return
    const onSubmit = (e: Event) => {
      if (isRequired && list.length === 0) {
        e.preventDefault()
        setTouched(true)
        input.setCustomValidity(errorText)
        formEl.reportValidity()
      } else {
        input.setCustomValidity("")
      }
    }
    formEl.addEventListener("submit", onSubmit)
    return () => formEl.removeEventListener("submit", onSubmit)
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
    <div data-slot="control" className={cn("flex w-full flex-col gap-y-1.5", className)}>
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
        aria-describedby={props["aria-describedby"]}
        id={id}
        className="group flex w-full flex-col gap-y-1.5"
      >
        {label != null && (
          <Label className="quebi-eyebrow block select-none group-disabled:opacity-50">
            {label}
          </Label>
        )}
        <span data-slot="control" className="relative block w-full">
          <Input
            placeholder={placeholder}
            className={cn(
              "relative block w-full appearance-none text-quebi-fg placeholder:text-quebi-fg-subtle",
              "quebi-field",
              tagFieldSizeStyles[size],
              "transition-[border-color,box-shadow] duration-150",
              "outline-none focus:outline-none focus:shadow-(--q-field-focus)",
              isInvalid &&
                "[--q-field-edge:var(--q-danger)] focus:shadow-(--q-field-focus-danger)",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        </span>
        {description != null && (
          <Text slot="description" className="block text-quebi-caption text-quebi-fg-subtle">
            {description}
          </Text>
        )}
        {isInvalidProp === undefined && (
          <FieldError className="block text-quebi-caption text-quebi-danger">
            {isInvalid ? errorText : undefined}
          </FieldError>
        )}
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
                    "rounded-full px-2.5 py-1 text-quebi-tag leading-none",
                    "bg-quebi-raised text-quebi-fg-muted",
                    "transition-colors duration-150",
                    allowsRemoving && "hover:text-quebi-fg",
                    "data-[selected]:bg-quebi-selected data-[selected]:text-quebi-on-selected",
                    "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-quebi-bg",
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
                          "hover:bg-quebi-pressed hover:text-quebi-fg",
                          "outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-0",
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
        form={form}
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
