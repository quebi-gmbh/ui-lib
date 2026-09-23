"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

/**
 * Holding a control's width open, so the thing you are about to press is still
 * where you left it.
 *
 * A control whose width is its content moves its neighbours every time the
 * content changes — and the content changes *on the press*. Step a calendar
 * from `Do, 24. September 2026` to `Fr, 2. Oktober 2026` and the heading loses
 * 40px, so `Today` and the forward chevron slide 40px left: the button the
 * pointer is resting on is somewhere else by the time the second press lands.
 * `Pagination` had the same defect and the same cure — hold the slots open
 * rather than drawing only what you have.
 *
 * There are two versions of the cure here, and which one applies depends on one
 * question: **do you know, at render, everything the control can say?**
 *
 * - **You do** — `Copy` / `Copied`, the four view names in a switcher. Then
 *   `SteadyWidth` reserves the widest of them statically, with no measurement
 *   and nothing to converge: every candidate is drawn into the same grid cell,
 *   the ones that are not current with `visibility: hidden`, and the cell is
 *   the width of the longest. It is right on the first frame, right in the
 *   prerendered HTML, and right in a locale nobody tested.
 * - **You do not** — a date the caller formatted, a filter summary, a name from
 *   a server. Then `useSteadyWidth` keeps a high-water mark: the element never
 *   gives back width it has already taken. That is weaker — the first label
 *   wider than everything before it still moves its neighbours once — but it
 *   converges within a month's worth of presses and never regresses, and it is
 *   the only thing available when the string is not the component's to predict.
 *
 * Both reserve width rather than *fixing* it, and deliberately: a fixed width
 * is a second thing to get wrong on a 390px phone, where this library's answer
 * is still to truncate (task #208). So the reservation is a `width` on a
 * shrinkable flex item, not a `min-width` — available space wins over it, which
 * is what keeps the calendar toolbar inside its card on a phone.
 */

// The measurement runs in a layout effect so React can re-render with the new
// reservation *before* the browser paints — a `useEffect` here would show one
// frame of the unreserved width. On the server there is no layout and no paint,
// and React warns about `useLayoutEffect` there, so the prerender takes the
// effect that does nothing instead of the warning. The first client render
// still matches the server's: the reservation starts unset.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/** The content's own width: `scrollWidth` with the reservation lifted for the read. */
function contentWidth(node: HTMLElement): number {
  const applied = node.style.width
  if (applied) node.style.width = ""
  const content = node.scrollWidth
  if (applied) node.style.width = applied
  return content
}

export interface SteadyWidthHandle<T extends HTMLElement> {
  ref: React.RefObject<T | null>
  style: React.CSSProperties | undefined
}

/**
 * Reserve the widest content the element has held, and never shrink back.
 *
 * Put the returned `ref` and `style` on the element that holds the changing
 * text, and give it `truncate` (or any `overflow` that is not `visible`): the
 * reservation is a `width`, so the element shrinks under pressure like any
 * other flex item, and the measurement is taken with that width lifted, so it
 * is the content's own width rather than the last number this hook wrote.
 *
 * `shape` is what the reservation is *for* — the format of the string rather
 * than the string. Pass the things that change how wide the content can ever
 * be (a granularity, a locale, the view being labelled) and the high-water mark
 * resets when one of them moves; a toolbar that switches from `Donnerstag, 24.
 * September 2026` to `2026` must not keep 260px reserved for a year.
 */
export function useSteadyWidth<T extends HTMLElement>(shape: string): SteadyWidthHandle<T> {
  const ref = useRef<T>(null)
  const [reserved, setReserved] = useState(0)

  // Derived state, the same shape `PaginationJump` uses for a page that moved
  // under it: dropping the reservation during the render that changed the shape
  // means the layout effect below measures the *new* content, not the old
  // content inside the old box. An effect that reset it would measure through a
  // reservation that no longer applies and keep it forever.
  const [shownShape, setShownShape] = useState(shape)
  if (shape !== shownShape) {
    setShownShape(shape)
    setReserved(0)
  }

  // No dependency array on purpose: the content can change without any input to
  // this hook changing, because the content is `children`. Re-measuring after
  // every render is cheap — one `scrollWidth` read — and settles immediately,
  // since `Math.max` returns the same number once the widest label has been
  // seen and React skips a re-render for an unchanged state value.
  useIsomorphicLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    // `scrollWidth` is an integer and the text under it is not: it is the real
    // width *rounded*, so for half the strings in a font it rounds down, and a
    // box reserved at its own content minus a fraction of a pixel is an
    // ellipsis on a box with nothing wrong with it. That is what the calendar
    // toolbar's heading was doing at any viewport width — `September 2026` is
    // 115-and-a-bit pixels of Outfit, it reserved 115, and it stayed truncated
    // for as long as the label said September.
    //
    // So the reading is rounded *up*, by taking the integer and adding one, and
    // it is taken with the reservation lifted. Lifting it is what keeps the
    // slack from ratcheting: read through a reservation the content already
    // fits inside and `scrollWidth` reports the reservation, so every pass
    // would reserve a pixel more than the last. Lifted, every pass measures the
    // same content and `Math.max` returns the number it already had. Both the
    // lift and the restore happen inside the layout effect, so the browser
    // never paints the element at its unreserved width.
    const content = contentWidth(node)
    if (content > 0) setReserved((previous) => Math.max(previous, content + 1))
  })

  // A font swap changes every width measured before it without rendering
  // anything, so the effect above never hears about it. With `font-display:
  // swap` the first measurement on a cold load is usually taken in the fallback
  // face: where that is wider than Outfit the heading keeps a gap it does not
  // need (the toolbar's share image held 90px open for 75px of text), and where
  // it is narrower the reservation is short and the heading is elided until the
  // next press. So a finished font load *replaces* the reservation rather than
  // raising it — everything measured before it was measured in the wrong face.
  // It happens once, on load, before anyone has pressed anything.
  useEffect(() => {
    const fonts = typeof document === "undefined" ? undefined : document.fonts
    if (!fonts) return
    let live = true
    const remeasure = () => {
      const node = ref.current
      if (!live || !node) return
      const content = contentWidth(node)
      if (content > 0) setReserved(content + 1)
    }
    // `ready` as well as the event: a load that finished between the layout
    // effect's measurement and this subscription fires no event to hear.
    void fonts.ready.then(remeasure)
    fonts.addEventListener("loadingdone", remeasure)
    return () => {
      live = false
      fonts.removeEventListener("loadingdone", remeasure)
    }
  }, [])

  return { ref, style: reserved > 0 ? { width: reserved } : undefined }
}

export interface SteadyWidthProps {
  /**
   * Every string the slot can hold, this one included. The box is the width of
   * the longest; the others are drawn into the same grid cell and hidden.
   */
  candidates: readonly string[]
  children: React.ReactNode
}

/**
 * A slot as wide as the longest thing it can ever say.
 *
 * The candidates are stacked in one grid cell rather than measured, so the
 * width is correct in the prerendered HTML — no effect, no first-frame jump,
 * and no assumption about how wide a word is in a language nobody tested.
 * `visibility: hidden` keeps them out of the picture, out of the selection and
 * out of the accessibility tree; `aria-hidden` says so for the one reader that
 * would otherwise find the text and read the label twice.
 */
export function SteadyWidth({ candidates, children }: SteadyWidthProps) {
  return (
    <span data-slot="steady-width" className="grid grid-cols-1 grid-rows-1 justify-items-center">
      {/* Deduplicated because the candidates are usually a list the caller
          built — two views that happen to share a label would otherwise be two
          React children under one key, and a second copy of a string is no
          wider than the first. */}
      {[...new Set(candidates)].map((candidate) => (
        <span
          key={candidate}
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 whitespace-nowrap"
        >
          {candidate}
        </span>
      ))}
      <span className="col-start-1 row-start-1 whitespace-nowrap">{children}</span>
    </span>
  )
}
