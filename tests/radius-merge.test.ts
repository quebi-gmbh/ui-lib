/**
 * The radius invariant.
 *
 * `<Button isCircle>` rendered a rounded square for as long as the library
 * shipped: `base` set `rounded-quebi-sm`, the variant set `rounded-full`, and
 * tailwind-merge kept both because `quebi-sm` is not a radius value it knows.
 * The sheet then decided the winner by emission order, and the base won. The
 * prop read as supported, nothing warned, and three call sites in a consuming
 * app worked around it with `rounded-full!` before anyone traced it.
 *
 * Two tests, because the bug had two halves and either one alone still bites:
 * `cn` must be able to see the quebi tokens, and a component must not split one
 * radius across `base` and a variant in the first place.
 */
import { describe, expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { cn } from "../src/lib/utils"

describe("cn merges the quebi token scales", () => {
  // Each pair is a token the theme adds under a name tailwind-merge has no
  // reason to recognise. The later class must win, as it would for a built-in.
  test.each([
    ["rounded-quebi-sm rounded-full", "rounded-full"],
    ["rounded-full rounded-quebi-md", "rounded-quebi-md"],
    ["rounded-t-quebi-md rounded-t-full", "rounded-t-full"],
    ["shadow-quebi-glow shadow-none", "shadow-none"],
    ["max-w-quebi-content max-w-4xl", "max-w-4xl"],
  ])("%s -> %s", (input, expected) => {
    expect(cn(input)).toBe(expected)
  })

  test("leaves classes that do not conflict alone", () => {
    expect(cn("rounded-quebi-sm px-4")).toBe("rounded-quebi-sm px-4")
  })
})

const COMPONENTS = join(import.meta.dir, "..", "src", "components")

/** Radius utilities with no variant prefix — `md:rounded-*` is its own group. */
const RADIUS = /(?:^|[\s"'`[])(rounded(?:-[a-z]+)*-[a-z0-9-]+|rounded)(?=["'`\s\],])/g

/** Every `tv({ ... })` call in a source file, brace-matched. */
function tvBlocks(source: string): string[] {
  const blocks: string[] = []
  for (let i = source.indexOf("tv({"); i !== -1; i = source.indexOf("tv({", i + 1)) {
    let depth = 0
    for (let j = i + 2; j < source.length; j++) {
      if ("{[(".includes(source[j])) depth++
      else if ("}])".includes(source[j]) && --depth === 0) {
        blocks.push(source.slice(i, j + 1))
        break
      }
    }
  }
  return blocks
}

/** The `base:` value of a tv block (or slot), minus anything nested under it. */
function baseSections(block: string): string[] {
  const sections: string[] = []
  for (let i = block.indexOf("base:"); i !== -1; i = block.indexOf("base:", i + 1)) {
    const rest = block.slice(i + 5)
    const end = rest[rest.search(/\S/)] === "[" ? rest.indexOf("]") : rest.indexOf("\n")
    sections.push(rest.slice(0, end === -1 ? rest.length : end))
  }
  return sections
}

function radii(text: string): string[] {
  return [...text.matchAll(RADIUS)].map((match) => match[1])
}

describe("no component splits a radius across base and a variant", () => {
  const files = readdirSync(COMPONENTS).filter((file) => file.endsWith(".tsx"))

  test.each(files)("%s", (file) => {
    for (const block of tvBlocks(readFileSync(join(COMPONENTS, file), "utf8"))) {
      const base = baseSections(block)
      const variants = block.slice(block.indexOf("variants:"))
      if (!base.some((section) => radii(section).length) ) continue
      // A radius in `base` and a radius in a variant of the same tv() cannot
      // both apply: one has to override the other, and tailwind-merge can only
      // do that for values it knows. Put the radius on the variant branches.
      expect({ file, base: base.flatMap(radii), variant: radii(variants) }).toMatchObject({
        variant: [],
      })
    }
  })
})
