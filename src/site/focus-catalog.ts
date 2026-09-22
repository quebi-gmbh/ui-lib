/**
 * The focus-indicator catalogue: every common way to say "this control has
 * keyboard focus", as data.
 *
 * One entry per technique, one CSS block per entry in `src/focus-variants.css`,
 * and `tests/focus-catalog.test.ts` fails if either side grows a member the
 * other does not have. That pairing is what keeps the page honest: a tile whose
 * CSS was never written renders as a field that does nothing on focus, which is
 * indistinguishable from the `none` baseline and would be read as a finding
 * about the technique rather than as a missing block.
 *
 * `verdict` is about the drawing *as this page draws it*, not about the family
 * in general — `border-color` at 2px on a light hairline can clear 1.4.11, and
 * the same technique at 1px cannot. The two criteria it is measured against:
 *
 * - **WCAG 1.4.11 Non-text Contrast (AA)** — the indicator must reach 3:1
 *   against what is adjacent to it.
 * - **WCAG 2.4.13 Focus Appearance (AAA)** — at least the area of a 2px
 *   perimeter, and 3:1 between the focused and unfocused states.
 *
 * `--q-brand-mark` clears 3:1 on both themes with 0.45 to spare (task #96), so
 * a variant here fails on geometry or on translucency, never on hue.
 */

/** How a variant stands against 1.4.11 / 2.4.13 as drawn on this page. */
export type FocusVerdict = "passes" | "conditional" | "fails"

export interface FocusVariant {
  /** Matches the `[data-focus-variant="…"]` selector in focus-variants.css. */
  id: string
  name: string
  /** The declarations that do the work, shown next to the tile. */
  css: string
  /** What it is, and the one thing that decides whether you want it. */
  note: string
  verdict: FocusVerdict
  /** Why that verdict. Shown on the tile — a badge with no reason is a rating. */
  verdictWhy: string
}

export interface FocusGroup {
  id: string
  title: string
  blurb: string
  variants: FocusVariant[]
}

export const focusGroups: FocusGroup[] = [
  {
    id: "baseline",
    title: "Baseline",
    blurb:
      "What the field looks like with the indicator taken away. Every tile below is read against this one.",
    variants: [
      {
        id: "none",
        name: "Suppressed",
        css: "outline: none;",
        note: "The most common focus bug in the world, and it is one line long. It is here so the rest of the page has a floor to be measured from.",
        verdict: "fails",
        verdictWhy: "No indicator at all. Keyboard operation of the field becomes invisible.",
      },
    ],
  },
  {
    id: "outline",
    title: "Perimeter — outline",
    blurb:
      "`outline` does not affect layout, follows `border-radius`, and is the one perimeter that survives forced-colors mode. It is clipped by an ancestor's `overflow: hidden`, which is the reason a library reaches for a ring instead.",
    variants: [
      {
        id: "ua-default",
        name: "Browser default",
        css: "outline-style: auto;",
        note: "Hands the drawing back to the browser: a black-and-white pair in Chrome, a blue glow in Safari, a dotted rect in Firefox. Free, never wrong, and never yours.",
        verdict: "passes",
        verdictWhy: "Each browser's default is built to clear 1.4.11 against any backdrop.",
      },
      {
        id: "outline-flush",
        name: "Flush outline",
        css: "outline: 2px solid var(--accent);\noutline-offset: 0;",
        note: "Sits directly on the border. Cheapest correct answer, and the one that reads as a thickened edge rather than as a ring.",
        verdict: "passes",
        verdictWhy: "2px at full opacity, 3.45:1 on light and 10.64:1 on dark.",
      },
      {
        id: "outline-offset",
        name: "Offset outline",
        css: "outline: 2px solid var(--accent);\noutline-offset: 2px;",
        note: "A band of backdrop between the border and the mark. The gap is what makes the same ink read as a ring around the field instead of a bloom leaking out of it.",
        verdict: "passes",
        verdictWhy: "2px at full opacity, with backdrop on both sides of the mark.",
      },
      {
        id: "outline-inset",
        name: "Inset outline",
        css: "outline: 2px solid var(--accent);\noutline-offset: -4px;",
        note: "Takes the gap out of the control rather than out of its neighbour. The answer for a cell in a grid or a row in a table, where an outward mark paints over the row above.",
        verdict: "passes",
        verdictWhy: "2px at full opacity against the field's own fill.",
      },
      {
        id: "outline-dashed",
        name: "Dashed outline",
        css: "outline: 2px dashed var(--accent);\noutline-offset: 2px;",
        note: "The desktop focus rect, and it still reads as temporary rather than as decoration — which is exactly what focus is. Out of place in a design system that has no other dashed line.",
        verdict: "conditional",
        verdictWhy:
          "The dashes cut the perimeter's area roughly in half; 2.4.13 measures area, so it wants a thicker dash than a solid stroke.",
      },
      {
        id: "halo-two-tone",
        name: "Two-tone halo",
        css: "box-shadow: 0 0 0 3px var(--accent);\noutline: 2px solid var(--fg);\noutline-offset: 3px;",
        note: "Accent inside, page foreground outside. Guarantees contrast against *any* backdrop, because one of the two always contrasts with it — which is why GitHub and macOS draw focus this way.",
        verdict: "passes",
        verdictWhy: "Contrast is structural rather than measured: one of the two rings always clears 3:1.",
      },
    ],
  },
  {
    id: "ring",
    title: "Perimeter — box-shadow ring",
    blurb:
      "A ring composes with other shadows, animates, and takes as many layers as you like. It is also dropped entirely in forced-colors mode and clipped by an ancestor's `overflow: hidden` — so a ring alone is never the whole answer.",
    variants: [
      {
        id: "ring-flush",
        name: "Flush ring",
        css: "border-color: var(--accent);\nbox-shadow: 0 0 0 2px var(--accent);",
        note: "Border and ring in the same ink with nothing between them: 3px of continuous colour with no edge to say where the field stops. This is the shape that gets reported as the focus glow being too much.",
        verdict: "conditional",
        verdictWhy:
          "Clears 1.4.11 on contrast and still reads as a bloom. The failure here is legibility, not measurement.",
      },
      {
        id: "ring-offset",
        name: "Offset ring",
        css: "border-color: var(--accent);\nbox-shadow:\n  0 0 0 2px var(--backdrop),\n  0 0 0 4px var(--accent);",
        note: "The flush ring with a 2px band of backdrop pushed into the seam. quebi's own treatment — the same ink, moved 2px out, and that was the whole fix.",
        verdict: "passes",
        verdictWhy: "2px at full opacity with a backdrop band on the inside edge.",
      },
      {
        id: "ring-inset",
        name: "Inset ring",
        css: "box-shadow: inset 0 0 0 2px var(--accent);",
        note: "The ring drawn inside the field. Nothing outside the control moves, so it is the form to use in a dense list or a table.",
        verdict: "passes",
        verdictWhy: "2px at full opacity against the field's own fill.",
      },
      {
        id: "ring-glow",
        name: "Soft glow",
        css: "border-color: var(--accent);\nbox-shadow: 0 0 0 4px\n  color-mix(in oklab, var(--accent) 25%, transparent);",
        note: "Bootstrap's idiom: an opaque border carrying the contrast and a translucent spread carrying the emphasis. It works because the border is doing the accessible half.",
        verdict: "conditional",
        verdictWhy:
          "The glow itself is ~1.3:1 and cannot be the indicator. It passes only while the opaque border under it is present.",
      },
      {
        id: "ring-thick-soft",
        name: "Thick, low contrast",
        css: "box-shadow: 0 0 0 6px\n  color-mix(in oklab, var(--accent) 22%, transparent);",
        note: "The same ink spread over three times the area with no opaque edge under it. Prominent to the eye and nearly absent to a contrast meter.",
        verdict: "fails",
        verdictWhy: "~1.3:1 against the backdrop. 1.4.11 measures contrast, not how much of the screen you covered.",
      },
      {
        id: "ring-animated",
        name: "Animated ring",
        css: "@keyframes quebi-focus-ring-in {\n  from { opacity: 0; transform: scale(1.04); }\n}",
        note: "The offset ring, arriving. 180ms is enough to be read as motion and short enough not to lag a Tab held down — and it is dropped entirely under `prefers-reduced-motion`.",
        verdict: "passes",
        verdictWhy: "Resolves to a 2px opaque ring; the animation only affects how it arrives.",
      },
      {
        id: "ring-gradient",
        name: "Gradient ring",
        css: "background: conic-gradient(…);\nmask: linear-gradient(#000 0 0) content-box,\n      linear-gradient(#000 0 0);\nmask-composite: exclude;",
        note: "A gradient cannot be a border colour, so this is a masked pseudo-element — an extra box on every field that uses it. Striking once, and hard to keep meaning anything when every state is a gradient.",
        verdict: "conditional",
        verdictWhy:
          "Contrast varies around the perimeter. It passes only if the *lightest* stop clears 3:1, which is not how these get tuned.",
      },
      {
        id: "corner-brackets",
        name: "Corner brackets",
        css: "mask:\n  linear-gradient(#000 0 0) 0 0 / 14px 14px no-repeat,\n  … three more corners;",
        note: "Only the corners marked. Reads as a viewfinder, which is either exactly the register you want or completely the wrong one.",
        verdict: "fails",
        verdictWhy:
          "Four 14px corners are well under the area 2.4.13 asks for, and three of the four edges carry no mark at all.",
      },
    ],
  },
  {
    id: "border",
    title: "Border",
    blurb:
      "The cheapest family, and the one most likely to collide with something else: a border is usually already carrying the resting state, the hover state and the invalid state.",
    variants: [
      {
        id: "border-color",
        name: "Border colour only",
        css: "border-color: var(--accent);",
        note: "Nothing added, one property changed. It is also the same gesture as hover and as invalid, so on a field that has both, focus becomes the third meaning of one line.",
        verdict: "fails",
        verdictWhy:
          "A 1px stroke is under 2.4.13's area floor, and the focused/unfocused pair is a hue change rather than a 3:1 change.",
      },
      {
        id: "border-thicken",
        name: "Border thickens",
        css: "border-color: var(--accent);\nbox-shadow: inset 0 0 0 1px var(--accent);",
        note: "A real 1px → 2px border reflows the field, so the second pixel is an inset ring. Same drawing, no layout cost, and the substitution is the point rather than a shortcut.",
        verdict: "passes",
        verdictWhy: "2px at full opacity once the inset pixel is counted with the border.",
      },
      {
        id: "underline",
        name: "Underline",
        css: "box-shadow: inset 0 -2px 0 0 var(--accent);",
        note: "Material's filled idiom. One edge, which is a different design language from a perimeter — mixing the two in one library is the usual way this goes wrong.",
        verdict: "conditional",
        verdictWhy: "One edge of four. 1.4.11 is satisfied; 2.4.13's area floor is not, unless the bar is thicker.",
      },
      {
        id: "underline-grow",
        name: "Underline, growing",
        css: "transform: scaleX(0) → scaleX(1);\ntransition: transform 200ms ease-out;",
        note: "The same bar, arriving from the centre. The motion says which field you moved to, which is the one thing a static underline cannot.",
        verdict: "conditional",
        verdictWhy: "Same geometry as the static underline; the transition changes nothing a meter can read.",
      },
      {
        id: "edge-bar",
        name: "Start-edge bar",
        css: "inset-inline-start: 0;\nwidth: 3px;",
        note: "The nav and list idiom, placed with a logical inset so it stays on the reading edge in RTL. On a field it competes with the label, which is on the same edge.",
        verdict: "conditional",
        verdictWhy: "3px on one edge clears 1.4.11; 2.4.13's perimeter area needs more than a single side.",
      },
      {
        id: "float-label",
        name: "Floating label",
        css: ".label { top: 1.85rem → 0; }",
        note: "Material's filled field: the label doubles as the placeholder and lifts clear on focus. It buys vertical space and spends it on a label that is missing until you look.",
        verdict: "conditional",
        verdictWhy:
          "The lift is a position change, not a contrast change. It needs the border accent beside it to clear either criterion.",
      },
      {
        id: "notched-outline",
        name: "Notched outline",
        css: ".label { background: var(--backdrop); }",
        note: "Material's outlined field: the label lands on the border carrying a chip of backdrop, which is what cuts the notch. The only variant here that breaks the instant the backdrop colour is wrong.",
        verdict: "conditional",
        verdictWhy: "Same as the floating label — the notch is geometry. The 2px border under it is what passes.",
      },
    ],
  },
  {
    id: "fill",
    title: "Fill and depth",
    blurb:
      "Marks that live inside the control rather than around it. These are the ones that work in a dense list, where a neighbour is 1px away and there is nowhere to put a ring.",
    variants: [
      {
        id: "bg-tint",
        name: "Background tint",
        css: "background-color:\n  color-mix(in oklab, var(--accent) 14%, transparent);\nborder-color: var(--accent);",
        note: "The surface shifts a step. The only family that works where controls touch, which is why every menu and listbox in this library uses it for the focused option.",
        verdict: "conditional",
        verdictWhy: "The tint is ~1.2:1 on its own. The border beside it is what carries 1.4.11.",
      },
      {
        id: "inverted",
        name: "Inverted",
        css: "background-color: var(--accent);\ncolor: var(--on-accent);",
        note: "Foreground and background swap — the System Highlight gesture. Unmistakable, and it takes the field's own text colour hostage, so the value has to be readable on the accent.",
        verdict: "passes",
        verdictWhy: "The whole control changes; the focused/unfocused pair clears 3:1 by a wide margin.",
      },
      {
        id: "elevation",
        name: "Elevation",
        css: "box-shadow: var(--q-glow-strong);\nborder-color: var(--accent);",
        note: "The field lifts. quebi's glow is mint light coming off the surface rather than a drop shadow, so it reads on the dark page and nearly vanishes on the light one.",
        verdict: "conditional",
        verdictWhy: "A glow has no measurable edge. It passes here only because of the opaque border under it.",
      },
      {
        id: "scale",
        name: "Scale",
        css: "transform: scale(1.03);",
        note: "The field grows. It also moves its neighbours' apparent position, and it is removed entirely under `prefers-reduced-motion` — which leaves that reader with no indicator at all unless something else is drawn.",
        verdict: "fails",
        verdictWhy: "Size is not contrast, and the one mark it has disappears for anyone who asked for less motion.",
      },
      {
        id: "caret",
        name: "Caret only",
        css: "caret-color: var(--accent);",
        note: "The blinking caret is already a focus indicator — for a text field, on a sighted reader, at close range. It is here to show how much that leaves out: it is absent on every control that is not a text field.",
        verdict: "fails",
        verdictWhy: "A 1px blinking bar is neither a perimeter nor a state change the field itself reports.",
      },
    ],
  },
  {
    id: "satellite",
    title: "Satellite — the indicator is not on the control",
    blurb:
      "Something near the field changes instead of the field. Each of these is a genuine addition and none of them is sufficient alone, which is the reason to see them in the same grid as the ones that are.",
    variants: [
      {
        id: "label-accent",
        name: "Label accent",
        css: ".label { color: var(--accent); }",
        note: "The label takes the accent. Useful as a second signal in a long form, where the ring tells you which field and the label tells you which question.",
        verdict: "fails",
        verdictWhy: "The indicator is not on the control, and text colour is 1.4.3's business rather than 1.4.11's.",
      },
      {
        id: "adornment",
        name: "Adornment highlight",
        css: "[data-slot=\"control\"]::after {\n  background-color: var(--accent);\n}",
        note: "A leading icon or trailing affix lights up. Fine as reinforcement, and it quietly assumes every field has an adornment to light.",
        verdict: "fails",
        verdictWhy: "A 8px dot is far under the area floor and says nothing about the control's boundary.",
      },
      {
        id: "hint-reveal",
        name: "Description reveal",
        css: ".hint { opacity: 0 → 1; }",
        note: "Help text appears on focus. It is a real pattern and a real trap: content that exists only while focused is unreachable by anything that is not the pointer or the keyboard caret.",
        verdict: "fails",
        verdictWhy:
          "Not an indicator at all. It also risks 1.4.13, which governs content that appears on hover or focus.",
      },
      {
        id: "field-ring",
        name: "Whole-field ring",
        css: ".field:has(:focus-visible) {\n  box-shadow: 0 0 0 4px var(--accent);\n}",
        note: "The ring wraps label, control and hint as one block. Right for a composite — a date range, a card of radios — and oversized for a single input.",
        verdict: "passes",
        verdictWhy: "2px at full opacity; the perimeter is larger than the control's but no less measurable.",
      },
    ],
  },
  {
    id: "system",
    title: "System-driven",
    blurb:
      "Colours and properties the operating system owns. This is the family that still works when the user has replaced your palette with their own.",
    variants: [
      {
        id: "system-highlight",
        name: "System Highlight",
        css: "outline: 3px solid Highlight;\noutline-offset: 2px;",
        note: "`Highlight` is a real system colour everywhere, not a forced-colors spelling — so this tile draws your OS selection colour right now. In forced-colors mode it is the only perimeter on this page guaranteed to survive: every box-shadow is dropped and every border colour is replaced.",
        verdict: "passes",
        verdictWhy: "The user's own high-contrast pair, by definition contrasting with their own backdrop.",
      },
      {
        id: "accent-color",
        name: "accent-color",
        css: "accent-color: var(--accent);",
        note: "Tints the glyph a browser draws for a native checkbox, radio or range. A text input has no such glyph, so this tile is identical to the suppressed one at the top — which is the fact worth seeing.",
        verdict: "fails",
        verdictWhy: "Inert on a text field. It is a control-appearance property, not a focus indicator.",
      },
    ],
  },
]

/** Every variant, flattened — the order the page reads them in. */
export const focusVariants: FocusVariant[] = focusGroups.flatMap((group) => group.variants)
