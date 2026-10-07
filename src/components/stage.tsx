import { useId } from "react"
import { cn, tv } from "@/lib/utils"

/**
 * Stage — quebi design system
 *
 * The opening frame of a page: a tall band with the headline set low in it,
 * like a film title, and the quebi mark behind it as a watermark.
 *
 * - `cinematic` (default) is lit: one soft directional light from the top
 *   right — white over cool grey in Daylight, graphite over ink in Cinematic.
 *   It is the only gradient in the system.
 * - `gallery` is plain paper with a bigger watermark in the bottom-right
 *   corner, for calm pages: team, about, contact.
 *
 * Children, in order: a plain nav bar, an `Eyebrow`, then a `LowTitle`.
 * Nothing else goes above the low title — the middle stays empty, and the
 * LowTitle's `mt-auto` is what pushes it to the floor of the frame. An eyebrow
 * that is a direct child is spaced down from the nav by the stage itself.
 *
 * The glyph is sized against the stage's own width (a container query), not
 * the window's, so a stage in a narrow column carries a mark that fits it.
 *
 * A stage is the website surface wherever it is mounted: it wears
 * `quebi-editorial`, which puts back the website's ink grounds, translucent
 * hairlines, ink action and focus, and square, underlined controls — the app
 * surface the rest of the library paints stops at its edge.
 */

export const stageStyles = tv({
  slots: {
    root: [
      "quebi-editorial @container relative isolate flex flex-col overflow-hidden text-quebi-fg",
      "min-h-115 px-5 py-6 sm:px-7 md:min-h-[min(88vh,760px)] md:px-quebi-9",
      "[&>.quebi-eyebrow]:mt-quebi-8",
    ],
    glyph: "pointer-events-none absolute -z-10 block select-none text-quebi-glyph",
  },
  variants: {
    variant: {
      cinematic: {
        root: "bg-quebi-stage",
        glyph:
          "top-6 right-5 size-50 @xl:right-7 @xl:size-75 @4xl:top-24 @4xl:right-quebi-9 @4xl:size-[min(460px,45cqw)]",
      },
      gallery: {
        root: "bg-quebi-bg",
        glyph: "right-5 bottom-6 size-50 @xl:right-7 @xl:size-105",
      },
    },
  },
  defaultVariants: { variant: "cinematic" },
})

export interface StageGlyphProps {
  className?: string
}

/**
 * The quebi mark — the round q — drawn in `currentColor`, decorative and
 * hidden from assistive tech. A ring and a tail are cut out of a disc, and the
 * horizontal bar is put back across the ring. The mask id comes from `useId`,
 * so two stages on one page never resolve each other's mask.
 */
export function StageGlyph({ className }: StageGlyphProps) {
  // React's ids contain characters (`:` or `«»`) that are not safe inside a
  // CSS `url(#…)` reference; keep only what is.
  const maskId = `quebi-mark-${useId().replace(/[^\w-]/g, "")}`
  return (
    <span data-slot="stage-glyph" aria-hidden="true" className={className}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="block size-full">
        <defs>
          <mask id={maskId} x="0" y="0" width="100" height="100" maskUnits="userSpaceOnUse">
            <path fill="#fff" d="M0 0H100V100H0z" />
            <g fill="none" stroke="#000" strokeLinecap="round" strokeWidth="9">
              <circle cx="50" cy="50" r="30" />
              <path d="M80 50 80 95" />
            </g>
            <path fill="#fff" d="M10 45.5H90V54.5H10z" />
          </mask>
        </defs>
        <circle cx="50" cy="50" r="50" fill="currentColor" mask={`url(#${maskId})`} />
      </svg>
    </span>
  )
}

export interface StageProps extends React.HTMLAttributes<HTMLElement> {
  /** `cinematic` (default) — the stage light; `gallery` — plain paper, larger watermark. */
  variant?: "cinematic" | "gallery"
  /** The quebi mark as a watermark. On by default; pass `false` to remove it. */
  glyph?: boolean
}

export function Stage({ variant = "cinematic", glyph = true, className, children, ...props }: StageProps) {
  const styles = stageStyles({ variant })
  return (
    <section data-slot="stage" data-variant={variant} className={cn(styles.root(), className)} {...props}>
      {glyph && <StageGlyph className={styles.glyph()} />}
      {children}
    </section>
  )
}
