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
 * Built on react-aria-components. An 18px box edged in `fg-muted`; checked
 * and indeterminate are state, so they fill with `signal` and draw the glyph
 * in `on-signal`.
 * Focus is the outward ring; invalid edges (and, checked, fills) the box in
 * `danger`.
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
              // A box edged in `fg-muted`. Shape is what tells a reader whether
              // a group takes one answer or several, so the box only ever takes
              // the small mark radius — the radio beside it is the round one.
              "relative flex size-[18px] shrink-0 items-center justify-center rounded-(--q-radius-mark) border-(length:--q-border-control) border-quebi-fg-muted bg-transparent",
              "transition-colors duration-150",
              // Checked and indeterminate are state: `signal` fill, `on-signal` glyph.
              "group-data-[selected]:border-quebi-signal group-data-[selected]:bg-quebi-signal",
              "group-data-[indeterminate]:border-quebi-signal group-data-[indeterminate]:bg-quebi-signal",
              "group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-quebi-focus group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-offset-quebi-bg",
              isInvalid &&
                "border-quebi-danger group-data-[focus-visible]:ring-quebi-danger/50 group-data-[selected]:border-quebi-danger group-data-[selected]:bg-quebi-danger",
            )}
          >
            {isIndeterminate ? (
              <Minus className="size-3 text-quebi-on-signal" strokeWidth={3} aria-hidden="true" />
            ) : isSelected ? (
              <span
                aria-hidden="true"
                className="block h-[9px] w-[5px] -translate-y-px rotate-45 border-quebi-on-signal border-r-2 border-b-2"
              />
            ) : null}
          </span>
          {children != null && (
            <span
              data-slot="label"
              // `min-w-0 flex-1`, so a label that wants to be a *row* can be
              // one. A facet option is "name … count", and the count is a
              // column: without this the label shrinks to its text and a
              // `w-full justify-between` inside it has nothing to justify
              // against, so every count lands right after its own label — eight
              // rows, eight x positions, and a third of each row empty to the
              // right of the number. It changes nothing for a label that is
              // only text, which is every other checkbox in the library.
              className="min-w-0 flex-1 text-sm text-quebi-fg select-none"
            >
              {children}
            </span>
          )}
        </>
      ))}
    </CheckboxPrimitive>
  )
}
