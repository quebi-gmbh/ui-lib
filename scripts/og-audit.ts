/**
 * The share images, measured.
 *
 * A scene is a photograph of a component, and the only reader it has is someone
 * glancing at a Slack or iMessage unfurl — a 1200×630 file drawn about 400px
 * wide, with no caption. Three things make that picture unreadable, and all
 * three are numbers the browser already knows while `scripts/screenshot-og.ts`
 * has the page open:
 *
 * 1. **It does not fit.** The stage is `overflow-hidden`, so a scene that is
 *    too big does not complain — it silently loses its edges, and the bottom of
 *    it lands under the band where the component's name is drawn. Ten scenes
 *    were being cropped this way before task #202.
 * 2. **The type is too small.** At a third of the file's width, 18px in the
 *    file is 6px on screen. The floor here is {@link TEXT_FLOOR_PX}, measured
 *    *after* the stage's `scale` — which is what makes it a statement about the
 *    published picture rather than about the source.
 * 3. **The browser had to elide something.** An ellipsis is the shape saying it
 *    does not fit; "Desi…" next to "Foc…" is grey mush at thumbnail size. The
 *    fix is shorter fixture data, never a wider box.
 *
 * ## Why 18px, and why measured after `scale`
 *
 * 18px is the observed cliff: below it, in a 400px-wide unfurl, glyphs stop
 * resolving into words. 20px is the rounder number and was tried first — it
 * fails a dozen scenes the review that commissioned this work calls good,
 * including `table`, whose column heads are 19.2px and perfectly readable, and
 * it buys nothing a reader can see. The floor is on the *rendered* size: a
 * scene is written at the size the component really is and the stage magnifies
 * it, so a 13px label at `scale: 1.6` is 20.8px and passes while the same label
 * at `scale: 1` does not.
 *
 * ## What is exempt, and why
 *
 * Two lists, both of them arguments rather than a way to make the check quiet.
 *
 * {@link OFF_STAGE} names the scenes whose surface is placed against the window
 * rather than laid out in the stage, and measures them against the canvas
 * instead. {@link FLOOR_EXCEPTIONS} names the scenes whose smallest text is a
 * grid the component draws at a size no prop reaches — a month is six rows of
 * day numbers whatever else is true — and holds each one to the size it
 * actually achieves, so the exception still fails if the scene gets smaller.
 */

/** The smallest rendered text any published image may contain, after `scale`. */
export const TEXT_FLOOR_PX = 18

/**
 * How far inside the stage a scene has to stay.
 *
 * Not zero: a scene whose last row sits exactly on the stage edge is a row
 * touching the component's name below it, which reads as a collision even
 * though nothing is technically clipped.
 */
export const STAGE_MARGIN_PX = 8

/**
 * The scenes whose surface is pinned to an edge of the window, with the reason
 * each one is, measured against the canvas instead of against the stage.
 *
 * Only these four. A modal, an alert dialog and a command palette are also
 * portalled out of the stage, and they are *not* here: `magnifyOverlays` in
 * `src/routes/og.$slug.tsx` nudges an unpinned surface back between the frame's
 * bands, so a dialog that would have grown over the logo has no excuse. What is
 * left is the surfaces whose whole shape is "attached to the edge of the
 * window", which is a thing the image has to be allowed to show. Quick Actions
 * is here because its panel *is* a `DrawerContent` on every side it has — a
 * picture of its menu anywhere else would be a picture of some other component.
 */
export const OFF_STAGE: Record<string, string> = {
  drawer: "the drawer spans the viewport's width and is pinned to its bottom edge",
  sheet: "the sheet spans the viewport's height and is pinned to a side of it",
  "quick-actions": "the panel is a Drawer: it spans the viewport's width and is pinned to its bottom edge",
  toast: "the toast region is pinned to a viewport corner",
}

/**
 * Scenes that cannot reach the floor, the size they hold to instead, and why.
 *
 * Every one of these is a component drawing a fixed grid of small type at a
 * cell size no prop changes, in a stage 396px tall. A month calendar is the
 * whole family: six rows of day numbers, a weekday header and a month heading
 * come to 259px of component, so the largest scale that fits the stage is about
 * 1.47 and the day numbers land at 16px however the scene is written. Making
 * them 18px means a calendar that is not a month — which is a change to
 * `Calendar`, not to a photograph of it.
 *
 * The number is what the scene measures today, less a pixel of slack. It is a
 * floor, not a licence: a scene that gets smaller than the size its exception
 * was written for fails like any other. Three of the entries are not calendars
 * at all — a Drawer, a Sheet and the Drawer Quick Actions opens are sized by the
 * window, so `magnifyOverlays` in
 * `src/routes/og.$slug.tsx` deliberately leaves them alone, and their type is
 * whatever the app's own is.
 */
export const FLOOR_EXCEPTIONS: Record<string, { px: number; reason: string }> = {
  calendar: { px: 15, reason: "a month is six rows of day numbers at the size Calendar draws them" },
  "range-calendar": { px: 14, reason: "the month grid, plus the row that names the range" },
  "week-picker": { px: 14, reason: "the month grid, plus the ISO week column beside it" },
  "conform-calendar": { px: 14, reason: "the month grid, under the field label that binds it" },
  "conform-range-calendar": { px: 13, reason: "the range month grid, under its field label" },
  "conform-week-picker": { px: 13, reason: "the week grid and its gutter, under its field label" },
  "date-picker": {
    px: 12,
    reason: "a trigger with a whole month hanging under it is 360px before anything else",
  },
  "date-range-picker": {
    px: 12,
    reason: "the same trigger and month, with two endpoints in the field",
  },
  drawer: {
    px: 14,
    reason:
      "full-bleed: the panel spans the window's width, so the frame cannot magnify it without pushing it off the edges it is attached to",
  },
  sheet: {
    px: 14,
    reason: "full-bleed: the panel spans the window's height, for the same reason as drawer",
  },
  "quick-actions": {
    px: 14,
    reason: "full-bleed: the panel is a bottom Drawer, for the same reason as drawer",
  },
}

/** One run of text the measurement found, with enough of it to recognise. */
export interface TextSample {
  px: number
  text: string
}

/** What one scene measured to, in the browser that is already open. */
export interface OgMeasurement {
  /** How far the scene reaches past each edge of the box it is measured in. */
  overflow: { top: number; right: number; bottom: number; left: number }
  /** The scene's own size, for the report. */
  size: { width: number; height: number }
  /** The smallest text in the picture, whether or not it passes. */
  smallest: TextSample | null
  /** Distinct text sizes below the floor, smallest first. */
  belowFloor: TextSample[]
  /** Text the browser elided, as it ended up on screen. */
  truncated: string[]
  /** How many runs of text were measured. Zero means the scene draws none. */
  runs: number
}

/**
 * Measures one scene, inside the page.
 *
 * Serialized and run in Chromium by `scripts/screenshot-og.ts`, so it closes
 * over nothing: every helper it uses is defined inside it.
 */
export function measureOgScene(options: {
  floorPx: number
  marginPx: number
  offStage: boolean
}): OgMeasurement {
  const { floorPx, marginPx, offStage } = options

  const root = document.querySelector("[data-og-slug]")
  const stage = document.querySelector("[data-og-stage]")
  const wrapper = document.querySelector("[data-og-scene]")
  if (!(root instanceof HTMLElement) || !(stage instanceof HTMLElement)) {
    throw new Error("the OG frame has no [data-og-slug] / [data-og-stage] to measure against")
  }

  const canvas = root.getBoundingClientRect()
  const frame = (offStage ? root : stage).getBoundingClientRect()
  // A surface the window placed is allowed to touch the edge of the image —
  // that is what a drawer across the bottom of a window looks like. The margin
  // is about a scene sitting on the stage's edge, where the band below it holds
  // the component's name.
  const margin = offStage ? 0 : marginPx

  // Everything the scene paints: what is inside the magnified wrapper, plus
  // anything it portalled out of the frame entirely.
  const partOfScene = (element: Element) =>
    wrapper?.contains(element) === true || !root.contains(element)

  // Elements that never carry the picture: document plumbing, and whatever the
  // dev server injects when the audit runs against `bun run dev`.
  const PLUMBING = new Set(["SCRIPT", "STYLE", "LINK", "META", "TITLE", "NOSCRIPT"])

  // A scrim is the frame's own darkness, not the scene's content: it covers the
  // whole canvas by definition, so counting it would say every overlay scene
  // overflows by exactly the frame's padding. The slack is for the scrollbar
  // gutter — a scrim is 1194px wide in a 1200px window, and an exact test
  // called that a scene and failed fourteen of them.
  const coversCanvas = (rect: DOMRect) =>
    rect.width >= canvas.width - 24 && rect.height >= canvas.height - 24

  // Off-canvas is not in the picture: recharts parks its tooltip 20,000px above
  // the chart until something hovers, and a union that counts it says every
  // chart scene overflows the stage by the height of a small building.
  const onCanvas = (rect: DOMRect) =>
    rect.right > canvas.left &&
    rect.left < canvas.right &&
    rect.bottom > canvas.top &&
    rect.top < canvas.bottom

  /**
   * The part of an element that is actually drawn.
   *
   * A carousel's fourth slide and a day column's 3am row are outside their
   * component and clipped by it, on purpose — that is what a scroll port looks
   * like. Only the *stage's* clipping is a bug, so every ancestor between the
   * element and the stage that clips is intersected in, and the stage itself is
   * where the walk stops.
   */
  const drawnRect = (element: Element, rect: DOMRect) => {
    let { top, right, bottom, left } = rect
    for (
      let node = element.parentElement;
      node && node !== stage && node !== root;
      node = node.parentElement
    ) {
      if (getComputedStyle(node).overflow === "visible") continue
      const clip = node.getBoundingClientRect()
      top = Math.max(top, clip.top)
      left = Math.max(left, clip.left)
      right = Math.min(right, clip.right)
      bottom = Math.min(bottom, clip.bottom)
    }
    return { top, right, bottom, left, width: right - left, height: bottom - top } as DOMRect
  }

  const painted = (element: Element, rect: DOMRect, style: CSSStyleDeclaration) => {
    if (PLUMBING.has(element.tagName)) return false
    // 1×1 is the visually-hidden box a11y text lives in; it is not in the
    // picture, and its inherited font-size is not a finding.
    if (rect.width < 2 || rect.height < 2) return false
    if (style.visibility === "hidden") return false
    return Number(style.opacity) >= 0.05
  }

  /**
   * The transform scale an element actually renders at, stage included.
   *
   * `hypot(a, b)` rather than `a`, because `a` is the matrix's x-scale *after*
   * rotation: a schedule's axis labels are `rotate(-90deg)`, whose `a` is zero,
   * and the first version of this reported their type as 0px and divided by it.
   */
  const renderedScale = (element: Element) => {
    let scale = 1
    for (let node: Element | null = element; node; node = node.parentElement) {
      const { transform } = getComputedStyle(node)
      if (transform && transform !== "none") {
        const matrix = new DOMMatrixReadOnly(transform)
        scale *= Math.hypot(matrix.a, matrix.b)
      }
    }
    return scale
  }

  /** Only the text this element owns — a parent does not re-count its child's. */
  const ownText = (element: Element) =>
    Array.from(element.childNodes)
      .filter((node) => node.nodeType === 3)
      .map((node) => node.textContent ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim()

  /**
   * Whether the browser had to cut this element's text off.
   *
   * `scrollWidth > clientWidth` is the usual test and it is not enough: both are
   * integers in layout pixels, and a label that overflows its box by a third of
   * a pixel — which is all it takes for Chromium to draw an ellipsis — reports
   * the same number for each. Week View's `11:00 – 12:00` was exactly that
   * case, elided in the published image and passing the audit. So the text is
   * measured instead: a Range over the element's contents is laid out at its
   * full width whatever the painting does with it, in the same scaled pixels as
   * the element's own rect.
   */
  const elided = (element: Element, rect: DOMRect, style: CSSStyleDeclaration) => {
    if (style.textOverflow === "ellipsis") {
      if (element.scrollWidth - element.clientWidth > 1) return true
      const scale = renderedScale(element)
      const padding =
        (Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight)) * scale
      const range = document.createRange()
      range.selectNodeContents(element)
      if (range.getBoundingClientRect().width > rect.width - padding + 0.25) return true
    }
    const clamp = style.getPropertyValue("-webkit-line-clamp")
    return clamp !== "" && clamp !== "none" && element.scrollHeight - element.clientHeight > 1
  }

  const bounds = { top: Number.NaN, right: Number.NaN, bottom: Number.NaN, left: Number.NaN }
  const samples: TextSample[] = []
  const truncated: string[] = []

  const candidates = Array.from(document.body.querySelectorAll("*")).filter(partOfScene)
  if (wrapper) candidates.push(wrapper)

  for (const element of candidates) {
    const rect = drawnRect(element, element.getBoundingClientRect())
    const style = getComputedStyle(element)
    if (!painted(element, rect, style)) continue
    if (!onCanvas(rect)) continue

    if (!coversCanvas(rect)) {
      bounds.top = Number.isNaN(bounds.top) ? rect.top : Math.min(bounds.top, rect.top)
      bounds.left = Number.isNaN(bounds.left) ? rect.left : Math.min(bounds.left, rect.left)
      bounds.right = Number.isNaN(bounds.right) ? rect.right : Math.max(bounds.right, rect.right)
      bounds.bottom = Number.isNaN(bounds.bottom)
        ? rect.bottom
        : Math.max(bounds.bottom, rect.bottom)
    }

    const text = ownText(element)
    if (text === "") continue
    samples.push({
      px: Math.round(Number.parseFloat(style.fontSize) * renderedScale(element) * 10) / 10,
      text: text.length > 32 ? `${text.slice(0, 32)}…` : text,
    })
    if (elided(element, element.getBoundingClientRect(), style)) truncated.push(text.length > 32 ? `${text.slice(0, 32)}…` : text)
  }

  const empty = Number.isNaN(bounds.top)
  const inset = {
    top: frame.top + margin,
    left: frame.left + margin,
    right: frame.right - margin,
    bottom: frame.bottom - margin,
  }

  const bySize = [...samples].sort((a, b) => a.px - b.px)
  const belowFloor: TextSample[] = []
  for (const sample of bySize) {
    if (sample.px >= floorPx) break
    if (!belowFloor.some((seen) => seen.px === sample.px)) belowFloor.push(sample)
  }

  return {
    overflow: {
      top: empty ? 0 : Math.max(0, Math.round(inset.top - bounds.top)),
      left: empty ? 0 : Math.max(0, Math.round(inset.left - bounds.left)),
      right: empty ? 0 : Math.max(0, Math.round(bounds.right - inset.right)),
      bottom: empty ? 0 : Math.max(0, Math.round(bounds.bottom - inset.bottom)),
    },
    size: {
      width: empty ? 0 : Math.round(bounds.right - bounds.left),
      height: empty ? 0 : Math.round(bounds.bottom - bounds.top),
    },
    smallest: bySize[0] ?? null,
    belowFloor: belowFloor.slice(0, 4),
    truncated: Array.from(new Set(truncated)).slice(0, 6),
    runs: samples.length,
  }
}

/**
 * The reasons this scene would not publish, in the order they matter. Empty
 * means it passes.
 */
export function auditFindings(slug: string, measurement: OgMeasurement): string[] {
  const findings: string[] = []
  const floor = FLOOR_EXCEPTIONS[slug]?.px ?? TEXT_FLOOR_PX
  const { overflow } = measurement
  const clipped = (["top", "right", "bottom", "left"] as const)
    .filter((edge) => overflow[edge] > 0)
    .map((edge) => `${edge} ${overflow[edge]}px`)
  if (clipped.length > 0) {
    const box = OFF_STAGE[slug] ? "canvas" : "stage"
    findings.push(`leaves the ${box} by ${clipped.join(", ")}`)
  }
  const tooSmall = measurement.belowFloor.filter((sample) => sample.px < floor)
  if (tooSmall.length > 0) {
    const shown = tooSmall.map((sample) => `${sample.px}px "${sample.text}"`).join(", ")
    findings.push(`text under ${floor}px: ${shown}`)
  }
  if (measurement.truncated.length > 0) {
    findings.push(`elided: ${measurement.truncated.map((t) => `"${t}"`).join(", ")}`)
  }
  return findings
}
