import { MinusIcon } from "@heroicons/react/20/solid"
import type { CheckboxGroupProps, CheckboxProps } from "react-aria-components"
import {
  CheckboxGroup as CheckboxGroupPrimitive,
  Checkbox as CheckboxPrimitive,
  composeRenderProps,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { cx } from "@/lib/primitive"
import { Label } from "./field"

export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <CheckboxGroupPrimitive
      {...props}
      data-slot="control"
      className={cx(
        "space-y-3 has-[[slot=description]]:space-y-6 has-[[slot=description]]:**:data-[slot=label]:font-medium **:[[slot=description]]:block",
        className,
      )}
    />
  )
}

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive
      data-slot="control"
      className={cx(
        "group block [--indicator-mt:--spacing(0.75)] disabled:opacity-50 sm:[--indicator-mt:--spacing(1)]",
        className,
      )}
      {...props}
    >
      {composeRenderProps(
        children,
        (children, { isSelected, isIndeterminate, isFocusVisible, isInvalid }) => {
          const isStringChild = typeof children === "string"
          /* Cellestial DS checkmark: 5×9 rectangle, rotated 45deg, 2px borders on
           * right+bottom — reads as a chunky ✓ glyph (not a thin stroke). */
          const indicator = isIndeterminate ? (
            <MinusIcon data-slot="check-indicator" />
          ) : isSelected ? (
            <span
              data-slot="check-indicator"
              aria-hidden="true"
              className="block w-[5px] h-[9px] border-solid border-white border-r-2 border-b-2 rotate-45 -translate-y-[1px]"
            />
          ) : null

          const content = isStringChild ? <CheckboxLabel>{children}</CheckboxLabel> : children

          return (
            <div
              className={twMerge(
                "grid grid-cols-[1.125rem_1fr] gap-y-1 has-data-[slot=label]:gap-x-3 sm:grid-cols-[1rem_1fr]",
                "*:data-[slot=indicator]:col-start-1 *:data-[slot=indicator]:row-start-1 *:data-[slot=indicator]:mt-(--indicator-mt)",
                "*:data-[slot=label]:col-start-2 *:data-[slot=label]:row-start-1",
                "*:[[slot=description]]:col-start-2 *:[[slot=description]]:row-start-2",
                "has-[[slot=description]]:**:data-[slot=label]:font-medium",
              )}
            >
              {/* Cellestial DS .checkbox → 18px square, ink-300 border, surface bg.
                  Selected: brand-500 bg + border + white check glyph. */}
              <span
                data-slot="indicator"
                className={twMerge([
                  "relative isolate flex shrink-0 items-center justify-center size-[18px] rounded-xs bg-surface border border-ink-300",
                  "transition-[background-color,border-color] duration-[120ms]",
                  // Indeterminate (MinusIcon) needs sizing; the selected ✓ uses its own literal w/h.
                  "[&>svg[data-slot=check-indicator]]:size-3 [&>svg[data-slot=check-indicator]]:text-white",
                  "in-disabled:bg-ink-50 in-disabled:border-ink-200",
                  (isSelected || isIndeterminate) && "bg-brand-500 border-brand-500",
                  isFocusVisible && "ring-4 ring-brand-100",
                  isInvalid && "border-danger-500",
                  isInvalid && isFocusVisible && "ring-danger-100",
                ])}
              >
                {indicator}
              </span>
              {content}
            </div>
          )
        },
      )}
    </CheckboxPrimitive>
  )
}

export function CheckboxLabel(props: React.ComponentProps<typeof Label>) {
  return <Label elementType="span" {...props} />
}
