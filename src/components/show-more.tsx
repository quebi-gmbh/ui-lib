"use client"

import { composeRenderProps, ToggleButton } from "react-aria-components"
import { tv } from "tailwind-variants"
import { buttonStyles } from "@/components/button"
import { cn } from "@/lib/utils"

/**
 * ShowMore — quebi design system
 *
 * A divider that carries a "show more" affordance: a pill toggle button (or
 * plain label) centered on a hairline rule. Use it to gate collapsed content
 * (long threads, extra results) behind a single inline control.
 *
 * The rule is a cyan/10 hairline. The pill's appearance is `buttonStyles` —
 * not a copy of it (task #185). It used to carry its own transcription of the
 * pre-#178 Button hover: `transition-all`, `hover:scale-[1.02]` and, on the
 * selected chip, `hover:shadow-quebi-glow-strong`. #178 removed all three from
 * `Button`, and this file did not follow, so a row of chips hovered with a
 * grow-and-glow beside Buttons that lift by one neutral rung — on the same
 * gallery page.
 */
const showMoreStyles = tv({
  base: "text-sm leading-6 before:border-quebi-line/10 after:border-quebi-line/10",
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
 * The two states were already *written* as button intents — the resting chip
 * transcribed `outline` token for token (`bg-transparent`,
 * `border-quebi-line/20`, `text-quebi-fg`, `hover:border-quebi-brand-mark`,
 * `hover:text-quebi-brand-text`) and the `selected:` block transcribed
 * `primary` (`bg-quebi-brand`, `border-quebi-brand-mark`, `text-quebi-on-brand`,
 * `hover:bg-quebi-brand-hover`). Naming the intents instead of the classes
 * keeps the chip tracking the recipe: the hover lift, the focus ring, the
 * disabled treatment and the transition property list are now whatever
 * `Button` says they are, and the mark-token edge from task #145 comes along
 * for free.
 *
 * `size: "sm"` is `text-sm px-3 py-2`, which is the pill's existing box to the
 * pixel, and `isCircle` is the pill shape — the one thing a chip does not take
 * from the default. Nothing here is a hand-rolled appearance class, which is
 * the point: there is no copy left to drift.
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
        <span className={cn("text-quebi-fg-muted")}>{text}</span>
      )}
    </div>
  )
}

export type { ShowMoreProps }
export { ShowMore }
