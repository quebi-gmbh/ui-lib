"use client"

import type { FieldErrorProps, LabelProps, TextProps } from "react-aria-components"
import {
  FieldError as FieldErrorPrimitive,
  Label as LabelPrimitive,
  Text,
} from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { tv } from "tailwind-variants"
import { cx } from "@/lib/primitive"

/* Cellestial DS:
 *   .label → 13px, 600, ink-800
 *   .hint  → 12px, ink-500 (danger-600 when in error)
 * Field stack: label → input → hint, gap-1.5 (6px) between siblings.
 */

export const labelStyles = tv({
  base: "select-none font-body font-semibold text-[13px] text-ink-800 in-disabled:opacity-50 group-disabled:opacity-50",
})

export const descriptionStyles = tv({
  base: "block font-body text-[12px] text-ink-500 in-disabled:opacity-50 group-disabled:opacity-50",
})

export const fieldErrorStyles = tv({
  base: "block font-body text-[12px] text-danger-600 in-disabled:opacity-50 group-disabled:opacity-50 forced-colors:text-[Mark]",
})

export const fieldStyles = tv({
  base: [
    "w-full",
    // label → input → hint stack with 6px between siblings.
    "[&>[data-slot=label]+[data-slot=control]]:mt-1.5",
    "[&>[data-slot=label]+[slot='description']]:mt-1",
    "[&>[slot=description]+[data-slot=control]]:mt-1.5",
    "[&>[data-slot=control]+[slot=description]]:mt-1.5",
    "[&>[data-slot=control]+[slot=errorMessage]]:mt-1.5",
    "in-disabled:opacity-50 disabled:opacity-50",
  ],
})

export function Label({ className, ...props }: LabelProps) {
  return <LabelPrimitive data-slot="label" {...props} className={labelStyles({ className })} />
}

export function Description({ className, ...props }: TextProps) {
  return <Text {...props} slot="description" className={descriptionStyles({ className })} />
}

export function Fieldset({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={twMerge("*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6", className)}
      {...props}
    />
  )
}

export function FieldGroup({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div data-slot="control" className={twMerge("space-y-6", className)} {...props} />
}

export function FieldError({ className, ...props }: FieldErrorProps) {
  return <FieldErrorPrimitive {...props} className={cx(fieldErrorStyles(), className)} />
}

export function Legend({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="legend"
      {...props}
      className={twMerge("font-semibold text-base/6 data-disabled:opacity-50", className)}
    />
  )
}
