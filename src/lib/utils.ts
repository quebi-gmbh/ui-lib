import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"
import { createTV } from "tailwind-variants"

/**
 * tailwind-merge only collapses two classes into one when it can place them in
 * the same group, and it knows the groups by their *values* — `rounded-sm`,
 * `rounded-full`, `shadow-md`. The quebi tokens (`--radius-quebi-*`,
 * `--shadow-quebi-*`, `--container-quebi-*` in quebi-theme.css) are names it
 * has never seen, so out of the box `rounded-quebi-s rounded-full` both
 * survive the merge and the winner is decided by the order Tailwind happens to
 * emit them in the sheet — which is not the order they were written in.
 *
 * That is a silent failure: `<Card className="rounded-full">` looks like it
 * overrides the card's radius, nothing warns, and it does nothing.
 *
 * Naming the tokens under `theme` fixes it for every utility that uses them,
 * including the per-corner ones (`rounded-t-quebi-s` vs `rounded-t-full`).
 * Colours need no entry — tailwind-merge already treats an unknown value in a
 * colour position as a colour.
 *
 * Keep these lists in step with the `@theme` blocks in quebi-theme.css — both
 * of them: the shadow token lives in the `@theme inline` block, where it can
 * flip per theme, and its name is what this list matches.
 */
const QUEBI_MERGE = {
  extend: {
    theme: {
      radius: ["quebi-s", "quebi-l"],
      shadow: ["quebi-float", "quebi-overlay"],
      container: ["quebi-content", "quebi-shell"],
      // The type scale. Without this entry `text-quebi-title` is an unknown
      // value in a `text-` position, which tailwind-merge files as a *colour* —
      // so `text-quebi-title text-quebi-fg` would silently drop one of the two.
      text: [
        "quebi-display-xl",
        "quebi-display-l",
        "quebi-display-m",
        "quebi-display-s",
        "quebi-title",
        "quebi-link",
        "quebi-nav",
        "quebi-body",
        "quebi-body-s",
        "quebi-caption",
        "quebi-tag",
        "quebi-button",
        "quebi-label",
        "quebi-code",
      ],
      spacing: ["quebi-8", "quebi-9", "quebi-10"],
    },
  },
}

const twMerge = extendTailwindMerge(QUEBI_MERGE)

/**
 * `tv` with the same merge config as `cn`. tailwind-variants merges a
 * variant's classes over `base` with its own tailwind-merge, and out of the box
 * that one has never heard of the quebi tokens either — so inside a `tv()`,
 * `text-quebi-caption text-quebi-fg` would lose one of the two. Components
 * import `tv` from here, never from "tailwind-variants" directly.
 */
export const tv = createTV({ twMergeConfig: QUEBI_MERGE })

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Later classes win when they target the same property.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
