import {
  Group,
  type GroupProps,
  Input as InputPrimitive,
  type InputProps as PrimitiveInputProps,
} from "react-aria-components"
import { cx } from "@/lib/primitive"

interface InputProps extends PrimitiveInputProps {
  ref?: React.RefObject<HTMLInputElement>
}

export function Input({ className, ref, ...props }: InputProps) {
  return (
    <span data-slot="control" className="relative block w-full">
      <InputPrimitive
        ref={ref}
        className={cx(
          // Cellestial DS .input → font-body 14px, py-2.5 px-3, bg surface,
          // ink-200 border, rounded-sm, ink-900 text. leading-[17px] keeps the
          // total height at the spec's 39px (10 + 17 + 10 + 1 + 1) — without
          // it, browsers render `line-height: normal` taller and the input
          // ends up 3–4px over.
          "relative block w-full appearance-none font-body! text-[14px]! leading-[17px]! text-ink-900! placeholder:text-ink-400",
          "bg-surface border border-ink-200 rounded-sm px-3 py-2.5",
          "transition-[border-color,box-shadow] duration-[200ms]",
          // hover: ink-400.
          "enabled:hover:border-ink-400",
          // focus: brand-500 border + 2px brand-200 ring. `!` so focus beats hover.
          "outline-none focus:outline-none focus:border-brand-500! focus:ring-2! focus:ring-brand-200",
          // invalid wins over hover/focus via `!` so the red border stays.
          "invalid:border-danger-500! focus:invalid:ring-danger-100",
          "[&::-ms-reveal]:hidden [&::-webkit-search-cancel-button]:hidden",
          "disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed",
          "in-disabled:bg-ink-50 in-disabled:text-ink-400",
          "dark:scheme-dark",
          className,
        )}
        {...props}
      />
    </span>
  )
}

/**
 * InputAddons — Cellestial DS .input-group pattern.
 *
 * Wraps an Input plus attached prefix/suffix tags (e.g. currency symbol, unit).
 * The prefix/suffix use ink-50 bg + ink-500 text + ink-200 border, and the
 * input's corresponding corners lose their radius so it reads as one control.
 *
 * Usage:
 *   <InputAddons>
 *     <InputPrefix>£</InputPrefix>
 *     <Input />
 *   </InputAddons>
 */

export function InputGroup({ className, ...props }: GroupProps) {
  return (
    <Group
      data-slot="control"
      className={cx(
        "relative isolate block",
        // icon
        "has-[>[data-slot=icon]:first-child]:[&_input]:ps-10 has-[>[data-slot=icon]:last-child]:[&_input]:pe-10 sm:has-[>[data-slot=icon]:first-child]:[&_input]:ps-8 sm:has-[>[data-slot=icon]:last-child]:[&_input]:pe-8",
        "*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-3 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:top-2.5 sm:*:data-[slot=icon]:size-4",
        "[&>[data-slot=icon]:first-child]:start-3 sm:[&>[data-slot=icon]:first-child]:start-2.5 [&>[data-slot=icon]:last-child]:end-3 sm:[&>[data-slot=icon]:last-child]:end-2.5",

        // loader
        "has-[[data-slot=loader]:first-child]:[&_input]:ps-10 has-[[data-slot=loader]:last-child]:[&_input]:pe-10 sm:has-[[data-slot=loader]:first-child]:[&_input]:ps-8 sm:has-[[data-slot=loader]:last-child]:[&_input]:pe-8",
        "*:data-[slot=loader]:pointer-events-none *:data-[slot=loader]:absolute *:data-[slot=loader]:top-3 *:data-[slot=loader]:z-10 *:data-[slot=loader]:size-5 sm:*:data-[slot=loader]:top-2.5 sm:*:data-[slot=loader]:size-4",
        "[&>[data-slot=loader]:first-child]:start-3 sm:[&>[data-slot=loader]:first-child]:start-2.5 [&>[data-slot=loader]:last-child]:end-3 sm:[&>[data-slot=loader]:last-child]:end-2.5",

        // text
        "has-[[data-slot=text]:first-child]:[&_input]:ps-[calc(var(--input-gutter-start)+--spacing(2))] has-[[data-slot=text]:last-child]:[&_input]:pe-[calc(var(--input-gutter-end)+--spacing(2))] sm:has-[[data-slot=text]:first-child]:[&_input]:ps-(--input-gutter-start,--spacing(10)) sm:has-[[data-slot=text]:last-child]:[&_input]:pe-(--input-gutter-end,--spacing(10))",
        "*:data-[slot=text]:absolute *:data-[slot=text]:top-0 *:data-[slot=text]:z-10 *:data-[slot=text]:h-full *:data-[slot=text]:max-w-fit *:data-[slot=text]:grow *:data-[slot=text]:content-center [&>[data-slot='text']:not([class*='pointer-events'])]:pointer-events-none",
        "[&>[data-slot=text]:first-child:not([class*='start-'])]:start-3 sm:[&>[data-slot=text]:first-child:not([class*='start-'])]:start-2.5 [&>[data-slot=text]:last-child:not([class*='end-'])]:end-3 sm:[&>[data-slot=text]:last-child:not([class*='end-'])]:end-2.5",

        // keyboard
        "has-[[data-slot=keyboard]:first-child]:[&_input]:ps-[calc(var(--input-gutter-start)+--spacing(2))] has-[[data-slot=keyboard]:last-child]:[&_input]:pe-[calc(var(--input-gutter-end)+--spacing(2))] sm:has-[[data-slot=keyboard]:first-child]:[&_input]:ps-(--input-gutter-start,--spacing(10)) sm:has-[[data-slot=keyboard]:last-child]:[&_input]:pe-(--input-gutter-end,--spacing(10))",
        "*:data-[slot=keyboard]:absolute *:data-[slot=keyboard]:top-0 *:data-[slot=keyboard]:z-10 *:data-[slot=keyboard]:h-full *:data-[slot=keyboard]:max-w-fit *:data-[slot=keyboard]:grow *:data-[slot=keyboard]:content-center [&>[data-slot='keyboard']:not([class*='pointer-events'])]:pointer-events-none",
        "[&>[data-slot=keyboard]:first-child:not([class*='start-'])]:start-3 sm:[&>[data-slot=keyboard]:first-child:not([class*='start-'])]:start-2.5 [&>[data-slot=keyboard]:last-child:not([class*='end-'])]:end-3 sm:[&>[data-slot=keyboard]:last-child:not([class*='end-'])]:end-2.5",

        // button
        "has-[>button:first-child]:[&_input]:ps-(--input-gutter-start,--spacing(16)) has-[>button:last-child]:[&_input]:pe-(--input-gutter-end,--spacing(16)) sm:has-[>button:first-child]:[&_input]:ps-(--input-gutter-start,--spacing(14)) sm:has-[>button:last-child]:[&_input]:pe-(--input-gutter-end,--spacing(14))",
        "[&>button:first-child]:rounded-e-none [&>button:last-child]:rounded-s-none",
        "[&>button[data-intent=outline]]:border-input *:[button]:absolute *:[button]:top-0 *:[button]:z-10 *:[button]:min-h-11 sm:*:[button]:min-h-9",
        "[&>button:first-child]:start-0 [&>button:last-child]:end-0",

        "[&>[data-slot='icon']:not([class*='text-'])]:text-muted-fg [&>[data-slot='loader']:not([class*='text-'])]:text-muted-fg [&>[data-slot='text']:not([class*='text-'])]:text-muted-fg",
        className,
      )}
      {...props}
    />
  )
}
