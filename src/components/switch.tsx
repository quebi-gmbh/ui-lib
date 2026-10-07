"use client"

import {
  composeRenderProps,
  Label as LabelPrimitive,
  Switch as SwitchPrimitive,
  type SwitchProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Switch — quebi design system
 *
 * Built on react-aria-components. A 44x24 pill: off is an `fg-muted`-edged
 * track with an `fg-muted` thumb; on is state, so it fills the track with
 * `signal` and turns the thumb `on-signal` as it slides 20px right. Focus is the outward ring. A string
 * child is set as running text, not as the mono field label.
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
              "transition-colors duration-150",
              "border-quebi-fg-muted bg-transparent",
              values.isSelected && "border-quebi-signal bg-quebi-signal",
              values.isFocusVisible &&
                "ring-2 ring-quebi-focus ring-offset-2 ring-offset-quebi-bg",
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
                "pointer-events-none absolute top-px left-px size-5 rounded-full bg-quebi-fg-muted",
                "transition-[translate,background-color] duration-150",
                values.isSelected && "translate-x-5 bg-quebi-on-signal",
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

/** The switch's own label: running text beside the track. */
export function SwitchLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive>) {
  return (
    <LabelPrimitive
      data-slot="label"
      elementType="span"
      {...props}
      className={cn("select-none text-sm text-quebi-fg", className)}
    />
  )
}
