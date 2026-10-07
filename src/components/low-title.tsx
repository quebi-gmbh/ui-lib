import { cn } from "@/lib/utils"

/**
 * LowTitle — quebi design system
 *
 * The headline set low in the frame, the signature of the system. It takes
 * `mt-auto`, so inside a `Stage` (or any flex column) it sinks to the floor
 * and leaves the middle empty.
 *
 * - `size="m"` (default): `display-m` under a hairline, with a side column
 *   holding the one sentence and the one action.
 * - `size="xl"`: `display-xl`, Outfit Thin, for gallery pages; the sentence
 *   and the action move to a footer row under a hairline.
 *
 * The title is lowercase, short, one idea, and ends with a full stop. It is
 * lowercased by CSS too, so a title that arrives in sentence case from a CMS
 * still reads as the system wants while the source text stays intact. Give it
 * one action, normally a `TextLink` ("get started →").
 */

export interface LowTitleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** The headline. Lowercase, short, ends with a full stop. */
  title: React.ReactNode
  /** `m` (default) with a side column; `xl` with a footer row. */
  size?: "m" | "xl"
  /**
   * The heading element. `h1` on the first stage of a page, `h2` (default)
   * after that — a library default of `h1` would put a second one on any page
   * that already has its own.
   */
  as?: "h1" | "h2"
  /** One call to action, normally a `TextLink`. */
  action?: React.ReactNode
  /** The one sentence that goes with the title. */
  children?: React.ReactNode
}

export function LowTitle({
  title,
  size = "m",
  as: Heading = "h2",
  action,
  children,
  className,
  ...props
}: LowTitleProps) {
  const hasAside = children != null || action != null

  if (size === "xl") {
    return (
      <div data-slot="low-title" data-size="xl" className={cn("mt-auto", className)} {...props}>
        <Heading className="m-0 font-display text-quebi-display-xl text-quebi-fg lowercase max-sm:text-quebi-display-l max-sm:font-thin">
          {title}
        </Heading>
        {hasAside && (
          <div className="mt-4.5 flex items-end justify-between gap-4 border-t border-quebi-hairline pt-3.5">
            {children != null && <p className="m-0 text-quebi-caption text-quebi-fg-muted">{children}</p>}
            {action}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      data-slot="low-title"
      data-size="m"
      className={cn(
        "mt-auto grid grid-cols-1 items-end gap-5 border-t border-quebi-hairline pt-4 sm:grid-cols-[1.3fr_1fr]",
        className,
      )}
      {...props}
    >
      <Heading
        className={cn(
          "m-0 font-display text-quebi-display-m text-quebi-fg lowercase",
          // The first stage of a page carries the larger cut on a wide screen.
          Heading === "h1" && "md:text-quebi-display-l",
        )}
      >
        {title}
      </Heading>
      {hasAside && (
        <div>
          {children != null && <p className="m-0 mb-3 text-quebi-body-s text-quebi-fg-muted">{children}</p>}
          {action}
        </div>
      )}
    </div>
  )
}
