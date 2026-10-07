import { cn } from "@/lib/utils"

/**
 * Eyebrow — quebi design system
 *
 * The Label role outside a form: mono, uppercase, tracked, always `fg-subtle`.
 * Kickers above a headline, scene labels, timecodes, counts ("04 entries").
 * A field's label is `Label` from `@/components/field`, which wears the same
 * type but is a `<label>` bound to its control; this one labels nothing.
 *
 * Write it in lowercase in the source — the utility sets the caps, so the text
 * a screen reader or a copy-paste gets stays lowercase. Use an em dash with
 * spaces between parts ("scene 01 — the studio"). Never more than one line.
 */

type EyebrowElement = "p" | "span" | "div"

export interface EyebrowProps extends React.HTMLAttributes<HTMLElement> {
  /** The element to render. `p` (default) for a kicker on its own line, `span` inline. */
  as?: EyebrowElement
}

export function Eyebrow({ as: Element = "p", className, ...props }: EyebrowProps) {
  return <Element data-slot="eyebrow" className={cn("quebi-eyebrow m-0", className)} {...props} />
}
