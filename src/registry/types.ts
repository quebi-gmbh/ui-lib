import type { ReactNode } from "react"
import type { ComponentCategory } from "./categories"

/** Human-curated metadata for a component. Plain data — fully serializable. */
export interface ComponentMeta {
  /** kebab-case id, matches the source filename in src/components. */
  slug: string
  name: string
  description: string
  /** One of the canonical categories in ./categories.ts — not a free string. */
  category: ComponentCategory
  tags: string[]
  /**
   * Why this component has no OG scene — set only when it genuinely cannot have
   * one, and then the share image falls back to the frame's text card.
   *
   * The opt-out is a sentence rather than a boolean, and it lives here rather
   * than in a missing `<slug>.og.tsx`, because "nobody has written the scene
   * yet" and "there is nothing to photograph" are different states and only one
   * of them is finished work. `tests/og-scenes.test.ts` fails on a slug that is
   * in neither state.
   */
  noOgScene?: string
}

/** A single rendered example within a component's gallery entry. */
export interface ComponentExample {
  title: string
  description?: string
  render: () => ReactNode
}

/**
 * A still life of one component, composed for the 1200×630 share image.
 *
 * Not `examples[0]`: a gallery example is written to explain the whole of a prop
 * and is read at full size next to its own prose, while this is read as a
 * thumbnail in a Slack unfurl with no caption at all. One or two instances,
 * short labels, no long prose, nothing that scrolls or clips — and nothing that
 * animates, reads the clock or rolls a die, because the same commit has to
 * produce the same PNG twice. Scenes live in `src/registry/<slug>.og.tsx` and
 * are collected in `./og.ts`.
 */
export interface OgScene {
  /**
   * How much the frame magnifies the scene inside the stage. A Button is 36px
   * tall in a 1200×630 canvas that will be shown at a third of that width, so
   * the default is already a magnification; raise it for a scene built out of
   * small parts, lower it for one that fills the stage on its own.
   *
   * The stage is 1072×372 CSS pixels, so a scene at the default scale has about
   * 715×248 of natural room before it clips.
   */
  scale?: number
  /**
   * Where the scene sits in the stage. `center` unless the scene opens an
   * overlay: react-aria hangs a popover below its trigger, and a trigger in the
   * middle of the canvas puts the popover through the component's name. `top`
   * lifts the trigger so the overlay has the stage to fall into.
   */
  align?: "center" | "top"
  render: () => ReactNode
}

/** Metadata + live examples, combined for the gallery. */
export interface ComponentEntry extends ComponentMeta {
  examples: ComponentExample[]
}
