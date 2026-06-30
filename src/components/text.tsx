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

export const textLinkStyles = tv({
  base: "text-quebi-brand underline decoration-quebi-brand/40 transition-colors duration-150 ease-out hover:text-quebi-brand-hover hover:decoration-quebi-brand-hover has-data-[slot=icon]:inline-flex has-data-[slot=icon]:items-center has-data-[slot=icon]:gap-x-1",
})

export function TextLink({ className, ...props }: React.ComponentPropsWithoutRef<typeof Link>) {
  return <Link {...props} className={cn(textLinkStyles(), className)} />
}

export function Strong({ className, ...props }: React.ComponentPropsWithoutRef<"strong">) {
  return <strong {...props} className={cn("font-medium text-white", className)} />
}

export function Code({ className, ...props }: React.ComponentPropsWithoutRef<"code">) {
  return (
    <code
      {...props}
      className={cn(
        "rounded-quebi-sm border border-cyan-500/10 bg-quebi-bg px-1 py-0.5 font-mono text-sm font-medium text-white sm:text-[0.8125rem]",
        className,
      )}
    />
  )
}
