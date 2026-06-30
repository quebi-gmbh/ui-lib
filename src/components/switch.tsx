"use client"

import { Switch as SwitchPrimitive, type SwitchProps } from "react-aria-components"
import { Label } from "@/components/field"
import { cn } from "@/lib/utils"

/**
 * Switch — quebi design system
 *
 * Built on react-aria-components. A 44x24 toggle: the off track is a subtle
 * cyan-tinted surface, the on track fills with brand teal, and a white thumb
 * slides 20px to the right when selected. Focus uses the quebi teal ring.
 */
export function Switch({ children, className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive
      {...props}
      data-slot="control"
      className={cn(
        // Inline-flex so the Switch only takes the width it needs. Indicator
        // first, then any children (label / description) to the right.
        "group inline-flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={({ defaultStyle }) => ({
        ...defaultStyle,
        WebkitTapHighlightColor: "transparent",
      })}
    >
      {(values) => (
        <>
          <span
            data-slot="indicator"
            className={cn(
              // 44x24 track, pill-shaped.
              "relative isolate inline-flex h-6 w-11 shrink-0 rounded-full border",
              "transition-colors duration-200",
              "border-cyan-500/30 bg-cyan-500/10",
              values.isSelected && "border-quebi-brand bg-quebi-brand",
              values.isFocusVisible &&
                "ring-2 ring-quebi-brand/50 ring-offset-2 ring-offset-quebi-bg",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                // 20x20 thumb, 2px inset from top-left, slides 20px right when on.
                "pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-quebi-glow",
                "transition-transform duration-200",
                values.isSelected && "translate-x-5",
              )}
            />
          </span>
          {typeof children === "function" ? (
            children(values)
          ) : typeof children === "string" ? (
            <SwitchLabel>{children}</SwitchLabel>
          ) : (
            children
          )}
        </>
      )}
    </SwitchPrimitive>
  )
}

export function SwitchLabel(props: React.ComponentProps<typeof Label>) {
  return <Label elementType="span" {...props} />
}
