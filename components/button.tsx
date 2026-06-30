"use client"

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from "react-aria-components"
import { tv, type VariantProps } from "tailwind-variants"
import { cx } from "@/lib/primitive"

/**
 * Button — Cellestial Design System
 *
 * Six spec intents: primary, secondary, outline, ghost, accent, danger.
 * Sizes: xs / sm / md (default) / lg / xl / kiosk.
 *
 * Back-compat: `plain` is an alias of `ghost`; `warning` stays as an
 * amber system-feedback variant (not in the spec's primary button set).
 */
export const buttonStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-body! font-semibold! whitespace-nowrap select-none cursor-pointer",
    // Fixed 18px line-height. Combined with each size's padding + 1px borders
    // this produces the labeled total heights exactly:
    //   xs (4px)   → 28   sm (6px)  → 32   md (10px) → 40   lg (14px) → 48
    //   xl (18px)  → 56   kiosk (22px) → 64
    // The DS text tokens ship with larger body-copy line-heights that would
    // balloon these past the spec.
    "leading-[18px]!",
    "border border-solid",
    "transition-all duration-1 ease-out",
    "hover:-translate-y-px active:translate-y-0",
    "outline-none focus:outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-200 focus-visible:outline-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0",
    "pending:opacity-50",
    // react-aria slot conventions — icons & loaders inherit current color
    "*:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center",
    "*:data-[slot=loader]:shrink-0 *:data-[slot=loader]:self-center",
  ],
  variants: {
    intent: {
      primary:
        "bg-brand-500 border-brand-500 text-white! hover:bg-brand-600 hover:border-brand-600 active:bg-brand-700 active:border-brand-700",
      secondary: "bg-ink-900 border-ink-900 text-white! hover:bg-ink-700 hover:border-ink-700",
      outline: "bg-surface border-ink-200 text-ink-900! hover:border-ink-900",
      ghost: "bg-transparent border-transparent text-ink-700! hover:bg-ink-50",
      /** Alias of `ghost`. Kept so existing call-sites continue to work. */
      plain: "bg-transparent border-transparent text-ink-700! hover:bg-ink-50",
      accent:
        "bg-accent-500 border-accent-500 text-white! hover:bg-accent-600 hover:border-accent-600",
      danger:
        "bg-danger-500 border-danger-500 text-white! hover:bg-danger-600 hover:border-danger-600",
      /** Not in the spec's button set — kept for system-feedback uses. */
      warning:
        "bg-warning-500 border-warning-500 text-white! hover:bg-warning-600 hover:border-warning-600",
    },
    size: {
      xs: [
        "text-[12px] px-2 py-1 rounded-xs!",
        "*:data-[slot=icon]:size-3 *:data-[slot=loader]:size-3",
      ],
      sm: [
        "text-[13px] px-2.5 py-1.5 rounded-xs!",
        "*:data-[slot=icon]:size-3.5 *:data-[slot=loader]:size-3.5",
      ],
      md: [
        "text-body-s px-4 py-2.5 rounded-sm!",
        "*:data-[slot=icon]:size-4 *:data-[slot=loader]:size-4",
      ],
      lg: [
        "text-body-m px-[22px] py-3.5 rounded-md!",
        "*:data-[slot=icon]:size-4.5 *:data-[slot=loader]:size-4.5",
      ],
      xl: [
        "text-body-l px-[28px] py-4.5 rounded-md!",
        "*:data-[slot=icon]:size-5 *:data-[slot=loader]:size-5",
      ],
      kiosk: [
        // 64px total via base leading-[18px]. Consistent with the rest of the
        // scale; may need to bump later if 22px descenders visibly clip.
        "font-display! font-bold! tracking-[0.01em] text-k-body px-8 py-5.5 rounded-lg!",
        "*:data-[slot=icon]:size-6 *:data-[slot=loader]:size-6",
      ],
      // Square / icon-only variants
      "sq-xs": "size-7 rounded-xs! p-0 *:data-[slot=icon]:size-3.5",
      "sq-sm": "size-8 rounded-xs! p-0 *:data-[slot=icon]:size-4",
      "sq-md": "size-10 rounded-sm! p-0 *:data-[slot=icon]:size-5",
      "sq-lg": "size-12 rounded-md! p-0 *:data-[slot=icon]:size-6",
    },
    isCircle: {
      true: "rounded-pill!",
      false: "",
    },
  },
  defaultVariants: {
    intent: "primary",
    size: "md",
    isCircle: false,
  },
})

export interface ButtonProps extends ButtonPrimitiveProps, VariantProps<typeof buttonStyles> {
  ref?: React.Ref<HTMLButtonElement>
}

export function Button({ className, intent, size, isCircle, ref, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      ref={ref}
      {...props}
      className={cx(
        buttonStyles({
          intent,
          size,
          isCircle,
        }),
        className,
      )}
    />
  )
}
