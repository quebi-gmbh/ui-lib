"use client"

import {
  ColorArea as ColorAreaPrimitive,
  type ColorAreaProps,
  composeRenderProps,
} from "react-aria-components"
import { ColorThumb } from "@/components/color-thumb"
import { cn } from "@/lib/utils"

/**
 * ColorArea — quebi design system
 *
 * A two-dimensional gradient surface for picking two color channels at once
 * (e.g. saturation/brightness). Built on react-aria-components. The gradient is
 * the picked color (user data) and is left untouched; the chrome is a
 * control-radius field with a hairline edge. The draggable handle is the quebi ColorThumb, and
 * `children` replace it when you want to supply your own.
 *
 * The hairline is an *inset ring*, not a border, and that is the fix for a real
 * bug rather than a preference. react-aria writes the gradient onto the inline
 * `background` shorthand, which resets `background-clip` to `border-box` and
 * outranks any class — so a border is painted over the element's own gradient
 * instead of against the page, and at the corners — where the gradient reaches
 * pure black and pure white — the line disappeared. A ring is a `box-shadow`:
 * it paints above the background and steals no pixels from the gradient.
 *
 * Disabled keeps the gradient and mutes it with `opacity-50`: a color surface
 * with the color taken out is an empty box, not a state. react-aria puts the
 * gradient on `style` itself, so there is no `style` prop here to delete it.
 * That opacity covers the whole subtree, so a thumb you pass as `children`
 * wants `disabled:opacity-100` unless you mean it to dim twice.
 */
export function ColorArea({ className, children, ...props }: ColorAreaProps) {
  return (
    <ColorAreaPrimitive
      {...props}
      data-slot="color-area"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "size-56 shrink-0 rounded-(--q-radius-control) inset-ring-1 inset-ring-quebi-hairline",
          "disabled:opacity-50 disabled:forced-colors:bg-[GrayText]",
          resolved,
        ),
      )}
    >
      {/* `children` used to be accepted by the type, spread onto the primitive
          and then overwritten by this JSX child — dropped in silence (task
          #152). The default thumb is a fallback now, not a fixture.
          It carries `disabled:opacity-100` because the area's opacity already
          dims it; its own `disabled:opacity-50` would compound to a quarter. */}
      {children ?? <ColorThumb className="disabled:opacity-100" />}
    </ColorAreaPrimitive>
  )
}
