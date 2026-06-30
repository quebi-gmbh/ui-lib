"use client"

import { Switch as SwitchPrimitive, type SwitchProps } from "react-aria-components"
import { twJoin, twMerge } from "tailwind-merge"
import { cx } from "@/lib/primitive"
import { Label } from "./field"

export function Switch({ children, className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive
      {...props}
      data-slot="control"
      className={cx(
        // Inline-flex so the Switch only takes the width it needs. Indicator
        // first, then any children (label / description) to the right.
        "group inline-flex items-center gap-3 cursor-default disabled:opacity-50",
        className,
      )}
      style={({ defaultStyle }) => ({
        ...defaultStyle,
        WebkitTapHighlightColor: "transparent",
      })}
    >
      {(values) => (
        <>
          {/* Cellestial DS .toggle → 44x24 track, ink-200 off / brand-500 on. */}
          <span
            data-slot="indicator"
            className={twMerge(
              // w-[44px] explicit: my @theme overrode --spacing-11 to 80px (Cellestial
              // s-11), so `w-11` is no longer 44. The spec toggle is 44×24.
              "relative isolate inline-flex h-6 w-[44px] cursor-default rounded-pill",
              "transition-[background-color] duration-[200ms]",
              "bg-ink-200",
              values.isSelected && "bg-brand-500",
              values.isFocusVisible && "ring-4 ring-brand-100",
            )}
          >
            <span
              aria-hidden="true"
              className={twJoin(
                // 20x20 thumb, 2px inset from top-left, slides 20px right when on.
                "pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-1",
                "transition-transform duration-[200ms] ease-spring",
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
