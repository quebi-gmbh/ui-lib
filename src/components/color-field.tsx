"use client"

import type { ColorFieldProps } from "react-aria-components"
import {
  ColorField as ColorFieldPrimitive,
  Input as InputPrimitive,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * ColorField — quebi design system
 *
 * Built on react-aria-components. An accessible text input for editing a color
 * as a hex value (e.g. `#0EA5E9`). Renders the quebi input style: a translucent
 * field with a cyan-tinted border that lifts to brand teal on focus, red when
 * invalid, dimmed when disabled.
 *
 * Pass children to compose your own control; otherwise a styled hex `Input` is
 * rendered automatically so the field works standalone.
 */
export function ColorField({ className, children, ...props }: ColorFieldProps) {
  return (
    <ColorFieldPrimitive
      {...props}
      aria-label={props["aria-label"] ?? "Color field"}
      data-slot="control"
      className={cn(
        "w-full",
        // label → control → hint stack with 6px between siblings.
        "[&>[data-slot=label]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=label]+[slot='description']]:mt-1",
        "[&>[slot=description]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=control]+[slot=description]]:mt-1.5",
        "[&>[data-slot=control]+[slot=errorMessage]]:mt-1.5",
        "in-disabled:opacity-50 disabled:opacity-50",
        className,
      )}
    >
      {children ?? (
        <InputPrimitive
          data-slot="control"
          className={cn(
            "relative block w-full appearance-none text-sm text-white tabular-nums uppercase",
            "placeholder:text-quebi-fg-subtle placeholder:normal-case",
            "rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02] px-3 py-2.5",
            "transition-[border-color,box-shadow] duration-200",
            "enabled:hover:border-cyan-500/40",
            "outline-none focus:outline-none focus:border-quebi-brand focus:ring-2 focus:ring-quebi-brand/50",
            "invalid:border-red-500 focus:invalid:ring-red-500/50",
            "disabled:cursor-not-allowed disabled:opacity-50 in-disabled:opacity-50",
            "scheme-dark",
          )}
        />
      )}
    </ColorFieldPrimitive>
  )
}

export type { ColorFieldProps }
