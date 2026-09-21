"use client"

import type { TextFieldProps } from "react-aria-components"
import { composeRenderProps, TextField as TextFieldPrimitive } from "react-aria-components"
import { cn } from "@/lib/utils"
import { fieldStyles } from "@/components/field"

/**
 * TextField — quebi design system
 *
 * Built on react-aria-components. A thin wrapper that lays out the
 * label → control → hint stack with consistent spacing, ready to compose
 * with the Label, Description, FieldError, and Input primitives. Pass an
 * Input as the control; the field threads value, validation, and disabled
 * state down to it accessibly.
 */
export function TextField({ className, ...props }: TextFieldProps) {
  return (
    <TextFieldPrimitive
      data-slot="control"
      // The stack from the one place that owns it. This file used to carry a
      // verbatim copy of `Field`'s five selectors — one of four such copies.
      className={composeRenderProps(className, (resolved) => cn(fieldStyles, resolved))}
      {...props}
    />
  )
}
