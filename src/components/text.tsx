import { tv } from "tailwind-variants"
import { Link } from "@/components/link"
import { cn } from "@/lib/utils"

/**
 * Text — quebi design system
 *
 * Typographic primitives for body copy: a paragraph (`Text`), an inline
 * `TextLink`, emphasized `Strong`, and inline `Code`. Body copy is muted;
 * strong text brightens to white for emphasis. Restyled onto quebi tokens.
 */

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="text"
      {...props}
      className={cn("font-sans text-base/6 text-quebi-fg-muted sm:text-sm/6", className)}
    />
  )
}

/**
 * What a TextLink adds to a `Link`, which is only the icon layout: the brand
 * colour and the resting underline are the Link's own base styles now, so the
 * prose link and every other link cannot drift apart.
 */
export const textLinkStyles = tv({
  base: "has-data-[slot=icon]:inline-flex has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-1",
})

export function TextLink({ className, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
  return <Link {...props} className={cn(textLinkStyles(), className)} />
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<"strong">) {
  return <strong {...props} className={cn("font-medium text-quebi-fg", className)} />
}

export function Code({ className, ...props }: React.ComponentPropsWithoutRef<"code">) {
  return (
    <code
      {...props}
      className={cn(
        "rounded-quebi-sm border border-quebi-line/10 bg-quebi-bg px-1 py-0.5 font-mono text-sm font-medium text-quebi-fg sm:text-[0.8125rem]",
        className,
      )}
    />
  )
}
