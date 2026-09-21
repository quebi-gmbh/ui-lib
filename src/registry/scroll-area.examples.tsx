import { ScrollArea } from "@/components/scroll-area"
import type { ComponentExample } from "./types"

const TAGS = [
  "design-systems",
  "react-aria",
  "tailwind",
  "accessibility",
  "typescript",
  "components",
  "tokens",
  "theming",
  "forms",
  "overlays",
  "navigation",
  "feedback",
]

const rows = (count: number, text: string) =>
  Array.from({ length: count }, (_, i) => i + 1).map((n) => (
    <p key={n} className="text-sm text-quebi-fg">
      {n} — {text}
    </p>
  ))

export const scrollAreaExamples: ComponentExample[] = [
  {
    title: "Vertical",
    description:
      "A fixed-height container that scrolls vertically. The bar hugs the card edge with no padding around it, and its ends curve away with the card's corner. Padding on the ScrollArea insets the content, not the bar.",
    render: () => (
      <div className="h-56 w-full max-w-sm rounded-quebi-md border border-quebi-line/10">
        <ScrollArea orientation="vertical" className="p-4">
          <div className="flex flex-col gap-3">
            {rows(20, "quebi keeps long lists tidy inside a bounded viewport.")}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  {
    title: "Horizontal",
    description: "Set orientation to horizontal to scroll a row of items sideways.",
    render: () => (
      <div className="w-full max-w-md rounded-quebi-md border border-quebi-line/10">
        <ScrollArea orientation="horizontal" className="p-4">
          <div className="flex w-max gap-3">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="whitespace-nowrap rounded-quebi-sm border border-quebi-line/20 px-3 py-1.5 text-sm text-quebi-fg-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  {
    title: "Scrollbar variants",
    description:
      'flush is the default: a 6px pill against the edge, with no padding around it. floating puts that pill inside a 12px track, 3px clear of every edge — for content that scrolls under the bar, and for a bar a pointer user is expected to drag rather than wheel, where 12px of track is twice the grab width. none removes the bar for a surface whose scroll position something else already shows.',
    render: () => (
      <div className="flex w-full flex-wrap gap-4">
        {(
          [
            ["flush", "the default — hugs the edge"],
            ["floating", "3px clear of every edge"],
            ["none", "no bar, still scrollable"],
          ] as const
        ).map(([variant, caption]) => (
          <div key={variant} className="flex w-52 flex-col gap-2">
            <div className="h-48 rounded-quebi-md border border-quebi-line/10">
              <ScrollArea orientation="vertical" scrollbar={variant} className="p-3">
                <div className="flex flex-col gap-3">{rows(16, "a bounded viewport.")}</div>
              </ScrollArea>
            </div>
            <p className="text-xs text-quebi-fg-muted">
              <span className="font-medium text-quebi-fg">{variant}</span> — {caption}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "The corners it follows, and the one it cannot",
    description:
      'A scrollbar is painted inside the border box, and neither overflow nor border-radius clips it — so a flush bar would run out through the corner arc and square off against the top and bottom edges. The ScrollArea clips itself to its own rounded rect instead, so the bar\'s ends curve away with whatever radius the surface has: square, md and lg are all correct, and a horizontal bar meets the two bottom corners the same way. Past roughly a quarter of the surface\'s height the arc is longer than the straight run the bar travels along and eats most of it — a capsule-shaped scroll surface wants scrollbar="floating", or a smaller radius.',
    render: () => (
      <div className="flex w-full flex-wrap gap-4">
        {(
          [
            ["rounded-none", "px-5 py-4", "square — nothing to follow"],
            ["rounded-quebi-md", "px-5 py-4", "12px — the card radius"],
            ["rounded-quebi-lg", "px-5 py-4", "16px — large surfaces"],
            ["rounded-full", "px-12 py-10", "too far — the arc eats the bar"],
          ] as const
        ).map(([radius, inset, caption]) => (
          <div key={radius} className="flex w-44 flex-col gap-2">
            <div className={`h-44 border border-quebi-line/10 ${radius}`}>
              <ScrollArea orientation="vertical" className={inset}>
                <div className="flex flex-col gap-3">{rows(14, "scroll me.")}</div>
              </ScrollArea>
            </div>
            <p className="text-xs text-quebi-fg-muted">
              <span className="font-medium text-quebi-fg">{radius}</span> — {caption}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Both axes",
    description:
      "orientation defaults to both. The two bars share the bottom-right corner, and the square where they meet is transparent — so what shows through it is the surface's own corner rather than a notch cut out of it.",
    render: () => (
      <div className="h-56 w-full max-w-md rounded-quebi-md border border-quebi-line/10">
        <ScrollArea className="p-4">
          <div className="flex w-max flex-col gap-3">
            {rows(
              16,
              "a row that runs well past the right edge of this viewport, so the horizontal bar has a decent run of track to travel along.",
            )}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  {
    title: "Edge fade",
    description: "Enable scrollFade to softly mask content at the scrolled edges.",
    render: () => (
      <div className="h-56 w-full max-w-sm rounded-quebi-md border border-quebi-line/10">
        <ScrollArea orientation="vertical" scrollFade className="p-4">
          <div className="flex flex-col gap-3">
            {rows(20, "the fade hints there is more above and below.")}
          </div>
        </ScrollArea>
      </div>
    ),
  },
  {
    title: "Scrollbar gutter",
    description:
      "scrollbarGutter sets scrollbar-gutter: stable, holding the bar's space whether or not it shows, so content never shifts. With a flush bar that reserved space is the bar's own 6px.",
    render: () => (
      <div className="h-56 w-full max-w-sm rounded-quebi-md border border-quebi-line/10">
        <ScrollArea orientation="vertical" scrollbarGutter className="p-4">
          <div className="flex flex-col gap-3">
            {rows(16, "the gutter keeps the right edge aligned.")}
          </div>
        </ScrollArea>
      </div>
    ),
  },
]
