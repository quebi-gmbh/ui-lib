"use client"

import { useId } from "react"
import { Link, type LinkProps } from "@/components/link"
import { cn } from "@/lib/utils"

/**
 * List — quebi design system
 *
 * The answer to "how do I show a list of things": a `<ul>` of `Item` rows, and
 * the handful of decisions a list makes about its rows as a whole — whether a
 * hairline runs between them, how much room each one gets, whether they run to
 * the edges of the Card they sit in. The rows themselves are `Item` (leading
 * media, title, secondary line, meta, action); this file only arranges them.
 *
 * - `variant="divided"` is the index list: a strong rule on top, a hairline
 *   between rows. `plain` separates rows by space alone.
 * - `density="compact"` halves the vertical padding, for a sidebar or a
 *   long list read as a whole. It sets the padding of the `Item`s directly
 *   inside it, so it wins over a `py-*` written on one row.
 * - `inset` is for a list that is a Card's content: it pulls the list out
 *   through the Card's `p-5` and pads each row back in by the same amount, so
 *   the hairlines run the full width of the card while the text stays in line
 *   with the card's header.
 *
 * A row that goes somewhere puts a `ListLink` in its title. The link stretches
 * over the whole row with a pseudo-element, so the row is one target and one
 * tab stop, and the `ItemActions` slot is lifted above it so a Button in the
 * same row still gets its own press. Hovering a linked row tints it and shifts
 * its content right — the index list's one piece of motion. That is navigation, not selection: rows
 * the user moves through with arrow keys, selects or drags are a `GridList`,
 * and rows the user picks one of are a `ListBox`.
 *
 * `ListSection` gives a run of lists a heading each; `ListEmpty` is what
 * renders *instead of* the list when there is nothing in it — never an `<li>`
 * inside it, which a screen reader would announce as a list of one item.
 */
export interface ListProps extends React.ComponentProps<"ul"> {
  /** `divided` is a rule on top and a hairline between rows; `plain` separates them by space alone. */
  variant?: "divided" | "plain"
  /** Vertical room per row. `compact` for long lists and sidebars. */
  density?: "comfortable" | "compact"
  /** Run the rows to the edges of the enclosing Card (its `p-5`). */
  inset?: boolean
}

export function List({
  className,
  variant = "divided",
  density = "comfortable",
  inset = false,
  ref,
  ...props
}: ListProps) {
  return (
    <ul
      ref={ref}
      data-slot="list"
      data-variant={variant}
      data-density={density}
      // `list-style: none` drops list semantics in Safari/VoiceOver; the role
      // puts them back, so a reader still hears "list, 3 items".
      // biome-ignore lint/a11y/noRedundantRoles: restores list semantics that WebKit drops for an unstyled <ul>
      role="list"
      className={cn(
        "flex flex-col",
        // Every row is the containing block for a ListLink's stretched target,
        // and the action slot sits above that target so its Button is pressable.
        "*:data-[slot=item]:relative **:data-[slot=item-actions]:relative **:data-[slot=item-actions]:z-10",
        variant === "divided" &&
          "divide-y divide-quebi-hairline border-t border-quebi-rule forced-colors:divide-[ButtonBorder] forced-colors:border-[ButtonBorder]",
        density === "compact" ? "*:data-[slot=item]:py-1.5" : "*:data-[slot=item]:py-3.5",
        // A linked row is raised and shifts right 12px on hover. The tint sits on
        // the row, not on the link's stretched target: that target paints above
        // the row's text, and the raised ground is opaque.
        "*:data-[slot=item]:transition-[padding,background-color] *:data-[slot=item]:duration-300",
        "*:data-[slot=item]:has-[[data-slot=list-link]:hover]:bg-quebi-raised",
        inset
          ? "-mx-5 *:data-[slot=item]:px-5 *:data-[slot=item]:has-[[data-slot=list-link]:hover]:pl-8"
          : "*:data-[slot=item]:has-[[data-slot=list-link]:hover]:pl-3",
        className,
      )}
      {...props}
    />
  )
}

export interface ListLinkProps extends Omit<LinkProps, "className"> {
  className?: string
}

/**
 * The title of a row that navigates. Put it inside `ItemTitle`; it covers the
 * whole row, raises it on hover and draws the focus ring inside the row rather
 * than round the words.
 */
export function ListLink({ className, ...props }: ListLinkProps) {
  return (
    <Link
      data-slot="list-link"
      className={cn(
        "text-quebi-fg no-underline hover:text-quebi-fg hover:no-underline",
        "focus-visible:ring-0 focus-visible:ring-offset-0",
        "after:absolute after:inset-0",
        "data-focus-visible:after:ring-2 data-focus-visible:after:ring-inset data-focus-visible:after:ring-quebi-focus",
        "focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-quebi-focus",
        className,
      )}
      {...props}
    />
  )
}

export interface ListSectionProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** The section's heading. It also names the section for assistive tech. */
  title: React.ReactNode
  /** Heading level, so the section fits the outline of the page it is on. */
  level?: 2 | 3 | 4
}

/** A heading over one of several lists on a page — "Today", "Earlier", "Archived". */
export function ListSection({
  className,
  title,
  level = 3,
  children,
  ref,
  ...props
}: ListSectionProps) {
  const id = useId()
  const Heading = `h${level}` as const
  return (
    <section
      ref={ref}
      data-slot="list-section"
      aria-labelledby={id}
      className={cn("flex flex-col not-first:mt-6", className)}
      {...props}
    >
      <Heading id={id} className="pb-2">
        <span className="quebi-eyebrow">{title}</span>
      </Heading>
      {children}
    </section>
  )
}

export interface ListEmptyProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** An `IconTile`, usually. */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
}

/**
 * What renders instead of a `List` with no rows: what would be here, and — in
 * `children` — the action that puts the first one there.
 */
export function ListEmpty({
  className,
  icon,
  title,
  description,
  children,
  ref,
  ...props
}: ListEmptyProps) {
  return (
    <div
      ref={ref}
      data-slot="list-empty"
      className={cn("flex flex-col items-center gap-1 px-6 py-10 text-center", className)}
      {...props}
    >
      {icon && <div className="mb-2">{icon}</div>}
      <p className="font-display text-quebi-title text-quebi-fg">{title}</p>
      {description && (
        <p className="max-w-xs text-sm/5 text-pretty text-quebi-fg-muted">{description}</p>
      )}
      {children && <div className="mt-3 flex items-center gap-2">{children}</div>}
    </div>
  )
}
