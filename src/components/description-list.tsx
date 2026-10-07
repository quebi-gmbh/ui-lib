import { cn } from "@/lib/utils"

/**
 * DescriptionList — quebi design system
 *
 * A responsive term/description grid (`<dl>`). Single column on small
 * screens, a two-column term + description layout on `sm` and up. Terms
 * read in the subtle ink, descriptions in full ink, and a hairline runs
 * between rows — the meta row of the design, stacked.
 */
export function DescriptionList({ className, ref, ...props }: React.ComponentProps<"dl">) {
  return (
    <dl
      ref={ref}
      data-slot="description-list"
      className={cn(
        "grid grid-cols-1 text-quebi-body-s sm:grid-cols-[min(50%,calc(var(--spacing)*80))_auto]",
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
        "col-start-1 border-t border-quebi-hairline pt-3 text-quebi-fg-subtle first:border-none sm:py-3",
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
        "pt-1 pb-3 text-quebi-fg sm:border-t sm:border-quebi-hairline sm:nth-2:border-none sm:py-3",
        className,
      )}
      {...props}
    />
  )
}
