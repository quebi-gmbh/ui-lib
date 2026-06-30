/**
 * Generates Open Graph share images (1200×630 PNG) into public/og/:
 *   - default.png            site-wide fallback
 *   - <slug>.png             one per component (name + category)
 *
 * Build-time only, via satori (JSX → SVG) + resvg (SVG → PNG). No browser.
 * Run as part of `bun run generate:api` (which the build invokes first).
 */
import { mkdir, readFile, writeFile, rm } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"
import { metaRegistry } from "../src/registry/meta"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OG_OUT = join(ROOT, "public/og")

const BG = "#030712"
const BRAND = "#2dd4a8"
const FG = "#ffffff"
const MUTED = "#9ca3af"

// satori takes a React-element-shaped object literal (no JSX needed here).
function el(type: string, props: Record<string, unknown>, children?: unknown) {
  return { type, props: { ...props, children } }
}

function card(eyebrow: string, title: string, subtitle: string) {
  return el(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: BG,
        padding: "72px",
        fontFamily: "Outfit",
      },
    },
    [
      // top: brand wordmark
      el("div", { style: { display: "flex", alignItems: "center", gap: "16px" } }, [
        el("div", {
          style: { width: "28px", height: "28px", borderRadius: "9999px", backgroundColor: BRAND },
        }),
        el("div", { style: { fontSize: "30px", fontWeight: 700, color: FG } }, "quebi ui-lib"),
      ]),
      // middle: eyebrow + title
      el("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, [
        el(
          "div",
          {
            style: {
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: BRAND,
            },
          },
          eyebrow,
        ),
        el(
          "div",
          { style: { fontSize: "84px", fontWeight: 700, color: FG, lineHeight: 1.05 } },
          title,
        ),
      ]),
      // bottom: subtitle
      el("div", { style: { fontSize: "30px", color: MUTED } }, subtitle),
    ],
  )
}

type Fonts = Parameters<typeof satori>[1]["fonts"]

async function render(node: unknown, fonts: Fonts): Promise<Buffer> {
  const svg = await satori(node as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts })
  return new Resvg(svg).render().asPng()
}

async function loadFont(file: string): Promise<ArrayBuffer> {
  const buf = await readFile(join(ROOT, "scripts/assets", file))
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

async function main() {
  const fonts: Fonts = [
    { name: "Outfit", data: await loadFont("Outfit-400.ttf"), weight: 400, style: "normal" },
    { name: "Outfit", data: await loadFont("Outfit-700.ttf"), weight: 700, style: "normal" },
  ]

  await rm(OG_OUT, { recursive: true, force: true })
  await mkdir(OG_OUT, { recursive: true })

  // Site default.
  await writeFile(
    join(OG_OUT, "default.png"),
    await render(
      card("React component library", "ui-lib", "Copy-paste source, no install required."),
      fonts,
    ),
  )

  // Per-component.
  for (const m of metaRegistry) {
    await writeFile(
      join(OG_OUT, `${m.slug}.png`),
      await render(card(m.category, m.name, m.description.slice(0, 90)), fonts),
    )
  }

  console.log(`Generated ${metaRegistry.length + 1} OG images into public/og/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
