"use client"

import {
  Group,
  type GroupProps,
  Input as InputPrimitive,
  type InputProps as PrimitiveInputProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Input — quebi design system
 *
 * Built on react-aria-components. A translucent field with a cyan-tinted
 * border; focus lifts the border to brand teal and adds the quebi teal ring.
 * Invalid uses red; disabled dims and blocks interaction.
 */
interface InputProps extends PrimitiveInputProps {
  ref?: React.RefObject<HTMLInputElement>
}

export function Input({ className, ref, ...props }: InputProps) {
  return (
    <span data-slot="control" className="relative block w-full">
      <InputPrimitive
        ref={ref}
        className={cn(
          "relative block w-full appearance-none text-sm text-white placeholder:text-quebi-fg-subtle",
          "rounded-quebi-sm border border-cyan-500/20 bg-white/[0.02] px-3 py-2.5",
          "transition-[border-color,box-shadow] duration-200",
          "enabled:hover:border-cyan-500/40",
          "outline-none focus:outline-none focus:border-quebi-brand focus:ring-2 focus:ring-quebi-brand/50",
          "invalid:border-red-500 focus:invalid:ring-red-500/50",
          "[&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "in-disabled:opacity-50",
          "scheme-dark",
          className,
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
      className={cn(
        "relative isolate block w-full",
        // icon / text padding
        "has-[>[data-slot=icon]:first-child]:[&_input]:ps-10 has-[>[data-slot=icon]:last-child]:[&_input]:pe-10",
        "has-[>[data-slot=text]:first-child]:[&_input]:ps-10 has-[>[data-slot=text]:last-child]:[&_input]:pe-10",
        // icon positioning
        "*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-1/2 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-4 *:data-[slot=icon]:-translate-y-1/2",
        "[&>[data-slot=icon]:first-child]:start-3 [&>[data-slot=icon]:last-child]:end-3",
        // text positioning
        "*:data-[slot=text]:pointer-events-none *:data-[slot=text]:absolute *:data-[slot=text]:top-1/2 *:data-[slot=text]:z-10 *:data-[slot=text]:-translate-y-1/2",
        "[&>[data-slot=text]:first-child]:start-3 [&>[data-slot=text]:last-child]:end-3",
        // button positioning
        "has-[>button:first-child]:[&_input]:ps-14 has-[>button:last-child]:[&_input]:pe-14",
        "[&>button:first-child]:rounded-e-none [&>button:last-child]:rounded-s-none",
        "*:[button]:absolute *:[button]:top-0 *:[button]:z-10 *:[button]:h-full",
        "[&>button:first-child]:start-0 [&>button:last-child]:end-0",
        // default muted color for adornments
        "[&>[data-slot=icon]:not([class*=text-])]:text-quebi-fg-subtle [&>[data-slot=text]:not([class*=text-])]:text-quebi-fg-subtle",
        className,
      )}
      {...props}
    />
  )
}
