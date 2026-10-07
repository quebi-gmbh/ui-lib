import { cn } from "@/lib/utils"

/**
 * Heading — quebi design system
 *
 * Renders a semantic h1–h4 on the display type scale: Outfit at light
 * weights, in ink. Level 1 is `display-l`, 2 is `display-s` (section heads),
 * 3 is `title`, 4 a light 18px. The `level` controls both the element and the
 * size; pass `className` to override. Write headlines lowercase, ending in a
 * full stop when they are a statement.
 */
type HeadingElement = "h1" | "h2" | "h3" | "h4"

type HeadingType = { level?: 1 | 2 | 3 | 4 } & React.ComponentPropsWithoutRef<HeadingElement>

export interface HeadingProps extends HeadingType {
  className?: string | undefined
}

export function Heading({ className, level = 1, ...props }: HeadingProps) {
  const Element: HeadingElement = `h${level}`
  return (
    <Element
      className={cn(
        "font-display text-quebi-fg text-balance",
        level === 1 && "text-quebi-display-l",
        level === 2 && "text-quebi-display-s",
        level === 3 && "text-quebi-title",
        level === 4 && "text-lg/6 font-light tracking-wide",
        className,
      )}
      {...props}
    />
  )
}
