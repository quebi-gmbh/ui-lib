"use client"

import type { RadioGroupProps, RadioProps } from "react-aria-components"
import {
  composeRenderProps,
  RadioGroup as RadioGroupPrimitive,
  Radio as RadioPrimitive,
} from "react-aria-components"
import { Label } from "@/components/field"
import { cn } from "@/lib/utils"

/**
 * Radio — quebi design system
 *
 * Built on react-aria-components. An 18px circle with a cyan-tinted border;
 * selected state fills with brand teal and shows a white center dot. Focus
 * uses the quebi teal ring; invalid uses red.
 */
export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      {...props}
      data-slot="control"
      className={composeRenderProps(className, (className) =>
        cn(
          "flex flex-col gap-3 **:data-[slot=label]:font-normal",
          "has-[[slot=description]]:gap-6 has-[[slot=description]]:**:data-[slot=label]:font-medium",
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
                "relative flex size-[18px] shrink-0 items-center justify-center rounded-full border bg-transparent",
                "transition-colors duration-150",
                "border-cyan-500/30",
                "before:content-[''] before:size-2 before:rounded-full",
                isSelected && "border-quebi-brand bg-quebi-brand before:bg-quebi-bg",
                isFocusVisible &&
                  "ring-2 ring-quebi-brand/50 ring-offset-2 ring-offset-quebi-bg",
                isInvalid && "border-red-500",
                isInvalid && isSelected && "bg-red-500",
                isInvalid && isFocusVisible && "ring-red-500/50",
              )}
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
