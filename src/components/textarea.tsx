"use client"

import {
  composeRenderProps,
  TextArea as TextAreaPrimitive,
  type TextAreaProps,
} from "react-aria-components"
import { useFieldSizing } from "@/lib/field-size"
import { cn } from "@/lib/utils"

/**
 * The field size scale.
 *
 * The text and the padding are `Input`'s three steps exactly, so a textarea
 * and the input beside it are set in the same type with the same inset. The
 * `min-h-*` is the part only this control has: a textarea can never be the
 * scale's 30 / 38 / 42px, so what the scale buys here is that a small field's
 * *first* line is a small field's line, and the floor comes down with it.
 *
 * Written out rather than imported from `input.tsx`, as in `select.tsx` and
 * `number-field.tsx`: three strings are not worth making `Input` a registry
 * dependency of this file.
 */
const textareaSizeStyles = {
  xs: "text-xs px-(--q-field-px) py-1.5 min-h-16",
  sm: "text-sm px-(--q-field-px) py-2 min-h-18",
  md: "text-sm px-(--q-field-px) py-2.5 min-h-20",
} as const

type TextareaSize = keyof typeof textareaSizeStyles

/**
 * Textarea — quebi design system
 *
 * Built on react-aria-components. A multi-line text input that auto-grows with
 * its content (field-sizing), drawn like `Input`: underline only, focus
 * thickens the line to 2px without moving anything, invalid turns it `danger`.
 */
interface TextareaComponentProps extends TextAreaProps {
  /**
   * Control height. Matches `Input`'s scale. Left out, it is whatever the
   * surrounding surface asked for — a table cell being the one that does. See
   * `@/lib/field-size`.
   */
  size?: TextareaSize
}

export function Textarea({ className, size: sizeProp, ...props }: TextareaComponentProps) {
  const { size } = useFieldSizing({ size: sizeProp })
  return (
    <span data-slot="control" className="relative block w-full">
      <TextAreaPrimitive
        {...props}
        className={composeRenderProps(className, (resolved) =>
          cn(
            "field-sizing-content block w-full appearance-none resize-y",
            textareaSizeStyles[size],
            "bg-transparent text-quebi-fg placeholder:text-quebi-fg-subtle",
            "quebi-field",
            "transition-[border-color,box-shadow] duration-150",
            "focus:outline-none focus:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
            "invalid:border-b-quebi-danger focus:invalid:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
            "aria-invalid:border-b-quebi-danger focus:aria-invalid:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            resolved,
          ),
        )}
      />
    </span>
  )
}
