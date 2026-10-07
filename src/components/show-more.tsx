"use client"

import { composeRenderProps, ToggleButton } from "react-aria-components"
import { buttonStyles } from "@/components/button"
import { tv } from "@/lib/utils"

/**
 * ShowMore — quebi design system
 *
 * A divider that carries a "show more" affordance: a pill toggle button (or
 * plain label) centered on a hairline rule. Use it to gate collapsed content
 * (long threads, extra results) behind a single inline control.
 *
 * The rule is a hairline. The pill's appearance is `buttonStyles` — not a
 * copy of it (task #185): a hand transcription of an older Button hover once
 * left a row of chips growing and glowing beside Buttons that did neither.
 */
const showMoreStyles = tv({
  base: "text-sm leading-6 before:border-quebi-hairline after:border-quebi-hairline",
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

/**
 * The pill, as a Button intent chosen by the toggle state.
 *
 * Resting is `outline`, expanded is `primary` — the slate action fill of a
 * pressed button, not the signal of a selected row. Naming the intents instead of the classes keeps
 * the chip tracking the recipe: hover, focus ring, disabled treatment and
 * transition are whatever `Button` says they are.
 *
 * `size: "sm"` is the 38px control, and `isCircle` is the pill shape — the one
 * thing a chip does not take from the default. Nothing here is a hand-rolled
 * appearance class, which is the point: there is no copy left to drift.
 */
const showMorePillStyles = (isSelected: boolean) =>
  buttonStyles({ intent: isSelected ? "primary" : "outline", size: "sm", isCircle: true })

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
        <ToggleButton {...props} className={({ isSelected }) => showMorePillStyles(isSelected)}>
          {composeRenderProps(props.children, (children) => children)}
        </ToggleButton>
      ) : (
        <span className="quebi-eyebrow">{text}</span>
      )}
    </div>
  )
}

export type { ShowMoreProps }
export { ShowMore }
