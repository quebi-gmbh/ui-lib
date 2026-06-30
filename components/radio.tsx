import type { RadioGroupProps, RadioProps } from "react-aria-components"
import {
  composeRenderProps,
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { cx } from "@/lib/primitive"
import { Label } from "./field"

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      {...props}
      data-slot="control"
      className={cx(
        "space-y-3 **:data-[slot=label]:font-normal",
        "has-[slot=description]:space-y-6 has-[[slot=description]]:**:data-[slot=label]:font-medium",
        className,
      )}
    />
  )
}

export function Radio({ className, children, ...props }: RadioProps) {
  return (
    <RadioPrimitive {...props} className={cx("group block disabled:opacity-50", className)}>
      {composeRenderProps(children, (children, { isSelected, isFocusVisible, isInvalid }) => {
        const isStringChild = typeof children === "string"
        const content = isStringChild ? <RadioLabel>{children}</RadioLabel> : children

        return (
          <div
            className={twMerge(
              "grid grid-cols-[1.125rem_1fr] gap-x-3 gap-y-1 sm:grid-cols-[1rem_1fr]",
              "*:data-[slot=indicator]:col-start-1 *:data-[slot=indicator]:row-start-1 *:data-[slot=indicator]:mt-0.75 sm:*:data-[slot=indicator]:mt-1",
              "*:data-[slot=label]:col-start-2 *:data-[slot=label]:row-start-1",
              "*:[[slot=description]]:col-start-2 *:[[slot=description]]:row-start-2",
              "has-[[slot=description]]:**:data-[slot=label]:font-medium",
            )}
          >
            {/* Cellestial DS .radio → 18px circle, ink-300 border, surface bg.
                Selected: brand-500 bg/border + 8px white dot. */}
            <span
              data-slot="indicator"
              className={twMerge([
                "relative isolate flex shrink-0 items-center justify-center size-[18px] rounded-full bg-surface border border-ink-300",
                "transition-[background-color,border-color] duration-[120ms]",
                "before:content-[''] before:size-2 before:rounded-full",
                "in-disabled:bg-ink-50 in-disabled:border-ink-200",
                isSelected && "bg-brand-500 border-brand-500 before:bg-white",
                isFocusVisible && "ring-4 ring-brand-100",
                isInvalid && "border-danger-500",
                isInvalid && isFocusVisible && "ring-danger-100",
              ])}
            />
            {content}
          </div>
        )
      })}
    </RadioPrimitive>
  )
}

export function RadioLabel(props: React.ComponentProps<typeof Label>) {
  return <Label elementType="span" {...props} />
}
