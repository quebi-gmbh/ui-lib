import { cn } from "@/lib/utils"

/**
 * Card — quebi design system
 *
 * A surface for grouping related content: paper with a hairline round it,
 * square, and no shadow — structure comes from the rule, not from depth.
 * Interactive cards answer hover with the raised ground, never with a lift.
 *
 * Note that a Card is *not* an overlay: it sits in the page flow on the page
 * ground and does not take `bg-quebi-elevated` or `shadow-quebi-float`, which
 * are for things that float above the page.
 *
 * Sub-components compose the layout: CardHeader (title + description + action),
 * CardContent, and CardFooter.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `feature` sets the card on the raised ground behind a stronger rule.
   * Reserve it for the one card in a set that carries the point — not every
   * card. */
  variant?: "default" | "feature"
  /** Opt in to the hover ground. Set for cards that behave like a link or
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
        "flex flex-col h-full border p-6 text-quebi-fg",
        variant === "feature"
          ? "border-quebi-rule bg-quebi-raised"
          : "border-quebi-hairline bg-quebi-bg",
        interactive && "transition-colors duration-150 hover:bg-quebi-raised",
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
        "font-display text-quebi-title text-quebi-fg text-balance",
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
      className={cn("text-quebi-body-s text-quebi-fg-muted text-pretty", className)}
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
