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
  /**
   * When to reach for this component, when not to, and what to use instead.
   *
   * Set on the components agents over-use rather than on every one: a Card is
   * the easiest surface in the library to reach for, and the gallery only ever
   * showed how to use one. This is plain data rather than prose in an example
   * because the examples never leave the site, while this field is spread into
   * `/api/components/<slug>.json`, the catalog in `/api/index.json`, and the
   * usage section of llms.txt, which is where an agent actually reads it.
   */
  usage?: ComponentUsage
}

/** See {@link ComponentMeta.usage}. */
export interface ComponentUsage {
  /** Situations this component is the right answer for. Short, one per line. */
  when: string[]
  /** Situations it is the wrong answer for. Each one names what to use instead. */
  whenNot: string[]
  /**
   * The alternatives, grouped by the job the component was being asked to do —
   * which is the question that picks between them.
   */
  instead: UsageAlternativeGroup[]
}

/** One row of {@link ComponentUsage.instead}: "the card was doing X — use one of these". */
export interface UsageAlternativeGroup {
  /** What the component was being used for, e.g. "A list item". */
  job: string
  use: UsageAlternative[]
}

/** Something to use instead. */
export interface UsageAlternative {
  /** What to write, e.g. "GridList" or "Whitespace + Heading". */
  name: string
  /**
   * Registry slug when the alternative is a ui-lib component. Checked against
   * the registry by `tests/registry-usage.test.ts`, so a renamed component
   * fails the suite instead of leaving guidance that points nowhere.
   */
  slug?: string
  /** Which of several alternatives this one is for. */
  when?: string
}

/** A single rendered example within a component's gallery entry. */
export interface ComponentExample {
  title: string
  description?: string
  render: () => ReactNode
  /**
   * Set on an example that shows what to use *instead of* this component:
   * `render` draws the alternative, and this draws the version it replaces, so
   * the page can put them side by side. Such examples leave the gallery for
   * the page's "What to use instead" section, beside `ComponentMeta.usage`.
   */
  insteadOf?: () => ReactNode
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
