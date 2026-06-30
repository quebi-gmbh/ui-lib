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

function card(eyebrow: string, title: string, subtitle: string, logoSrc: string) {
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
      // top: the real quebi logo (viewBox 346×100 → keep aspect ratio)
      el("img", { src: logoSrc, width: 173, height: 50 }),
      // middle: eyebrow + title
      el("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } }, [
        el(
          "div",
          {
            style: {
              fontSize: "34px",
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
      el("div", { style: { fontSize: "38px", color: MUTED } }, subtitle),
    ],
  )
}

type Fonts = Parameters<typeof satori>[1]["fonts"]

async function render(node: unknown, fonts: Fonts): Promise<Buffer> {
  const svg = await satori(node as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts })
  return new Resvg(svg).render().asPng()
}

/** Trim to a word boundary near maxLen, adding an ellipsis if cut. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const cut = text.slice(0, maxLen)
  const lastSpace = cut.lastIndexOf(" ")
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLen).trimEnd()}…`
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

  // The real quebi logo as a data-URI so satori renders it via resvg (handles
  // the SVG mask the logo uses).
  const logoSvg = await readFile(join(ROOT, "public/quebi-logo.svg"), "utf8")
  const logo = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`

  await rm(OG_OUT, { recursive: true, force: true })
  await mkdir(OG_OUT, { recursive: true })

  // Site default.
  await writeFile(
    join(OG_OUT, "default.png"),
    await render(
      card("React component library", "ui-lib", "Copy-paste source, no install required.", logo),
      fonts,
    ),
  )

  // Per-component.
  for (const m of metaRegistry) {
    await writeFile(
      join(OG_OUT, `${m.slug}.png`),
      await render(card(m.category, m.name, truncate(m.description, 80), logo), fonts),
    )
  }

  console.log(`Generated ${metaRegistry.length + 1} OG images into public/og/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
