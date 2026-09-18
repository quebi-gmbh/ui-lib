"use client"

import { Minus } from "lucide-react"
import {
  CheckboxGroup as CheckboxGroupPrimitive,
  type CheckboxGroupProps,
  Checkbox as CheckboxPrimitive,
  type CheckboxProps,
  composeRenderProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Checkbox — quebi design system
 *
 * Built on react-aria-components. An 18px square with a cyan-tinted border;
 * selected state fills with brand teal and shows a chunky check glyph. Focus
 * uses the quebi teal ring; invalid uses red.
 */
export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive
      {...props}
      data-slot="control"
      className={composeRenderProps(className, (resolved) => cn("flex flex-col gap-3", resolved))}
    />
  )
}

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive
      data-slot="control"
      className={composeRenderProps(className, (className) =>
        cn("group flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed", className),
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { isSelected, isIndeterminate, isInvalid }) => (
        <>
          <span
            data-slot="indicator"
            className={cn(
              "relative flex size-[18px] shrink-0 items-center justify-center rounded-quebi-sm border bg-transparent",
              "transition-colors duration-150",
              "border-quebi-line/30",
              // The checked box's boundary against the page is drawn in the
              // *mark* token: mint on `#f4f6f6` is 1.74:1, so a mint square
              // edged in mint had no visible outline on the light page at all
              // (task #145). Teal-600 reaches 3.45:1 there — 1.4.11's bar for
              // the boundary of a control whose state is information — and on
              // dark `--q-brand-mark` *is* `--q-brand`, so nothing changes.
              "group-data-[selected]:border-quebi-brand-mark group-data-[selected]:bg-quebi-brand",
              "group-data-[indeterminate]:border-quebi-brand-mark group-data-[indeterminate]:bg-quebi-brand",
              "group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-quebi-brand-mark group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-offset-quebi-bg",
              isInvalid &&
                "border-red-500 group-data-[focus-visible]:ring-red-500/50 group-data-[selected]:border-red-500 group-data-[selected]:bg-red-500",
            )}
          >
            {isIndeterminate ? (
              <Minus className="size-3 text-quebi-on-brand" strokeWidth={3} aria-hidden="true" />
            ) : isSelected ? (
              // The tick is drawn in `on-brand`, the token for anything sitting
              // ON a mint fill (7.81:1 in both themes), not in the page colour.
              // `border-quebi-bg` only looked right on dark, where the page
              // happens to be near-black; on light it painted a `#f4f6f6` tick
              // on mint — 1.74:1, the checked state invisible from inside as
              // well as out (task #145).
              <span
                aria-hidden="true"
                className="block h-[9px] w-[5px] -translate-y-px rotate-45 border-quebi-on-brand border-r-2 border-b-2"
              />
            ) : null}
          </span>
          {children != null && (
            <span data-slot="label" className="text-sm text-quebi-fg select-none">
              {children}
            </span>
          )}
        </>
      ))}
    </CheckboxPrimitive>
  )
}
