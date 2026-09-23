import { cn } from "@/lib/utils"

/**
 * Item — quebi design system
 *
 * One row of a list of same-shaped things: leading media (an `Avatar` or an
 * `IconTile`), a title with a line of secondary text under it, trailing meta
 * (a timestamp, a count, a `Badge`) and a trailing action. `ItemGroup` stacks
 * rows with a hairline between them — the thing to write instead of a card per
 * list item, which reads slower and stops being readable at about six.
 *
 * Static on purpose. The row is a `<li>` with no role and no press state, and
 * the action slot holds a real `Button` or `Menu` trigger that owns its own
 * focus. Rows the user moves through with the keyboard, selects or drags are a
 * `GridList`; rows the user picks one of are a `ListBox`. Neither of those is a
 * row with an `onClick` on it, and this is not the place to grow one.
 *
 * Every slot is optional and they lay out in source order, so a row can be a
 * title alone, or a title and an action, without an empty column holding space.
 * The content slot takes the free width and truncates the title and the
 * secondary line rather than wrapping them under the trailing slots.
 */
export function ItemGroup({ className, ref, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      ref={ref}
      data-slot="item-group"
      // `list-style: none` drops list semantics in Safari/VoiceOver; the role
      // puts them back, so a reader still hears "list, 3 items".
      // biome-ignore lint/a11y/noRedundantRoles: restores list semantics that WebKit drops for an unstyled <ul>
      role="list"
      className={cn(
        "flex flex-col divide-y divide-quebi-line/20 forced-colors:divide-[ButtonBorder]",
        className,
      )}
      {...props}
    />
  )
}

export function Item({ className, ref, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      ref={ref}
      data-slot="item"
      className={cn("flex min-w-0 items-center gap-3 py-3", className)}
      {...props}
    />
  )
}

/** The leading slot: an `Avatar`, an `IconTile`, a thumbnail. Never shrinks. */
export function ItemMedia({ className, ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      data-slot="item-media"
      className={cn("flex shrink-0 items-center", className)}
      {...props}
    />
  )
}

/** Holds the title and its secondary line, and takes whatever width is left. */
export function ItemContent({ className, ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      data-slot="item-content"
      className={cn("flex min-w-0 flex-1 flex-col", className)}
      {...props}
    />
  )
}

export function ItemTitle({ className, ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      data-slot="item-title"
      className={cn("truncate text-sm/6 font-medium text-quebi-fg", className)}
      {...props}
    />
  )
}

/** The secondary line under the title: a role, an email, a path. */
export function ItemDescription({ className, ref, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      ref={ref}
      data-slot="item-description"
      className={cn("truncate text-sm/5 text-quebi-fg-muted", className)}
      {...props}
    />
  )
}

/**
 * Trailing text that describes the row rather than names it — a date, a size,
 * a count. Tabular figures, so a column of them lines up down the list.
 */
export function ItemMeta({ className, ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      data-slot="item-meta"
      className={cn(
        "flex shrink-0 items-center gap-2 text-sm text-quebi-fg-subtle tabular-nums",
        className,
      )}
      {...props}
    />
  )
}

/** The trailing slot for a `Button`, a `LinkButton` or a `Menu` trigger. */
export function ItemActions({ className, ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      ref={ref}
      data-slot="item-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  )
}
