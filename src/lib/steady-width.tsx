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
 * other flex item, and the measurement reads `scrollWidth`, which is the
 * content's width whether or not the box is currently cut short.
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
    // `scrollWidth` is an integer and the text it measures is not, so a
    // reservation taken straight from it can land half a pixel short of the
    // content it was taken for — and half a pixel short of a `truncate` is an
    // ellipsis on a box with nothing wrong with it. The pixel of slack is added
    // only while the content is actually overflowing its box, which is what
    // keeps this from ratcheting: once the box fits, `scrollWidth` reports the
    // box, and `Math.max` returns the number it already had.
    const natural = node.scrollWidth + (node.scrollWidth > node.clientWidth ? 1 : 0)
    if (natural > 0) setReserved((previous) => Math.max(previous, natural))
  })

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
