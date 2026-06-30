"use client"

import type { FieldErrorProps, LabelProps, TextProps } from "react-aria-components"
import {
  composeRenderProps,
  FieldError as FieldErrorPrimitive,
  Label as LabelPrimitive,
  Text,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Field primitives — quebi design system
 *
 * Built on react-aria-components. A small set of building blocks for composing
 * accessible form fields: a Label, a muted Description hint, a red FieldError
 * message, plus Field/Fieldset/Legend wrappers that lay out the
 * label → control → hint stack with consistent spacing.
 */

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive
      data-slot="label"
      {...props}
      className={cn(
        "select-none font-semibold text-[13px] text-white",
        "in-disabled:opacity-50 group-disabled:opacity-50",
        className,
      )}
    />
  )
}

export function Description({ className, ...props }: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={cn(
        "block text-[12px] text-quebi-fg-muted",
        "in-disabled:opacity-50 group-disabled:opacity-50",
        className,
      )}
    />
  )
}

export function FieldError({ className, ...props }: FieldErrorProps) {
  return (
    <FieldErrorPrimitive
      {...props}
      className={composeRenderProps(className, (className) =>
        cn(
          "block text-[12px] text-red-500",
          "in-disabled:opacity-50 group-disabled:opacity-50",
          "forced-colors:text-[Mark]",
          className,
        ),
      )}
    />
  )
}

export function Field({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "w-full",
        // label → control → hint stack with 6px between siblings.
        "[&>[data-slot=label]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=label]+[slot='description']]:mt-1",
        "[&>[slot=description]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=control]+[slot=description]]:mt-1.5",
        "[&>[data-slot=control]+[slot=errorMessage]]:mt-1.5",
        "in-disabled:opacity-50 disabled:opacity-50",
        className,
      )}
    />
  )
}

export function Fieldset({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={cn("*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6", className)}
      {...props}
    />
  )
}

export function FieldGroup({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div data-slot="control" className={cn("space-y-6", className)} {...props} />
}

export function Legend({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="legend"
      {...props}
      className={cn("font-semibold text-base/6 text-white data-disabled:opacity-50", className)}
    />
  )
}
