import type { RuleMeta } from "./types"

/**
 * Platform defaults, third of three — the scroll the browser does for you.
 *
 * Found in the library before it was written down (task #250): every toggle in
 * a Dialog scrolled the modal frame on click, because the hidden input
 * react-aria renders inside it was positioned against the frame rather than
 * against the control or the scrolling body. The fix was a `relative` on the
 * control roots and on every scroll container, and `overflow-clip` on the
 * frames; this is the half of it a consumer's own markup can get wrong.
 */
export const positionScrollContainersRule: RuleMeta = {
  id: "position-scroll-containers",
  title: "A scroll container is a positioning context",
  navTitle: "Position scroll boxes",
  summary:
    "A class list with overflow-auto, overflow-x-auto, overflow-y-auto or overflow-scroll also carries relative (or absolute, fixed, sticky), so an absolutely positioned descendant — the hidden input inside every Checkbox, Radio and Switch — is laid out inside the box that scrolls, not inside a frame above it.",
  severity: "warn",
  category: "platform-defaults",
  failureMode:
    "An agent makes a panel scroll by writing `overflow-y-auto` and stops there, because the panel scrolls and nothing on screen says otherwise. The visually hidden input inside a toggle is `position: absolute`, so its containing block is whatever positioned ancestor sits above the panel — and when a click focuses that input, the browser scrolls that ancestor to reveal it, even when it is `overflow-hidden`. The frame slides up and leaves a blank band, on the first click, in a component nobody touched.",
  rationale: [
    "Focusing an element scrolls every scrollable ancestor until the element is in view, and `overflow: hidden` is scrollable — it hides the scrollbar, not the scroll position, so `scrollTop` moves when the browser asks it to. A hidden input that is laid out against a clipping frame instead of against the scroll box it visually sits in is, from the browser's point of view, an element below the frame's fold; focusing it scrolls the frame, and the frame has no scrollbar to scroll it back with.",
    "react-aria's Checkbox, Radio and Switch each render their real `<input>` visually hidden, with `position: absolute`, so that it is focusable and announced without being seen. An absolutely positioned element is laid out against its nearest positioned ancestor. ui-lib's controls are positioned at their root, so inside the library the input stays where the control is — but a scroll container you write yourself, with a custom row or a third-party widget in it, is only safe if the container is positioned too, because then nothing inside it can be laid out against anything above it.",
    "`relative` on a box that is not otherwise positioned changes nothing you can see: it moves nothing, and it only changes where absolutely positioned descendants measure from — which, for a box that scrolls, is the box they should have been measuring from anyway. The other three position values already establish the context, so a class list carrying any of them passes.",
    "This is a warning rather than an error for the one case where adding `relative` is not free: an absolutely positioned descendant that was deliberately anchored to an ancestor outside the scroll box — a badge pinned to the corner of the card around it, say — moves when the scroll box becomes its containing block. That is worth a look before the class goes in, which is a judgement the linter cannot make for you.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "The dialog body that scrolled its own frame",
      source: "src/components/dialog.tsx (DialogBody)",
      sourceFixed: true,
      wrong: `const DialogBody = ({ className, ...props }) => (
  <div
    data-slot="dialog-body"
    className={cn("isolate flex min-h-0 flex-1 flex-col overflow-auto px-(--gutter) py-1", className)}
    {...props}
  />
)`,
      right: `const DialogBody = ({ className, ...props }) => (
  <div
    data-slot="dialog-body"
    className={cn("relative isolate flex min-h-0 flex-1 flex-col overflow-auto px-(--gutter) py-1", className)}
    {...props}
  />
)`,
      note: "The modal frame around this body was `relative overflow-hidden`, so it was the nearest positioned ancestor of every hidden input in the body. Clicking the last checkbox in a tall dialog scrolled the frame rather than the body. ui-lib now positions both the body and the control root, and clips its frames with `overflow-clip`, which cannot be scrolled at all — this rule is the half that a scroll box of your own still needs.",
    },
    {
      title: "A settings list that scrolls inside a card",
      wrong: `<Card>
  <div className="max-h-80 overflow-y-auto">
    {settings.map((s) => (
      <Switch key={s.id} defaultSelected={s.on}>{s.label}</Switch>
    ))}
  </div>
</Card>`,
      right: `<Card>
  <div className="relative max-h-80 overflow-y-auto">
    {settings.map((s) => (
      <Switch key={s.id} defaultSelected={s.on}>{s.label}</Switch>
    ))}
  </div>
</Card>`,
      note: "One class. With it, anything absolutely positioned inside the list — a control's hidden input, a row's drag handle, a third-party widget's own visually hidden field — is laid out inside the box that scrolls.",
    },
  ],
  exceptions: [],
  enforcement: {
    kind: "lint",
    // Two regexes over one string literal, because GritQL's regexes have no
    // lookahead: the first finds a scrolling overflow class, the second clears
    // it if a position class is in the same string. The token edges are
    // "start, end, or a character that cannot be part of a class name", so
    // `sm:relative` counts as positioned, `bg-fixed` does not, and
    // `overflow-x-hidden` is not a scroll container. Neither the library nor
    // this rule bans `overflow-hidden` itself: clipping is not the bug, an
    // unpositioned scroll box is.
    biome: {
      via: "plugin",
      pattern: `or { string(), JsxString() } as $classes where {
  $classes <: r".*(?:^|[^\\w-])overflow-(?:[xy]-)?(?:auto|scroll)(?:$|[^\\w-]).*",
  $classes <: not r".*(?:^|[^\\w-])(?:relative|absolute|fixed|sticky)(?:$|[^\\w-]).*"`,
    },
    message:
      "A scroll container without a position class. The hidden input inside a Checkbox, Radio or Switch is position: absolute, so it is laid out against the nearest positioned ancestor above this box; focusing it makes the browser scroll that ancestor, even an overflow-hidden frame, and the frame slides out from under the content. Add relative to the same class string (absolute, fixed or sticky also count). See https://ui-lib.quebi.de/rules/position-scroll-containers",
    grep: "overflow-(x-|y-)?(auto|scroll)\\b",
    note: "The check reads one string literal at a time, so the position class has to be in the same string as the overflow class: `cn(\"fixed\", \"overflow-y-auto\")` is reported even though the element is positioned. Repeat the position class in the second string — cn() merges the duplicate away. A class list built from a template literal slips past it, like every class-string check here. The grep finds every scroll container, positioned or not, so read its hits rather than counting them.",
  },
  tags: ["layout", "scrolling", "focus", "tailwind", "dialogs"],
}
