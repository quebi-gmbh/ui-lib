/**
 * The lane layout, which is the whole difficulty of CommitGraph.
 *
 * `layoutCommitGraph` is pure and exported for exactly this reason: every case
 * that makes a git graph hard — a merge, a branch point, a lane freed and reused
 * by an unrelated branch, an octopus merge, a root commit, and a parent that is
 * not in the window — is decidable from the returned rows without rendering an
 * SVG and measuring pixels.
 *
 * The model under test: a row's band runs top → bottom with the commit's dot in
 * the middle, and every line in it is an edge between two endpoints, each either
 * a lane on a boundary or the dot. So `top → bottom` is a lane passing through,
 * `top → node` is a child's line arriving, and `node → bottom` is a line leaving
 * for a parent. A parent outside the window is then not a special case at all:
 * its edge simply never meets a `top → node` and runs off the bottom.
 */
import { describe, expect, test } from "bun:test"
import {
  type CommitGraphCommit,
  type CommitGraphEdge,
  type CommitGraphRow,
  LANE_COLORS,
  edgePath,
  laneColor,
  layoutCommitGraph,
} from "../src/components/commit-graph"

/** A commit with only the fields the layout reads. */
const commit = (sha: string, ...parents: string[]): CommitGraphCommit => ({
  sha,
  parents,
  message: sha,
  author: { name: "Ada Lovelace" },
  date: "2026-03-18T09:00:00Z",
})

const incoming = (row: CommitGraphRow) => row.edges.filter((e) => e.to === "node")
const outgoing = (row: CommitGraphRow) => row.edges.filter((e) => e.from === "node")
const throughLanes = (row: CommitGraphRow) =>
  row.edges.filter((e) => e.from === "top" && e.to === "bottom").map((e) => e.fromLane)
const at = (rows: CommitGraphRow[], sha: string) =>
  rows.find((row) => row.commit.sha === sha) as CommitGraphRow

describe("a linear history", () => {
  const { rows, lanes } = layoutCommitGraph([commit("c", "b"), commit("b", "a"), commit("a")])

  test("uses a single lane", () => {
    expect(lanes).toBe(1)
    expect(rows.map((row) => row.lane)).toEqual([0, 0, 0])
  })

  test("the newest commit has no incoming edge and one leaving for its parent", () => {
    expect(incoming(rows[0])).toEqual([])
    expect(outgoing(rows[0])).toEqual([
      { fromLane: 0, toLane: 0, from: "node", to: "bottom", bend: "none" },
    ])
  })

  test("a middle commit joins the line above to the line below", () => {
    expect(incoming(rows[1])).toEqual([
      { fromLane: 0, toLane: 0, from: "top", to: "node", bend: "none" },
    ])
    expect(outgoing(rows[1])).toHaveLength(1)
  })
})

describe("a root commit", () => {
  const { rows } = layoutCommitGraph([commit("b", "a"), commit("a")])

  test("is flagged, and its line stops at the dot", () => {
    expect(at(rows, "a").isRoot).toBe(true)
    expect(at(rows, "a").isMerge).toBe(false)
    expect(outgoing(at(rows, "a"))).toEqual([])
  })

  test("frees its lane, so a later unrelated head reuses it", () => {
    const reused = layoutCommitGraph([commit("b", "a"), commit("a"), commit("x", "w")])
    expect(at(reused.rows, "x").lane).toBe(0)
    expect(reused.lanes).toBe(1)
  })
})

describe("a merge", () => {
  // m9 merges the two-commit branch f6..f7, which forked off the trunk at m8.
  const { rows, lanes } = layoutCommitGraph([
    commit("m9", "m8", "f7"),
    commit("f7", "f6"),
    commit("f6", "m8"),
    commit("m8", "m5"),
    commit("m5"),
  ])

  test("draws one edge leaving for each parent", () => {
    expect(at(rows, "m9").isMerge).toBe(true)
    expect(outgoing(at(rows, "m9"))).toEqual([
      { fromLane: 0, toLane: 0, from: "node", to: "bottom", bend: "none" },
      { fromLane: 0, toLane: 1, from: "node", to: "bottom", bend: "bottom" },
    ])
  })

  test("the second parent opens a second lane", () => {
    expect(lanes).toBe(2)
    expect(at(rows, "f7").lane).toBe(1)
    expect(at(rows, "f6").lane).toBe(1)
  })

  test("the trunk passes through the rows the branch occupies", () => {
    expect(throughLanes(at(rows, "f7"))).toEqual([0])
    expect(throughLanes(at(rows, "f6"))).toEqual([0])
  })

  test("a commit with one parent is not a merge", () => {
    expect(at(rows, "f7").isMerge).toBe(false)
  })
})

describe("a branch point", () => {
  // Two commits, on different branches, sharing one parent.
  const { rows, lanes } = layoutCommitGraph([
    commit("main1", "base"),
    commit("topic1", "base"),
    commit("base"),
  ])

  test("the second child curves back into the lane that already leads to the parent", () => {
    expect(at(rows, "topic1").lane).toBe(1)
    expect(outgoing(at(rows, "topic1"))).toEqual([
      { fromLane: 1, toLane: 0, from: "node", to: "bottom", bend: "bottom" },
    ])
    expect(lanes).toBe(2)
  })

  test("the joining branch reaches the parent's dot, not just its lane", () => {
    // The bend is split across the rule, so the half that lands is a real edge
    // in the parent's own row: the trunk arrives straight, and topic1's line
    // arrives beside it as the second half of the same S.
    expect(incoming(at(rows, "base"))).toEqual([
      { fromLane: 0, toLane: 0, from: "top", to: "node", bend: "none" },
      { fromLane: 1, toLane: 0, from: "top", to: "node", bend: "top" },
    ])
    expect(throughLanes(at(rows, "base"))).toEqual([])
  })
})

describe("a lane freed and reused", () => {
  // topic1 rejoins the trunk immediately, giving lane 1 back; the unrelated
  // head `other1` then picks that index up rather than opening a third lane.
  const { rows, lanes } = layoutCommitGraph([
    commit("main1", "base"),
    commit("topic1", "base"),
    commit("other1", "other0"),
    commit("base"),
    commit("other0"),
  ])

  test("the next unrelated branch takes the freed index", () => {
    expect(at(rows, "other1").lane).toBe(1)
    expect(lanes).toBe(2)
  })

  test("the reused lane is drawn in the colour of its index, not of its history", () => {
    expect(laneColor(at(rows, "topic1").lane)).toBe(laneColor(at(rows, "other1").lane))
  })

  test("the two histories never share a row's line", () => {
    // `base` is on lane 0 and `other0` is passing through on lane 1.
    expect(throughLanes(at(rows, "base"))).toEqual([1])
  })
})

describe("an octopus merge", () => {
  const { rows, lanes } = layoutCommitGraph([
    commit("octo", "p1", "p2", "p3"),
    commit("p2", "p1"),
    commit("p3", "p1"),
    commit("p1"),
  ])

  test("opens one lane per parent", () => {
    expect(lanes).toBe(3)
    expect(outgoing(at(rows, "octo")).map((e: CommitGraphEdge) => e.toLane)).toEqual([0, 1, 2])
  })

  test("every parent is reached by the lane the merge sent it to", () => {
    expect(at(rows, "p2").lane).toBe(1)
    expect(at(rows, "p3").lane).toBe(2)
    // The spawn's second half lands on p2's own dot, so the line the merge sent
    // to lane 1 is the same line that arrives here — one S, two rows.
    expect(incoming(at(rows, "p2"))).toEqual([
      { fromLane: 0, toLane: 1, from: "top", to: "node", bend: "top" },
    ])
  })

  test("the three branches converge on the shared parent", () => {
    // p2 and p3 both fold back into lane 0, which is where p1 is waiting.
    expect(outgoing(at(rows, "p2"))).toEqual([
      { fromLane: 1, toLane: 0, from: "node", to: "bottom", bend: "bottom" },
    ])
    expect(outgoing(at(rows, "p3"))).toEqual([
      { fromLane: 2, toLane: 0, from: "node", to: "bottom", bend: "bottom" },
    ])
    // Each join lands in the row *below* the one that left, wherever that is:
    // p2 joins at the p2/p3 rule, so its landing half is drawn in p3's band and
    // meets the trunk there; p3's lands on p1's dot.
    expect(incoming(at(rows, "p3"))).toContainEqual({
      fromLane: 1,
      toLane: 0,
      from: "top",
      to: "node",
      bend: "top",
    })
    expect(incoming(at(rows, "p1"))).toEqual([
      { fromLane: 0, toLane: 0, from: "top", to: "node", bend: "none" },
      { fromLane: 2, toLane: 0, from: "top", to: "node", bend: "top" },
    ])
  })

  test("a duplicated parent is drawn once", () => {
    const { rows: dup } = layoutCommitGraph([commit("m", "a", "a"), commit("a")])
    expect(outgoing(dup[0])).toHaveLength(1)
  })
})

describe("a parent outside the window", () => {
  test("the edge runs off the bottom rather than terminating", () => {
    const { rows } = layoutCommitGraph([commit("only", "notInWindow")])
    expect(rows[0].isRoot).toBe(false)
    expect(outgoing(rows[0])).toEqual([
      { fromLane: 0, toLane: 0, from: "node", to: "bottom", bend: "none" },
    ])
  })

  test("its lane keeps passing through every later row", () => {
    const { rows, lanes } = layoutCommitGraph([
      commit("a", "offPage"),
      commit("b", "c"),
      commit("c"),
    ])
    expect(lanes).toBe(2)
    // `offPage` is never reached, so lane 0 is still occupied two rows later and
    // leaves the last row at the bottom.
    expect(throughLanes(at(rows, "b"))).toEqual([0])
    expect(throughLanes(at(rows, "c"))).toEqual([0])
  })
})

describe("the lane palette", () => {
  test("is a total function of the lane index, and cycles", () => {
    expect(laneColor(0)).not.toBe(laneColor(1))
    expect(laneColor(0)).toBe(laneColor(LANE_COLORS.length))
    expect(laneColor(-1)).toBe(laneColor(LANE_COLORS.length - 1))
  })

  test("resolves to quebi theme variables, so the graph re-themes with everything else", () => {
    for (let lane = 0; lane < 12; lane++) {
      expect(laneColor(lane)).toMatch(/^var\(--q-[a-z-]+\)$/)
    }
  })
})

describe("an empty window", () => {
  test("lays out nothing and asks for no lanes", () => {
    expect(layoutCommitGraph([])).toEqual({ rows: [], lanes: 0 })
  })
})

describe("a lane change is one curve, centred on the rule between two rows", () => {
  // The spawn in `a merge`: the merge commit on lane 0 sends its second parent
  // to lane 1, so the row above draws the first half and the row below the
  // second. This is the geometry the model exists for — the halves are cut from
  // one cubic, so what has to hold is that they meet, and meet smoothly.
  const leaving: CommitGraphEdge = {
    fromLane: 0,
    toLane: 1,
    from: "node",
    to: "bottom",
    bend: "bottom",
  }
  const arriving: CommitGraphEdge = {
    fromLane: 0,
    toLane: 1,
    from: "top",
    to: "node",
    bend: "top",
  }

  /** Every coordinate in a path, in order. */
  const numbers = (d: string) => (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const first = (d: string) => numbers(d).slice(0, 2)
  const last = (d: string) => numbers(d).slice(-2)
  /** The control point nearest the end, which is what fixes the tangent there. */
  const lastControl = (d: string) => numbers(d).slice(-4, -2)
  const firstControl = (d: string) => numbers(d).slice(2, 4)

  test("the halves meet exactly on the rule, halfway between the two lanes", () => {
    const [outX, outY] = last(edgePath(leaving))
    const [inX, inY] = first(edgePath(arriving))
    expect(outX).toBe(inX)
    // The rule: the bottom of one band is the top of the next.
    expect(outY).toBe(56)
    expect(inY).toBe(0)
    // Halfway across, so the curve is centred on the rule rather than finishing
    // above it. Lane 0 draws at x=8 and lane 1 at x=24.
    expect(outX).toBe(16)
  })

  test("they meet smoothly — same tangent, so the join is invisible", () => {
    const [cx, cy] = lastControl(edgePath(leaving))
    const [ex, ey] = last(edgePath(leaving))
    const [sx, sy] = first(edgePath(arriving))
    const [dx, dy] = firstControl(edgePath(arriving))
    expect([ex - cx, ey - cy]).toEqual([dx - sx, dy - sy])
  })

  test("a straight line is a straight line, not a curve with equal ends", () => {
    const straight = edgePath({
      fromLane: 1,
      toLane: 1,
      from: "top",
      to: "bottom",
      bend: "none",
    })
    expect(straight).toBe("M 24 0 L 24 56")
  })

  test("the arriving half is back on its own lane by the dot line, then runs straight", () => {
    const passing = edgePath({
      fromLane: 0,
      toLane: 1,
      from: "top",
      to: "bottom",
      bend: "top",
    })
    // …ends on lane 1 at the bottom, having reached it at the dot line.
    expect(passing.endsWith("L 24 56")).toBe(true)
    expect(passing).toContain("24 28")
  })
})
