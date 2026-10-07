import { composeRenderProps } from "react-aria-components"
import { Link } from "@/components/link"
import { cn, tv } from "@/lib/utils"

/**
 * Text — quebi design system
 *
 * Typographic primitives for body copy: a paragraph (`Text`), an inline
 * `TextLink`, emphasized `Strong`, and inline `Code`. Body copy is Inter in
 * the muted ink; strong text steps up to full ink for emphasis.
 */

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="text"
      {...props}
      className={cn("font-sans text-quebi-body text-quebi-fg-muted text-pretty", className)}
    />
  )
}

/**
 * What a TextLink adds to a `Link`, which is only the icon layout: the ink
 * and the resting underline are the Link's own base styles, so the prose link
 * and every other link cannot drift apart.
 */
export const textLinkStyles = tv({
  base: "has-data-[slot=icon]:inline-flex has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-1",
})

export function TextLink({ className, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      {...props}
      className={composeRenderProps(className, (resolved) => cn(textLinkStyles(), resolved))}
    />
  )
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<"strong">) {
  return <strong {...props} className={cn("font-medium text-quebi-fg", className)} />
}

export function Code({ className, ...props }: React.ComponentPropsWithoutRef<"code">) {
  return (
    <code
      {...props}
      className={cn(
        "bg-quebi-raised px-1.25 py-px font-mono text-[0.8125rem] text-quebi-fg",
        className,
      )}
    />
  )
}
