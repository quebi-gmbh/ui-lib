import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge only collapses two classes into one when it can place them in
 * the same group, and it knows the groups by their *values* — `rounded-sm`,
 * `rounded-full`, `shadow-md`. The quebi tokens (`--radius-quebi-*`,
 * `--shadow-quebi-*`, `--container-quebi-*` in quebi-theme.css) are names it
 * has never seen, so out of the box `rounded-quebi-sm rounded-full` both
 * survive the merge and the winner is decided by the order Tailwind happens to
 * emit them in the sheet — which is not the order they were written in.
 *
 * That is a silent failure: `<Card className="rounded-full">` looks like it
 * overrides the card's radius, nothing warns, and it does nothing.
 *
 * Naming the tokens under `theme` fixes it for every utility that uses them,
 * including the per-corner ones (`rounded-t-quebi-md` vs `rounded-t-full`).
 * Colours need no entry — tailwind-merge already treats an unknown value in a
 * colour position as a colour.
 *
 * Keep these lists in step with the `@theme` block in quebi-theme.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["quebi-sm", "quebi-md", "quebi-lg"],
      shadow: ["quebi-glow", "quebi-glow-strong"],
      container: ["quebi-content"],
    },
  },
})

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Later classes win when they target the same property.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
