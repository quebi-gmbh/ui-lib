import { cn } from "@/lib/utils"

/**
 * DescriptionList — quebi design system
 *
 * A responsive term/description grid (`<dl>`). Single column on small
 * screens, a two-column term + description layout on `sm` and up. Terms
 * read in muted foreground, descriptions in white, with subtle cyan
 * dividers separating each row.
 */
export function DescriptionList({ className, ref, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      ref={ref}
      data-slot="description-list"
      className={cn(
        "grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,calc(var(--spacing)*80))_auto] sm:text-sm/6",
        className,
      )}
      {...props}
    />
  )
}

export function DescriptionTerm({ className, ref, ...props }: React.ComponentProps<"dt">) {
  return (
    <dt
      ref={ref}
      data-slot="description-term"
      className={cn(
        "col-start-1 border-t border-cyan-500/10 pt-3 text-quebi-fg-muted first:border-none sm:py-3",
        className,
      )}
      {...props}
    />
  )
}

export function DescriptionDetails({ className, ref, ...props }: React.ComponentProps<"dd">) {
  return (
    <dd
      ref={ref}
      data-slot="description-details"
      className={cn(
        "pt-1 pb-3 text-white sm:border-t sm:border-cyan-500/10 sm:nth-2:border-none sm:py-3",
        className,
      )}
      {...props}
    />
  )
}
