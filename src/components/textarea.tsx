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
  xs: "text-xs px-2.5 py-1.5 min-h-16",
  sm: "text-sm px-3 py-2 min-h-18",
  md: "text-sm px-3 py-2.5 min-h-20",
} as const

type TextareaSize = keyof typeof textareaSizeStyles

/**
 * Textarea — quebi design system
 *
 * Built on react-aria-components. A multi-line text input with a cyan-tinted
 * border that auto-grows with its content (field-sizing). Hover deepens the
 * border, focus shows the quebi teal ring, and invalid switches to red.
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
            "field-sizing-content block w-full appearance-none resize-y rounded-quebi-sm",
            textareaSizeStyles[size],
            "bg-quebi-bg text-quebi-fg placeholder:text-quebi-fg-subtle",
            "border border-quebi-line/20",
            "transition-colors duration-150",
            // `not-focus` pins what today only holds by luck: `hover:` and `focus:` are
            // both (0,2,0), so the winner is Tailwind's emission order (focus last).
            // The guard says the intent instead of relying on it.
            "not-focus:hover:border-quebi-line/40",
            "focus:outline-none focus:border-quebi-brand-mark focus:ring-2 focus:ring-quebi-brand-mark focus:ring-offset-2 focus:ring-offset-quebi-bg",
            "invalid:border-red-500 focus:invalid:border-red-500 focus:invalid:ring-red-500/50",
            "aria-invalid:border-red-500 focus:aria-invalid:ring-red-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            resolved,
          ),
        )}
      />
    </span>
  )
}
