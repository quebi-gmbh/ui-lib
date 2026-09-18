/**
 * CommitGraph's rendered half: the parts a layout test cannot see.
 *
 * Three guarantees, each of which the markup could quietly drop. The graph is
 * decoration — the row's text carries every fact it draws — so it must be
 * `aria-hidden` or a screen reader reads a stray graphic per commit. Selection
 * hands back the *full* sha, not the short one the row displays, because that is
 * what the caller will look a commit up by. And the load-more affordance exists
 * only when `onLoadMore` does: a control that reports nowhere is worse than no
 * control, and its absence is how a caller says "pagination is mine".
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { CommitGraph, type CommitGraphCommit } from "../../src/components/commit-graph"

const commits: CommitGraphCommit[] = [
  {
    sha: "9f1c0a4e7b2d8c3f5a6104e7b2d8c3f5a6104e7b",
    parents: ["7c4e2b9d1a6f8e0c3b5704e7b2d8c3f5a6104e7b"],
    message: "Cache the parsed locale between renders",
    author: { name: "Ada Lovelace" },
    date: "2026-03-18T09:24:00Z",
    refs: [{ name: "main", kind: "branch" }],
  },
  {
    sha: "7c4e2b9d1a6f8e0c3b5704e7b2d8c3f5a6104e7b",
    parents: [],
    message: "Initial commit",
    author: { name: "Grace Hopper" },
    date: "2026-03-16T08:00:00Z",
  },
]

describe("CommitGraph", () => {
  test("renders one row per commit, with its subject and short sha", () => {
    render(<CommitGraph commits={commits} />)

    expect(screen.getAllByRole("row")).toHaveLength(2)
    expect(screen.getByText("Cache the parsed locale between renders")).toBeInTheDocument()
    expect(screen.getByText("9f1c0a4")).toBeInTheDocument()
    expect(screen.getByText("main")).toBeInTheDocument()
  })

  test("the lane graph is decoration, and is hidden from assistive technology", () => {
    const { container } = render(<CommitGraph commits={commits} />)

    const graphs = container.querySelectorAll("svg[aria-hidden='true']")
    expect(graphs.length).toBeGreaterThanOrEqual(commits.length)
  })

  test("the date is rendered as a machine-readable <time>, never a bare string", () => {
    const { container } = render(<CommitGraph commits={commits} />)

    const times = container.querySelectorAll("time")
    expect(times).toHaveLength(2)
    expect(times[0]).toHaveAttribute("dateTime", new Date(commits[0].date).toISOString())
  })

  test("selecting a row reports the full sha, not the short one it displays", async () => {
    const user = userEvent.setup()
    const selected: string[] = []
    render(<CommitGraph commits={commits} onSelectCommit={(sha) => selected.push(sha)} />)

    await user.click(screen.getByText("Initial commit"))

    expect(selected).toEqual([commits[1].sha])
  })

  test("a controlled selectedSha marks that row selected", () => {
    render(<CommitGraph commits={commits} selectedSha={commits[0].sha} onSelectCommit={() => {}} />)

    const rows = screen.getAllByRole("row")
    expect(rows[0]).toHaveAttribute("aria-selected", "true")
    expect(rows[1]).toHaveAttribute("aria-selected", "false")
  })

  test("without onLoadMore there is no pagination affordance", () => {
    render(<CommitGraph commits={commits} />)

    expect(screen.queryByRole("button", { name: /load older commits/i })).toBeNull()
  })

  test("with onLoadMore the control reports the request out", async () => {
    const user = userEvent.setup()
    let asked = 0
    render(
      <CommitGraph
        commits={commits}
        onLoadMore={() => {
          asked += 1
        }}
      />,
    )

    await user.click(screen.getByRole("button", { name: /load older commits/i }))

    expect(asked).toBe(1)
  })

  test("an empty window renders the empty state instead of rows", () => {
    render(<CommitGraph commits={[]} emptyState="No commits match this filter." />)

    expect(screen.getByText("No commits match this filter.")).toBeInTheDocument()
  })
})

describe("the graph's appearance options", () => {
  // The row also holds a Copy button whose icon is an <svg> full of <path>s, so
  // every query here is scoped to the band rather than to "an svg".
  const BAND = '[data-slot="commit-graph-lanes"]'

  const branched: CommitGraphCommit[] = [
    { ...commits[0], parents: [commits[1].sha, "beef".repeat(10)] },
    commits[1],
  ]

  test.each([
    ["dot", "circle"],
    ["ring", "circle"],
    ["square", "rect"],
    ["diamond", "path"],
  ] as const)("nodeShape=%s draws a %s", (nodeShape, tag) => {
    const { container } = render(<CommitGraph commits={commits} nodeShape={nodeShape} />)

    // The marker is the last element of each row's band, after the lines.
    const markers = Array.from(container.querySelectorAll(`${BAND} > ${tag}:last-child`))
    expect(markers).toHaveLength(commits.length)
  })

  test.each(["dot", "ring", "square", "diamond"] as const)(
    "a merge stays distinguishable with nodeShape=%s, without relying on colour",
    (nodeShape) => {
      const { container } = render(<CommitGraph commits={branched} nodeShape={nodeShape} />)

      const markers = Array.from(container.querySelectorAll(`${BAND} > :last-child`))
      const [merge, ordinary] = markers
      // Whatever the shape, the merge is the inverse of the ordinary commit —
      // one is painted with the lane colour and the other with the page — and a
      // touch larger. Neither signal is a hue.
      expect(merge.getAttribute("fill")).not.toBe(ordinary.getAttribute("fill"))
      expect([merge.getAttribute("fill"), ordinary.getAttribute("fill")]).toContain("var(--q-bg)")
      expect(merge.getAttribute("stroke")).toBe(ordinary.getAttribute("stroke"))
    },
  )

  test.each([
    ["hairline", "1"],
    ["regular", "1.5"],
    ["bold", "2.5"],
  ] as const)("lineWeight=%s strokes the lanes at %s", (lineWeight, width) => {
    const { container } = render(<CommitGraph commits={commits} lineWeight={lineWeight} />)

    const line = container.querySelector(`${BAND} path`)
    expect(line).toHaveAttribute("stroke-width", width)
  })

  test("the marker's outline tracks the line weight rather than fighting it", () => {
    const { container } = render(<CommitGraph commits={commits} lineWeight="hairline" />)

    const marker = container.querySelector(`${BAND} circle`)
    expect(marker).toHaveAttribute("stroke-width", "1.5")
  })

  test.each([
    ["tight", "12"],
    ["regular", "16"],
    ["wide", "22"],
  ] as const)("laneWidth=%s gives a one-lane graph a %spx column", (laneWidth, width) => {
    const { container } = render(<CommitGraph commits={commits} laneWidth={laneWidth} />)

    expect(container.querySelector(BAND)).toHaveAttribute("width", width)
  })

  test("a wider lane moves the geometry with it, not just the box", () => {
    const { container } = render(<CommitGraph commits={commits} laneWidth="wide" />)

    // Lane 0's centre is half a lane in, so the line is drawn at x=11, not x=8.
    expect(container.querySelector(`${BAND} path`)).toHaveAttribute(
      "d",
      expect.stringContaining("11"),
    )
  })
})
