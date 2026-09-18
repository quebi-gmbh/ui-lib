import { Link, type LinkProps } from "react-router"
import { cn } from "@/lib/utils"

/**
 * A router link that reads as the library's `Link`.
 *
 * The site cannot use `Link` from `@/components/link` for internal navigation:
 * that one is react-aria's, which needs a `RouterProvider` to client-navigate,
 * and this app wires routing through react-router's own `Link` instead. So the
 * look has to be re-stated here — including the resting underline, which is
 * the point of it. These links sit inside body copy, where colour alone is
 * 1.38:1 against `--q-fg-muted` and WCAG 1.4.1 wants a second cue.
 *
 * Standalone calls to action (the 404 page's "Back home", the card footers on
 * the index pages) are deliberately not this: 1.4.1 asks for the second cue
 * for a link *within a block of text*, and those are not in one.
 */
export function ProseLink({ className, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        "font-medium text-quebi-brand-text underline decoration-quebi-brand-text/40 underline-offset-2",
        "transition-colors duration-200 hover:text-quebi-brand-text-hover hover:decoration-quebi-brand-text-hover",
        className,
      )}
    />
  )
}
