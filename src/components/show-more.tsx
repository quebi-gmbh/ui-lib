"use client"

import { composeRenderProps, ToggleButton } from "react-aria-components"
import { tv } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * ShowMore — quebi design system
 *
 * A divider that carries a "show more" affordance: a pill toggle button (or
 * plain label) centered on a hairline rule. Use it to gate collapsed content
 * (long threads, extra results) behind a single inline control.
 *
 * The rule is a cyan/10 hairline; the toggle is a quebi outline pill that
 * lifts to the brand teal on hover and selection. No drop shadows.
 */
const showMoreStyles = tv({
  base: "text-sm leading-6 before:border-cyan-500/10 after:border-cyan-500/10",
  variants: {
    orientation: {
      vertical: "mx-1 h-auto self-stretch",
      horizontal: "my-0.5 h-px w-full self-stretch",
    },
  },
  compoundVariants: [
    {
      orientation: "vertical",
      className:
        "mx-2 flex flex-col items-center before:mb-2 before:flex-1 before:border-l after:mt-2 after:flex-1 after:border-r",
    },
    {
      orientation: "horizontal",
      className:
        "my-2 flex items-center self-stretch before:me-2 before:flex-1 before:border-t after:ms-2 after:flex-1 after:border-t",
    },
  ],
  defaultVariants: {
    orientation: "horizontal",
  },
})

const togglePillStyles = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "rounded-full border border-solid border-cyan-500/20 bg-transparent",
    "px-3 py-2 text-sm font-sans font-semibold whitespace-nowrap select-none cursor-pointer",
    "text-white",
    "transition-all duration-200 ease-out hover:scale-[1.02] active:scale-100",
    "hover:border-quebi-brand hover:text-quebi-brand",
    "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
    "selected:border-quebi-brand selected:bg-quebi-brand selected:text-quebi-bg selected:hover:bg-quebi-brand-hover selected:hover:border-quebi-brand-hover selected:hover:text-quebi-bg selected:hover:shadow-quebi-glow-strong",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
  ],
})

interface ShowMoreProps extends Omit<React.ComponentProps<typeof ToggleButton>, "className"> {
  className?: string
  orientation?: "horizontal" | "vertical"
  as?: "text" | "button"
  text?: string
}

const ShowMore = ({
  as = "button",
  orientation = "horizontal",
  className,
  text,
  ...props
}: ShowMoreProps) => {
  return (
    <div className={showMoreStyles({ orientation, className })}>
      {as === "button" ? (
        <ToggleButton {...props} className={togglePillStyles()}>
          {composeRenderProps(props.children, (children) => children)}
        </ToggleButton>
      ) : (
        <span className={cn("text-quebi-fg-muted")}>{text}</span>
      )}
    </div>
  )
}

export type { ShowMoreProps }
export { ShowMore }
