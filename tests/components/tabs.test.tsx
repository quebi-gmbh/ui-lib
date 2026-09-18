/**
 * Which way a tab strip points, and what that changes.
 *
 * `Tab` had no orientation branch: one class list served both strips, so a
 * vertical tab got block padding only and its label sat flush against the
 * list's rail, with the selection indicator still drawn as an underline
 * beneath the text rather than a bar on the rail it is meant to overlap.
 * react-aria hands orientation to `TabList` through render props but not to
 * `Tab`, so the branch rides on a context the root provides — which is the
 * thing worth pinning: the classes are the symptom, the missing hand-off was
 * the bug, and a horizontal strip must come through it unchanged.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "../../src/components/tabs"

const Strip = ({ orientation }: { orientation?: "horizontal" | "vertical" }) => (
  <Tabs orientation={orientation} defaultSelectedKey="account">
    <TabList aria-label="Settings sections">
      <Tab id="account">Account</Tab>
      <Tab id="billing">Billing</Tab>
    </TabList>
    <TabPanels>
      <TabPanel id="account">Account panel.</TabPanel>
      <TabPanel id="billing">Billing panel.</TabPanel>
    </TabPanels>
  </Tabs>
)

const tab = (name: string) => screen.getByRole("tab", { name })

describe("Tab, vertically", () => {
  test("clears the list's rail with inline padding", () => {
    render(<Strip orientation="vertical" />)

    expect(tab("Account")).toHaveClass("ps-4")
  })

  test("draws the indicator as a bar on the rail, not as an underline", () => {
    render(<Strip orientation="vertical" />)

    const selected = tab("Account")
    expect(selected).toHaveClass("after:inset-y-0", "after:-start-px", "after:w-[2px]")
    expect(selected.className).not.toContain("after:-bottom-px")
  })

  test("hangs its rail off the inline-start edge, so RTL keeps it beside the panels", () => {
    render(<Strip orientation="vertical" />)

    expect(screen.getByRole("tablist")).toHaveClass("border-s")
  })
})

describe("Tab, horizontally", () => {
  test("is unchanged: no inline padding, indicator on the bottom border", () => {
    render(<Strip />)

    const selected = tab("Account")
    expect(selected).toHaveClass("after:inset-x-0", "after:-bottom-px", "after:h-[2px]")
    expect(selected.className).not.toContain("ps-4")
    expect(selected.className).not.toContain("after:-start-px")
  })

  test("is the default, so a strip with no orientation prop gets the underline", () => {
    render(<Strip />)

    expect(screen.getByRole("tablist")).toHaveClass("border-b")
  })
})
