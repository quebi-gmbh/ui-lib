/**
 * The filter chip's × is a dismiss, not a second CTA (task #187).
 *
 * The button carried a `className` and no variants, so `buttonStyles`' defaults
 * applied: `intent="primary"` painted the mint fill and `size="md"` kept
 * `px-5 py-2.5`, which `size-4` could not merge away — padding is a different
 * group. A 16px border-box with 20px of padding a side leaves the content box
 * at zero width, and the × measured 0×12 inside a solid mint blob on every
 * `DataTable` and `ServerTable` that shows an active-filter strip.
 *
 * `button-variant-defaults.test.ts` keeps every call site in the repo from
 * doing this again; these assertions are about *this* chip resolving to the
 * shape it asks for, read off the rendered element after the merge.
 */
import { expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { TableFilterChips } from "../../src/components/table-controls"

function clearButtonClasses() {
  const { unmount } = render(
    <TableFilterChips
      filters={[{ column: "status", label: "Status", text: "live" }]}
      onClear={() => {}}
      onClearAll={() => {}}
    />,
  )
  const classes = screen.getByRole("button", { name: "Clear Status filter" }).className.split(/\s+/)
  unmount()
  return classes
}

test("the × keeps a content box: no size padding survives the merge", () => {
  const classes = clearButtonClasses()
  expect(classes).toContain("p-0")
  expect(classes.filter((c) => /^p[xytrbles]?-/.test(c))).toEqual(["p-0"])
  expect(classes).toContain("size-4")
})

test("the × is a ghost inside the pill, not a mint fill of its own", () => {
  const classes = clearButtonClasses()
  expect(classes).toContain("bg-transparent")
  expect(classes).not.toContain("bg-quebi-brand")
  expect(classes).not.toContain("text-quebi-on-brand")
  // The chip's own ink wins over ghost's muted default, and the pill shape
  // comes from the variant so it cannot lose to `rounded-quebi-sm` on sheet
  // order — the radius argument button.tsx makes.
  expect(classes).toContain("text-quebi-brand-text/80")
  expect(classes).toContain("rounded-full")
  expect(classes).not.toContain("rounded-quebi-sm")
})

test("the focus ring stays inside the 22px pill", () => {
  // `base` offsets the ring by 2px in the *page* colour, which around a 16px
  // button inside a tinted pill paints over the tint. Nothing else about the
  // ring changes.
  const classes = clearButtonClasses()
  expect(classes).toContain("focus-visible:ring-offset-0")
  expect(classes).toContain("focus-visible:ring-2")
  expect(classes).toContain("focus-visible:ring-quebi-brand-mark")
})
