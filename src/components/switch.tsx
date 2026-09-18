"use client"

import {
  composeRenderProps,
  Switch as SwitchPrimitive,
  type SwitchProps,
} from "react-aria-components"
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
      className={composeRenderProps(className, (resolved) =>
        cn(
          // Inline-flex so the Switch only takes the width it needs. Indicator
          // first, then any children (label / description) to the right.
          "group inline-flex items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50",
          resolved,
        ),
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
              "border-quebi-line/30 bg-quebi-surface/10",
              // The on track's boundary is the mark token, not the fill token:
              // mint on the light page is 1.74:1, so a mint track edged in mint
              // left the switch with no outline there (task #145). Teal-600 is
              // 3.45:1 against the page; on dark the two tokens are the same
              // value, so nothing changes.
              values.isSelected && "border-quebi-brand-mark bg-quebi-brand",
              values.isFocusVisible &&
                "ring-2 ring-quebi-brand-mark ring-offset-2 ring-offset-quebi-bg",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                // 20x20 thumb, 2px inset from the track's outer edge, slides 20px
                // right when on. The offsets resolve against the track's padding
                // box, which the 1px border has already inset by 1px — so 2px of
                // visible gap is `px`, not `0.5`. That leaves 44 - 2*2 - 20 = 20px
                // of travel, which is what `translate-x-5` covers, so the on state
                // lands 2px from the right edge and the thumb is centered either way.
                "pointer-events-none absolute top-px left-px size-5 rounded-full bg-quebi-inverse-bg shadow-quebi-glow",
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
