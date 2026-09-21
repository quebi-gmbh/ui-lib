/**
 * The share images, checked without a browser.
 *
 * `scripts/screenshot-og.ts` photographs `/og/<slug>` for every component in
 * the deploy build. That step needs Chromium, so it does not run in CI — which
 * means everything about a scene that *can* be checked from the source has to
 * be, or the first sign of a broken one is a share image nobody looks at.
 *
 * Two kinds of check live here:
 *
 * - **Every slug is accounted for.** A component has a scene, or it has a
 *   written reason why it cannot. A slug in neither state is not a missing
 *   file, it is unfinished work, and this is where it fails.
 * - **A scene is the same picture twice.** The build's own promise is that two
 *   runs on one commit produce identical images, and the three ways to break
 *   that — the clock, the dice, and an animation — are all visible in the
 *   source. None of them would fail the build; they would just quietly publish
 *   a different file every deploy.
 * - **The measurement's exemptions are still about something.** Whether a scene
 *   fits the stage and how big its type came out needs the browser, and
 *   `scripts/og-audit.ts` measures both in the deploy. What can be checked
 *   here is the half of that check which is data: every scene it excuses still
 *   exists, still says why, and still holds to a number.
 */
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "bun:test"
import { FLOOR_EXCEPTIONS, OFF_STAGE, TEXT_FLOOR_PX } from "../scripts/og-audit"
import { metaRegistry } from "../src/registry/meta"
import { ogScenes } from "../src/registry/og"

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "registry")

const sceneFiles = readdirSync(REGISTRY_DIR).filter((file) => file.endsWith(".og.tsx"))
const sceneSlugs = sceneFiles.map((file) => file.slice(0, -".og.tsx".length))
const sourceOf = (slug: string) => readFileSync(join(REGISTRY_DIR, `${slug}.og.tsx`), "utf8")

describe("every component is accounted for", () => {
  test("has a scene or a written reason it has none", () => {
    const unaccounted = metaRegistry
      .filter((meta) => !ogScenes[meta.slug] && !meta.noOgScene)
      .map((meta) => meta.slug)
    expect(unaccounted).toEqual([])
  })

  test("never both — an opt-out beside a scene is one of them lying", () => {
    const both = metaRegistry.filter((meta) => ogScenes[meta.slug] && meta.noOgScene)
    expect(both.map((meta) => meta.slug)).toEqual([])
  })

  test("an opt-out gives a reason, not a shrug", () => {
    for (const meta of metaRegistry.filter((m) => m.noOgScene)) {
      expect(meta.noOgScene?.length).toBeGreaterThan(60)
    }
  })

  test("every scene file is wired into ogScenes, and every entry has a file", () => {
    expect(sceneSlugs.filter((slug) => !ogScenes[slug]).sort()).toEqual([])
    expect(Object.keys(ogScenes).filter((slug) => !sceneSlugs.includes(slug)).sort()).toEqual([])
  })

  test("every scene belongs to a component in the registry", () => {
    const slugs = new Set(metaRegistry.map((meta) => meta.slug))
    expect(sceneSlugs.filter((slug) => !slugs.has(slug))).toEqual([])
  })
})

describe("a scene is the same picture twice", () => {
  test("reads no clock", () => {
    // `new Date("2024-03-13")` is fine and `new Date()` is not; `today(zone)`
    // from @internationalized/date is the same bug wearing a calendar's name.
    const offenders = sceneSlugs.filter((slug) =>
      /\bnew Date\(\s*\)|\bDate\.now\(|\btoday\(/.test(sourceOf(slug)),
    )
    expect(offenders).toEqual([])
  })

  test("rolls no dice", () => {
    const offenders = sceneSlugs.filter((slug) => sourceOf(slug).includes("Math.random("))
    expect(offenders).toEqual([])
  })

  test("switches recharts' mount animation off", () => {
    // Recharts animates every series on mount, so the shutter opens somewhere
    // in the middle of it. Each chart component spreads the series element's
    // props *after* its own `isAnimationActive`, which is what makes the escape
    // hatch — `barProps={NO_ANIMATION}` and its siblings — work at all.
    // Treemap is the exception: it sets `isAnimationActive={false}` itself.
    const animated = sceneSlugs.filter((slug) => {
      const source = sourceOf(slug)
      // A chart scene is one that imports a chart — not one that happens to
      // name a lucide icon called BarChart3.
      const drawsAChart = /from "recharts"|from "@\/components\/([a-z-]*chart|treemap)"/.test(
        source,
      )
      if (!drawsAChart) return false
      // Treemap sets `isAnimationActive={false}` in the component, and the
      // sunburst has no mount animation to switch off.
      if (slug === "treemap" || slug === "sunburst-chart") return false
      return !source.includes("NO_ANIMATION") && !source.includes("isAnimationActive={false}")
    })
    expect(animated).toEqual([])
  })
})

describe("the audit's exemptions are about scenes that exist", () => {
  const exempted = [...Object.keys(OFF_STAGE), ...Object.keys(FLOOR_EXCEPTIONS)]

  test("every exempted slug is a scene", () => {
    // A renamed or deleted scene leaves its excuse behind, and an excuse with
    // nothing under it reads like a rule about a component that is still there.
    expect(exempted.filter((slug) => !ogScenes[slug]).sort()).toEqual([])
  })

  test("every exemption says why, in a sentence", () => {
    for (const [slug, reason] of Object.entries(OFF_STAGE)) {
      expect(`${slug}: ${reason}`.length).toBeGreaterThan(50)
    }
    for (const [slug, exception] of Object.entries(FLOOR_EXCEPTIONS)) {
      expect(`${slug}: ${exception.reason}`.length).toBeGreaterThan(50)
    }
  })

  test("a floor exception is still a floor", () => {
    for (const exception of Object.values(FLOOR_EXCEPTIONS)) {
      // Below the floor — an exception at or above it is not one, it is a line
      // that would never fire — and above the size at which type stops being
      // type, so the scene that was excused still fails if it shrinks further.
      expect(exception.px).toBeLessThan(TEXT_FLOOR_PX)
      expect(exception.px).toBeGreaterThanOrEqual(10)
    }
  })
})

describe("the frame keeps the hooks the measurement reaches for", () => {
  const route = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "src", "routes", "og.$slug.tsx"),
    "utf8",
  )

  test("the stage and the scene are named in the DOM", () => {
    // `scripts/og-audit.ts` measures the scene's rect against the stage's by
    // querying these. Renaming one throws in the deploy, a few minutes after
    // the build has already photographed 157 images; this says it in a second.
    expect(route).toContain("data-og-stage")
    expect(route).toContain("data-og-scene")
  })

  test("the overlays that are portalled out of the stage are magnified back", () => {
    // The stage magnifies with a transform, which reaches only its own subtree,
    // so every scene that opens an overlay depends on this call happening —
    // and the difference is invisible in the source of the scene itself.
    expect(route).toContain("magnifyOverlays(scale)")
  })
})
