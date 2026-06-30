"use client"

import type { TextFieldProps } from "react-aria-components"
import { TextField as TextFieldPrimitive } from "react-aria-components"
import { cn } from "@/lib/utils"

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
      {...props}
    />
  )
}
