import { cn } from "@/lib/utils"

/**
 * Card — quebi design system
 *
 * A surface for grouping related content. Depth comes from quebi glows, never
 * drop shadows; the signature is a faint cyan border over a near-transparent
 * white fill. Interactive cards lift on hover and pick up a brand glow.
 *
 * Sub-components compose the layout: CardHeader (title + description + action),
 * CardContent, and CardFooter.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `feature` swaps the muted surface for a brand-tinted, glowing one. Reserve
   * it for the hero/feature card in a set — not every card. */
  variant?: "default" | "feature"
  /** Opt in to the hover lift + glow. Set for cards that behave like a link or
   * button. Default cards stay static so informational surfaces don't imply
   * interactivity. */
  interactive?: boolean
}

const Card = ({ className, variant = "default", interactive = false, ...props }: CardProps) => {
  return (
    <div
      data-slot="card"
      className={cn(
        // flex-col + h-full so a child with `mt-auto` (e.g. the action button)
        // pins to the bottom and buttons align across a row of cards.
        "flex flex-col h-full rounded-quebi-md p-5 text-white",
        variant === "feature"
          ? "border border-quebi-brand/30 bg-quebi-brand/[0.06] shadow-quebi-glow"
          : "border border-cyan-500/10 bg-white/[0.02]",
        interactive &&
          "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-quebi-brand/30 hover:shadow-quebi-glow",
        className,
      )}
      {...props}
    />
  )
}

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

const CardHeader = ({ className, title, description, children, ...props }: HeaderProps) => (
  <div
    data-slot="card-header"
    className={cn(
      "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
      className,
    )}
    {...props}
  >
    {title && <CardTitle>{title}</CardTitle>}
    {description && <CardDescription>{description}</CardDescription>}
    {!title && typeof children === "string" ? <CardTitle>{children}</CardTitle> : children}
  </div>
)

const CardTitle = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-sans font-semibold text-lg text-white tracking-[-0.01em] text-balance",
        className,
      )}
      {...props}
    />
  )
}

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-quebi-fg-muted text-pretty", className)}
      {...props}
    />
  )
}

const CardAction = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  )
}

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div data-slot="card-content" className={cn("mt-3", className)} {...props} />
}

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center mt-4", className)}
      {...props}
    />
  )
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
