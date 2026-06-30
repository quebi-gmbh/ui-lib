import { twMerge } from "tailwind-merge"

/**
 * Card — Cellestial Design System
 *
 * Spec source (cellestial-ds/components.css):
 *   .card           → surface bg, border ink-100, rounded-lg (16px), p-5 (20px),
 *                     shadow-1, transition + hover lift with shadow-3.
 *   .card--feature  → gradient-brand background, white text, no border.
 *   .card-title     → text-heading-m (20/28), mb-1.5 (6px)
 *   .card-sub       → text-ink-500, 14px
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `feature` applies the signature gradient surface. Reserve it for feature
   * cards, AI badges, and the logo mark — per the spec, nowhere else. */
  variant?: "default" | "feature"
  /** Opt in to the hover lift + shadow. Set for cards that behave like a link
   * or button. Default cards stay static so informational surfaces don't imply
   * interactivity. */
  interactive?: boolean
}

const Card = ({ className, variant = "default", interactive = false, ...props }: CardProps) => {
  return (
    <div
      data-slot="card"
      className={twMerge(
        // flex-col + h-full so a child with `mt-auto` (e.g. the action button)
        // pins to the bottom and buttons align across a row of cards.
        "flex flex-col h-full rounded-lg! p-5",
        variant === "feature"
          ? "bg-gradient-brand text-white border-0"
          : "bg-surface border border-ink-100 shadow-1",
        // spec .card → transform + box-shadow, 200ms each. Only when interactive.
        interactive &&
          "transition-all duration-[200ms] ease-out hover:-translate-y-[2px] hover:shadow-3",
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
    className={twMerge(
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
      className={twMerge(
        "font-display! font-bold! text-heading-m! text-ink-900! mb-1.5 tracking-[-0.01em] text-balance",
        className,
      )}
      {...props}
    />
  )
}

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      data-slot="card-description"
      className={twMerge("text-ink-500! text-[14px]! text-pretty", className)}
      {...props}
    />
  )
}

const CardAction = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      data-slot="card-action"
      className={twMerge(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  )
}

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div data-slot="card-content" className={twMerge("mt-3", className)} {...props} />
}

const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      data-slot="card-footer"
      className={twMerge("flex items-center mt-4", className)}
      {...props}
    />
  )
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
