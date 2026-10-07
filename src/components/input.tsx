"use client"

import {
  composeRenderProps,
  Group,
  type GroupProps,
  Input as InputPrimitive,
  type InputProps as PrimitiveInputProps,
} from "react-aria-components"
import { useFieldSizing } from "@/lib/field-size"
import { cn } from "@/lib/utils"

/**
 * The field size scale.
 *
 * A field's height is line-height + padding + 1px of border top and bottom, so
 * `xs` (30px) and `sm` (38px) are exactly `Button`'s `xs` and `sm`: put one of
 * each in a row and they share a baseline and a height. `md` is the default
 * and is 42px. The top border is transparent — the field is drawn by its
 * underline alone — but it is kept so the arithmetic, and the row, still hold.
 *
 * No horizontal padding: an underlined field's text starts on the same line as
 * the label above it. `InputGroup` adds the inset an icon or addon needs.
 *
 * Kept as a plain record rather than imported from a sibling: the three field
 * primitives are copied out one at a time, and a shared module would make
 * `Input` a registry dependency of `Select`.
 */
export const inputSizeStyles = {
  xs: "text-xs px-(--q-field-px) py-1.5",
  sm: "text-sm px-(--q-field-px) py-2",
  md: "text-sm px-(--q-field-px) py-2.5",
} as const

export type InputSize = keyof typeof inputSizeStyles

/**
 * Input — quebi design system
 *
 * Built on react-aria-components. Underline-only: no fill, no side or top
 * border, a `rule` line under the text. Invalid turns the line `danger`;
 * disabled dims and blocks interaction.
 *
 * ## Focus, which this component is the canonical copy of
 *
 * A text field is the one control in the library that draws no ring. Focus
 * thickens the underline to 2px with an inset shadow on top of the 1px border,
 * so nothing moves when the caret arrives. Every field-shaped trigger (Select,
 * ComboBox, the date pickers, NumberField, TagField, …) copies this so a form
 * reads as one family. Everything else — buttons, boxes, cells — keeps the
 * outward `ring-2 ring-offset-3` ring, or `ring-inset` where there is no room.
 */
interface InputProps extends Omit<PrimitiveInputProps, "size"> {
  ref?: React.RefObject<HTMLInputElement>
  /**
   * Control height. Shadows the `<input size>` attribute, which sizes a field
   * in characters and is superseded by every width class this library ships.
   *
   * Left out, it is whatever the surrounding surface asked for — a table cell
   * being the one that does — and `md` where nothing asked. See
   * `@/lib/field-size`.
   */
  size?: InputSize
}

export function Input({ className, ref, size: sizeProp, ...props }: InputProps) {
  const { size } = useFieldSizing({ size: sizeProp })
  return (
    <span data-slot="control" className="relative block w-full">
      <InputPrimitive
        ref={ref}
        className={composeRenderProps(className, (resolved) =>
          cn(
            "relative block w-full appearance-none bg-transparent text-quebi-fg placeholder:text-quebi-fg-subtle",
            "quebi-field",
            inputSizeStyles[size],
            "transition-[border-color,box-shadow] duration-150",
            "outline-none focus:outline-none focus:shadow-[inset_0_-1px_0_var(--color-quebi-focus)]",
            "invalid:border-b-quebi-danger focus:invalid:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
            "data-invalid:border-b-quebi-danger focus:data-invalid:shadow-[inset_0_-1px_0_var(--color-quebi-danger)]",
            "[&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "in-disabled:opacity-50",
            resolved,
          ),
        )}
        {...props}
      />
    </span>
  )
}

/**
 * InputGroup — wraps an Input with an attached icon, text, or button.
 *
 * Drop an element with `data-slot="icon"` (or `data-slot="text"`) as the
 * first/last child to render it inside the field; the input gains matching
 * padding automatically. A leading/trailing `<button>` reads as one control.
 *
 * Usage:
 *   <InputGroup>
 *     <SearchIcon data-slot="icon" />
 *     <Input placeholder="Search" />
 *   </InputGroup>
 */
export function InputGroup({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="control"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "relative isolate block w-full",
          // icon / text padding: the adornment sits on the field's edge, the
          // text starts 8px past it.
          "has-[>[data-slot=icon]:first-child]:[&_input]:ps-6 has-[>[data-slot=icon]:last-child]:[&_input]:pe-6",
          "has-[>[data-slot=text]:first-child]:[&_input]:ps-7 has-[>[data-slot=text]:last-child]:[&_input]:pe-7",
          // icon positioning
          "*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-1/2 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-4 *:data-[slot=icon]:-translate-y-1/2",
          "[&>[data-slot=icon]:first-child]:start-0 [&>[data-slot=icon]:last-child]:end-0",
          // text positioning
          "*:data-[slot=text]:pointer-events-none *:data-[slot=text]:absolute *:data-[slot=text]:top-1/2 *:data-[slot=text]:z-10 *:data-[slot=text]:-translate-y-1/2",
          "[&>[data-slot=text]:first-child]:start-0 [&>[data-slot=text]:last-child]:end-0",
          // button positioning
          "has-[>button:first-child]:[&_input]:ps-10 has-[>button:last-child]:[&_input]:pe-10",
          "*:[button]:absolute *:[button]:top-0 *:[button]:z-10 *:[button]:h-full",
          "[&>button:first-child]:start-0 [&>button:last-child]:end-0",
          // default muted color for adornments
          "[&>[data-slot=icon]:not([class*=text-])]:text-quebi-fg-subtle [&>[data-slot=text]:not([class*=text-])]:text-quebi-fg-subtle",
          resolved,
        ),
      )}
      {...props}
    />
  )
}
