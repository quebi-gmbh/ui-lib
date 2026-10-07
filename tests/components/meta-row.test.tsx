/** MetaRow: each value is a <dd> paired with its <dt>, so it is announced with its term. */
import { expect, test } from "bun:test"
import { render } from "@testing-library/react"
import { MetaRow } from "../../src/components/meta-row"

test("renders a dl of term/value pairs in order", () => {
  const { container } = render(
    <MetaRow
      items={[
        { term: "studio", value: "quebi GmbH" },
        { term: "people", value: "2" },
      ]}
    />,
  )
  const dl = container.querySelector("dl")
  expect(dl).not.toBeNull()
  const pairs = Array.from(dl?.children ?? []).map((group) => [
    group.querySelector("dt")?.textContent,
    group.querySelector("dd")?.textContent,
  ])
  expect(pairs).toEqual([
    ["studio", "quebi GmbH"],
    ["people", "2"],
  ])
})
