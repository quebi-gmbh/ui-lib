import { cn } from "@/lib/utils"

/**
 * Container — quebi design system
 *
 * A centered, max-width layout wrapper for page and section content. Keeps
 * content readable on wide viewports and adds responsive horizontal padding.
 *
 * The breakpoint and padding are exposed as CSS variables
 * (`--container-breakpoint`, `--container-padding`) so callers can override
 * the cap or gutter inline without forking the component.
 *
 * - `constrained` defers the horizontal padding until the `sm` breakpoint,
 *   letting content run edge-to-edge on the smallest screens.
 */
export interface ContainerProps extends React.ComponentProps<"div"> {
  /** Apply horizontal padding only from the `sm` breakpoint up. */
  constrained?: boolean
}

export function Container({ className, constrained = false, ref, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-(--container-breakpoint) [--container-breakpoint:var(--breakpoint-xl)] [--container-padding:--spacing(4)]",
        constrained ? "sm:px-(--container-padding)" : "px-(--container-padding)",
        className,
      )}
      {...props}
      ref={ref}
    />
  )
}
