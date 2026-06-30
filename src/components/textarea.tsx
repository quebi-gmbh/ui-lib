"use client"

import { TextArea as TextAreaPrimitive, type TextAreaProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Textarea — quebi design system
 *
 * Built on react-aria-components. A multi-line text input with a cyan-tinted
 * border that auto-grows with its content (field-sizing). Hover deepens the
 * border, focus shows the quebi teal ring, and invalid switches to red.
 */
export function Textarea({ className, ...props }: TextAreaProps) {
  return (
    <span data-slot="control" className="relative block w-full">
      <TextAreaPrimitive
        {...props}
        className={cn(
          "field-sizing-content block min-h-20 w-full appearance-none resize-y rounded-quebi-sm px-3 py-2",
          "bg-quebi-bg text-sm text-white placeholder:text-quebi-fg-subtle",
          "border border-cyan-500/20",
          "transition-colors duration-150",
          "hover:border-cyan-500/40",
          "focus:outline-none focus:border-quebi-brand focus:ring-2 focus:ring-quebi-brand/50 focus:ring-offset-2 focus:ring-offset-quebi-bg",
          "invalid:border-red-500 focus:invalid:border-red-500 focus:invalid:ring-red-500/50",
          "aria-invalid:border-red-500 focus:aria-invalid:ring-red-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
      />
    </span>
  )
}
