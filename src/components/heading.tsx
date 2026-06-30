import { cn } from "@/lib/utils"

/**
 * Heading — quebi design system
 *
 * Renders a semantic h1–h4 with a quebi-tuned type scale. Headings are white,
 * font-semibold with tight tracking. The `level` controls both the element and
 * the size; pass `className` to override.
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
        "font-sans font-semibold text-white tracking-tight",
        level === 1 && "text-xl/8 sm:text-2xl/8",
        level === 2 && "text-lg/6 sm:text-xl/8",
        level === 3 && "text-base/6 sm:text-lg/6",
        level === 4 && "text-base/6",
        className,
      )}
      {...props}
    />
  )
}
