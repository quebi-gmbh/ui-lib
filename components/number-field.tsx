"use client"

import type { InputProps, NumberFieldProps } from "react-aria-components"
import { NumberField as NumberFieldPrimitive } from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { Input } from "@/components/ui/input"
import { cx } from "@/lib/primitive"
import { fieldStyles } from "./field"

const NumberField = ({ className, ...props }: NumberFieldProps) => {
  return (
    <NumberFieldPrimitive {...props} data-slot="control" className={cx(fieldStyles(), className)} />
  )
}

interface NumberInputProps extends Omit<InputProps, "prefix"> {
  /** Text / glyph rendered in a tag attached to the left edge (e.g. `£`). */
  prefix?: React.ReactNode
  /** Text / glyph rendered in a tag attached to the right edge (e.g. `GB`). */
  suffix?: React.ReactNode
}

/**
 * NumberInput renders the input for a NumberField, with optional prefix/suffix
 * addons that read as one unified control (shared focus ring, shared hover).
 *
 * Spec source: cellestial-ds/components.css → .input-group.
 */
function NumberInput({ prefix, suffix, className, ...props }: NumberInputProps) {
  if (!prefix && !suffix) {
    return <Input className={cx("tabular-nums", className)} {...props} />
  }

  return (
    <div
      data-slot="control"
      className={twMerge(
        // Group named `addons` so the prefix/suffix spans can react to the
        // wrapper's hover and focus-within state via `group-hover/addons:`.
        "group/addons flex items-stretch w-full rounded-sm transition-[box-shadow] duration-[200ms]",
        // Wrapper owns the outer focus ring so prefix/input/suffix highlight together.
        "focus-within:ring-4 focus-within:ring-brand-100",
        // Strip inner input's own ring (wrapper owns it).
        "[&_input:focus]:ring-0 [&_input:focus]:ring-transparent",
      )}
    >
      {prefix ? (
        <span
          data-slot="addon"
          className="inline-flex items-center pointer-events-none select-none px-3 bg-ink-50 text-ink-500 border border-r-0 border-ink-200 text-[13px] font-medium rounded-s-sm transition-[border-color] duration-[200ms] group-hover/addons:border-ink-400 group-focus-within/addons:border-brand-500!"
        >
          {prefix}
        </span>
      ) : null}
      <Input
        className={cx(
          "tabular-nums",
          prefix && "rounded-s-none",
          suffix && "rounded-e-none",
          className,
        )}
        {...props}
      />
      {suffix ? (
        <span
          data-slot="addon"
          className="inline-flex items-center pointer-events-none select-none px-3 bg-ink-50 text-ink-500 border border-l-0 border-ink-200 text-[13px] font-medium rounded-e-sm transition-[border-color] duration-[200ms] group-hover/addons:border-ink-400 group-focus-within/addons:border-brand-500!"
        >
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

export type { NumberFieldProps }
export { NumberField, NumberInput }
