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
