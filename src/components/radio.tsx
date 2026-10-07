"use client"

import type { RadioGroupProps, RadioProps } from "react-aria-components"
import {
  composeRenderProps,
  Label as LabelPrimitive,
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Radio — quebi design system
 *
 * Built on react-aria-components. An 18px circle edged in `fg-muted`;
 * selected is state, so it edges the circle in `signal` and draws a `signal`
 * dot in its centre. Round because it is the single-answer
 * control — the square beside it is the checkbox. Focus is the outward ring;
 * invalid edges the circle (and colours the dot) in `danger`.
 *
 * The group's own `Label` is the mono field label; an option's label is
 * running text, which is what `RadioLabel` sets.
 */
export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      {...props}
      data-slot="control"
      className={composeRenderProps(className, (className) =>
        cn(
          "flex flex-col gap-3",
          "has-[[slot=description]]:gap-6",
          className,
        ),
      )}
    />
  )
}

export function Radio({ className, children, ...props }: RadioProps) {
  return (
    <RadioPrimitive
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("group block disabled:opacity-50 disabled:cursor-not-allowed", className),
      )}
    >
      {composeRenderProps(children, (children, { isSelected, isFocusVisible, isInvalid }) => {
        const isStringChild = typeof children === "string"
        const content = isStringChild ? <RadioLabel>{children}</RadioLabel> : children

        return (
          <div
            className={cn(
              "grid grid-cols-[1.125rem_1fr] gap-x-3 gap-y-1",
              "*:data-[slot=indicator]:col-start-1 *:data-[slot=indicator]:row-start-1 *:data-[slot=indicator]:mt-0.5",
              "*:data-[slot=label]:col-start-2 *:data-[slot=label]:row-start-1",
              "*:[[slot=description]]:col-start-2 *:[[slot=description]]:row-start-2",
              "has-[[slot=description]]:**:data-[slot=label]:font-medium",
            )}
          >
            <span
              data-slot="indicator"
              className={cn(
                "relative flex size-[18px] shrink-0 items-center justify-center rounded-full border border-quebi-fg-muted bg-transparent",
                "transition-colors duration-150",
                "before:content-[''] before:size-2 before:rounded-full",
                isSelected && "border-quebi-signal before:bg-quebi-signal",
                isFocusVisible &&
                  "ring-2 ring-quebi-focus ring-offset-2 ring-offset-quebi-bg",
                isInvalid && "border-quebi-danger",
                isInvalid && isSelected && "before:bg-quebi-danger",
                isInvalid && isFocusVisible && "ring-quebi-danger/50",
              )}
            />
            {content}
          </div>
        )
      })}
    </RadioPrimitive>
  )
}

/**
 * An option's label: running text, not the mono field label. Medium weight
 * when the option carries a description under it, so the two read as a title
 * and its gloss.
 */
export function RadioLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive>) {
  return (
    <LabelPrimitive
      data-slot="label"
      elementType="span"
      {...props}
      className={cn("select-none text-sm text-quebi-fg", className)}
    />
  )
}
