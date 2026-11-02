import type { RuleMeta } from "./types"

/**
 * Tier 2 again — still a layout element, still the consumer's to write, but one
 * CSS quirk away from drawing a scrollbar nobody asked for.
 *
 * The spec says an `overflow` of `visible` on one axis becomes `auto` as soon as
 * the other axis is anything but `visible`. So `overflow-x-auto` alone is a
 * two-axis scroller, and every pixel a child hangs past the box — the selected
 * tab's underline sitting on the list's hairline, a focus ring, a `-mb-px` — is
 * a pixel of vertical scroll. The fix is one class, and the check is a class
 * string: name the other axis in the same list as the one that scrolls.
 */
export const scrollOnOneAxisNamesTheOtherRule: RuleMeta = {
  id: "scroll-on-one-axis-names-the-other",
  title: "A scroller on one axis says what the other axis does",
  navTitle: "One-axis scrolling",
  summary:
    "overflow-x-auto alone also scrolls vertically, because CSS will not keep one axis visible while the other clips. Write the other axis next to it — overflow-x-auto overflow-y-hidden, overflow-y-auto overflow-x-hidden — or use overflow-auto if both really scroll.",
  severity: "warn",
  category: "element-usage",
  tier: 2,
  failureMode:
    "An agent makes a tab strip, a chip row or a code block scroll sideways with `overflow-x-auto`, sees it work, and ships a 1px vertical scrollbar: something inside hangs a pixel past the box — the selected tab's underline laid over the list's border, a focus ring, a negative margin — and the browser offers to scroll to it. It looks right in the screenshot that was checked, and wrong on the next platform, zoom level or theme.",
  rationale: [
    "`overflow-x: auto` with `overflow-y` left alone does not mean \"scroll sideways, leave the vertical axis as it was\". The spec computes `visible` on one axis to `auto` when the other is not `visible`, because a box cannot both clip and not clip its content. So a one-axis class is a two-axis scroller, and the axis nobody wrote down scrolls too.",
    "A scroller clips at the inside of its border, and plenty of things are drawn a pixel or two past it on purpose: the selected tab's underline moved down 1px to sit on the list's hairline, a focus ring with an offset, a `-mb-px` that merges two borders. Each of those is invisible overflow until the parent becomes a scroller — then it is a scrollbar, on the axis nobody was thinking about, sized to a single pixel. Where scrollbars overlay (macOS by default) it only shows while scrolling, which is how it gets through review and turns up on someone else's machine.",
    "The fix is to name the other axis in the same class list: `overflow-x-auto overflow-y-hidden` for a strip, `overflow-y-auto overflow-x-hidden` for a list. `hidden` clips exactly what `auto` clipped — that was never optional — and stops offering a scrollbar for it. If the overhang is something the reader must see, the class does not fix it: move it inside the box (`bottom-0` instead of `-bottom-px`, an inset ring, a `p-1` that leaves the ring room), because a scroller cannot show anything past its edge on either axis. If content really can be larger than the box both ways, that is `overflow-auto`, and writing it says so.",
    "It warns rather than fails. Most hits are a missing class with an obvious value, but which value — `hidden`, or a second `auto` because the content really can be wider — depends on the content, and that is a judgement the linter cannot make. The examples carry `relative` because a scroll container is also a positioning context — that is position-scroll-containers, a different bug in the same class list.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "A tab strip that scrolls sideways",
      wrong: `<Tabs>
  <TabList className="relative overflow-x-auto" aria-label="Sections">
    <Tab id="overview">Overview</Tab>
    <Tab id="activity">Activity</Tab>
    <Tab id="settings">Settings</Tab>
  </TabList>
</Tabs>`,
      right: `<Tabs>
  <TabList className="relative overflow-x-auto overflow-y-hidden" aria-label="Sections">
    <Tab id="overview">Overview</Tab>
    <Tab id="activity">Activity</Tab>
    <Tab id="settings">Settings</Tab>
  </TabList>
</Tabs>`,
      note: "The selected tab's underline sits 1px below the tab, on top of the list's hairline — which is the list's border, and a scroller clips at the inside of its border. With overflow-y left alone that pixel became a vertical scrollbar. overflow-y-hidden says there is nothing to scroll to vertically, which was always true.",
    },
    {
      title: "A list that scrolls down",
      source: "src/components/async-select.tsx",
      sourceFixed: true,
      wrong: `<div className="quebi-scrollbar relative max-h-72 overflow-y-auto overscroll-contain p-1">
  {options}
</div>`,
      right: `<div className="quebi-scrollbar relative max-h-72 overflow-y-auto overflow-x-hidden overscroll-contain p-1">
  {options}
</div>`,
      note: "The same rule turned sideways: a focus ring or a long unbroken label one pixel wider than the list gave it a horizontal scrollbar. A list scrolls down; across it has nothing to offer.",
    },
    {
      title: "Both axes scroll — say both",
      wrong: `<div className="relative overflow-x-auto">
  <pre>{source}</pre>
</div>`,
      right: `<div className="relative overflow-auto">
  <pre>{source}</pre>
</div>`,
      note: "When the content really can be wider and taller than the box — a code block in a fixed-height panel — a two-axis scroller is the design, and overflow-auto writes down what overflow-x-auto was already doing.",
    },
  ],
  exceptions: [
    {
      scope: "A class list split across strings",
      reason:
        "The check reads one string at a time, so `cn(\"overflow-x-auto\", \"overflow-y-hidden\")` is reported for the first string even though the element is fine. Put both axes in the same string — they are one decision, and they read better together — rather than suppressing it.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Same two string kinds as the tier-2 surface check: a JSX attribute value
    // and a plain JS string (the arguments to cn() and tv()). One branch per
    // scrolling axis. "The other axis is named" accepts any overflow-<other>-*
    // and any two-axis overflow-* — overflow-x-auto overflow-y-auto is
    // overflow-auto written longhand, and overflow-hidden overflow-x-auto is a
    // strip with a hidden y. Variant prefixes are not read: sm:overflow-y-hidden
    // counts as naming y, which is the forgiving miss rather than the noisy one.
    // Biome's GritQL regexes have no lookaround, hence `and` / `not`.
    biome: {
      via: "plugin",
      pattern: `or { string(), JsxString() } as $classes where {
  $classes <: or {
    and {
      r".*\\boverflow-x-(?:auto|scroll)\\b.*",
      not r".*\\boverflow-(?:y-[a-z]+|auto|scroll|hidden|clip|visible)\\b.*"
    },
    and {
      r".*\\boverflow-y-(?:auto|scroll)\\b.*",
      not r".*\\boverflow-(?:x-[a-z]+|auto|scroll|hidden|clip|visible)\\b.*"
    }
  }`,
    },
    message:
      "A scroller on one axis scrolls on both: CSS turns the other axis's `visible` into `auto`, so a pixel hanging past the box (an underline, a focus ring) becomes a scrollbar. Name the other axis in the same class list — overflow-x-auto overflow-y-hidden, overflow-y-auto overflow-x-hidden — or write overflow-auto if both really scroll. See https://ui-lib.quebi.de/rules/scroll-on-one-axis-names-the-other",
    grep: "overflow-[xy]-(auto|scroll)",
    note: "The check reads one string literal at a time. It catches the one-axis class written alone, which is the whole bug; it does not see a class list assembled from a template literal, and it reports a list whose two axes were split across two strings of the same cn() call. It cannot see the overhang itself — whether a child is drawn past the box is a question about layout, not about the class list — so the class it asks for stops the scrollbar, and moving the overhang inside the box is still yours if it has to be visible. The ripgrep line finds every one-axis scroller; which of them name the other axis is a review question.",
  },
  tags: ["elements", "layout", "tailwind", "overflow", "scrolling", "tier-2"],
}
