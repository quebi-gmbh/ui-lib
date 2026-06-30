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
      className={cn("flex flex-col gap-3", className)}
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
              "border-cyan-500/30",
              "group-data-[selected]:border-quebi-brand group-data-[selected]:bg-quebi-brand",
              "group-data-[indeterminate]:border-quebi-brand group-data-[indeterminate]:bg-quebi-brand",
              "group-data-[focus-visible]:ring-2 group-data-[focus-visible]:ring-quebi-brand/50 group-data-[focus-visible]:ring-offset-2 group-data-[focus-visible]:ring-offset-quebi-bg",
              isInvalid &&
                "border-red-500 group-data-[focus-visible]:ring-red-500/50 group-data-[selected]:border-red-500 group-data-[selected]:bg-red-500",
            )}
          >
            {isIndeterminate ? (
              <Minus className="size-3 text-quebi-bg" strokeWidth={3} aria-hidden="true" />
            ) : isSelected ? (
              <span
                aria-hidden="true"
                className="block h-[9px] w-[5px] -translate-y-px rotate-45 border-quebi-bg border-r-2 border-b-2"
              />
            ) : null}
          </span>
          {children != null && (
            <span data-slot="label" className="text-sm text-white select-none">
              {children}
            </span>
          )}
        </>
      ))}
    </CheckboxPrimitive>
  )
}
