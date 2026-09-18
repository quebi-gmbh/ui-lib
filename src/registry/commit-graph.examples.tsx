import { useState } from "react"
import {
  CommitGraph,
  type CommitGraphCommit,
  type CommitGraphLaneWidth,
  type CommitGraphLineWeight,
  type CommitGraphNodeShape,
  type CommitGraphNodeSize,
} from "@/components/commit-graph"
import type { ComponentExample } from "./types"

/**
 * Dates are fixed ISO strings rather than `new Date()`: the gallery is
 * prerendered, so a fixture built from the current clock would render one date
 * into the HTML and a different one on hydration.
 */
const ada = { name: "Ada Lovelace" }
const alan = { name: "Alan Turing" }
const grace = { name: "Grace Hopper" }

/** A plain single-branch history — the common case, one straight lane. */
const linearHistory: CommitGraphCommit[] = [
  {
    sha: "9f1c0a4e7b2d8c3f5a616213943c73e9e9cb977e",
    parents: ["7c4e2b9d1a6f8e0c3b57ac1d1bed210783c42f41"],
    message: "Cache the parsed locale between renders",
    author: ada,
    date: "2026-03-18T09:24:00Z",
  },
  {
    sha: "7c4e2b9d1a6f8e0c3b57ac1d1bed210783c42f41",
    parents: ["4a9d6f1c8b3e5072d4a13c2716662755932e584a"],
    message: "Pin the time zone so prerender and hydration agree",
    author: alan,
    date: "2026-03-17T16:02:00Z",
  },
  {
    sha: "4a9d6f1c8b3e5072d4a13c2716662755932e584a",
    parents: ["1b7e3c5a9d2f4608e7c94f8a832bd7472d6ecf98"],
    message: "Extract the Intl format cache",
    author: ada,
    date: "2026-03-17T11:47:00Z",
  },
  {
    sha: "1b7e3c5a9d2f4608e7c94f8a832bd7472d6ecf98",
    parents: [],
    message: "Initial commit",
    author: grace,
    date: "2026-03-16T08:00:00Z",
  },
]

/**
 * A merge and a branch point over the same four-commit trunk: `f6` forks off
 * `m8`, `f7` builds on it, and `m9` merges the pair back. The layout has to draw
 * two incoming edges into `m9`, and `f6`'s line curving back into the trunk.
 */
const branchedHistory: CommitGraphCommit[] = [
  {
    sha: "c0ffee1234567890abcd6aff438b41031d7157ca",
    parents: ["b00c1a5e0d9f3a7c2e41de856047cdb1ab7e5cb5", "a17e5d2c9b4f6081e3a25b670f8fe6191ea9b3ff"],
    message: "Merge branch 'feature/search'",
    author: grace,
    date: "2026-03-18T14:10:00Z",
  },
  {
    sha: "a17e5d2c9b4f6081e3a25b670f8fe6191ea9b3ff",
    parents: ["9d3b7f1e5c08a642b9d74bac5761dcef4a5657ec"],
    message: "Highlight matches in the result list",
    author: alan,
    date: "2026-03-18T12:33:00Z",
  },
  {
    sha: "9d3b7f1e5c08a642b9d74bac5761dcef4a5657ec",
    parents: ["b00c1a5e0d9f3a7c2e41de856047cdb1ab7e5cb5"],
    message: "Add the search index",
    author: alan,
    date: "2026-03-18T10:05:00Z",
  },
  {
    sha: "b00c1a5e0d9f3a7c2e41de856047cdb1ab7e5cb5",
    parents: ["5e8a2c7d4b1f93602ac827030910649443afabd6"],
    message: "Bump react-aria-components to 1.19",
    author: ada,
    date: "2026-03-17T17:41:00Z",
  },
  {
    sha: "5e8a2c7d4b1f93602ac827030910649443afabd6",
    parents: [],
    message: "Initial commit",
    author: grace,
    date: "2026-03-16T08:00:00Z",
  },
]

/** The same history, with the refs `git log --decorate` would print. */
const decoratedHistory: CommitGraphCommit[] = branchedHistory.map((commit, index) => {
  if (index === 0) {
    return {
      ...commit,
      refs: [
        { name: "HEAD", kind: "head" as const },
        { name: "main", kind: "branch" as const },
        { name: "origin/main", kind: "remote" as const },
      ],
    }
  }
  if (index === 1) {
    return { ...commit, refs: [{ name: "feature/search", kind: "branch" as const }] }
  }
  if (index === 3) {
    return { ...commit, refs: [{ name: "v2.1.0", kind: "tag" as const }] }
  }
  return commit
})

/**
 * A window onto a longer history: the oldest commit here names a parent that is
 * not in the list, so its lane runs off the bottom instead of terminating —
 * which is exactly the signal the load-more control acts on.
 */
const windowedHistory: CommitGraphCommit[] = [
  {
    sha: "3f6b1d8e4a29c705b1fe6367f3386bd6a392e354",
    parents: ["2a5c9e7b0d43f186c2abb00eee2af4d17daae617", "8b1f4d6a3e97c250fa7d4d02cfdd7196fb8d2226"],
    message: "Merge pull request #204 from quebi/tokens",
    author: grace,
    date: "2026-03-18T18:20:00Z",
  },
  {
    sha: "8b1f4d6a3e97c250fa7d4d02cfdd7196fb8d2226",
    parents: ["2a5c9e7b0d43f186c2abb00eee2af4d17daae617"],
    message: "Move the lane palette onto semantic tokens",
    author: ada,
    date: "2026-03-18T17:05:00Z",
  },
  {
    sha: "2a5c9e7b0d43f186c2abb00eee2af4d17daae617",
    parents: ["d4e8a1c62b7f0935ed13ac93c95ee9b8bc5645b4"],
    message: "Document the light/dark contrast check",
    author: alan,
    date: "2026-03-18T15:52:00Z",
  },
  {
    sha: "d4e8a1c62b7f0935ed13ac93c95ee9b8bc5645b4",
    // Not in this page: the edge keeps going past the last row.
    parents: ["6c2f9b0d5a81e374c6b9bab74d0d4bd12e1c0fb7"],
    message: "Split the theme file per surface",
    author: ada,
    date: "2026-03-18T15:01:00Z",
  },
]

/** An octopus merge — three parents, three incoming lanes. */
const octopusHistory: CommitGraphCommit[] = [
  {
    sha: "0c70bd5e00112233aabb355fbea2e2304d9a68b9",
    parents: ["11aa22bb33cc44dd55eece6095c3a39a90935134", "66ff77aa88bb99cc00ddb33a0e783a295921b550", "aabbccdd11223344eeff52206c61b7f86fcb7746"],
    message: "Merge branches 'docs', 'ci' and 'deps'",
    author: grace,
    date: "2026-03-19T09:00:00Z",
    refs: [{ name: "HEAD", kind: "head" }],
  },
  {
    sha: "66ff77aa88bb99cc00ddb33a0e783a295921b550",
    parents: ["11aa22bb33cc44dd55eece6095c3a39a90935134"],
    message: "Run the rule suite on pull requests too",
    author: alan,
    date: "2026-03-18T21:14:00Z",
    refs: [{ name: "ci", kind: "branch" }],
  },
  {
    sha: "aabbccdd11223344eeff52206c61b7f86fcb7746",
    parents: ["11aa22bb33cc44dd55eece6095c3a39a90935134"],
    message: "Bump biome to 2.4",
    author: ada,
    date: "2026-03-18T20:38:00Z",
    refs: [{ name: "deps", kind: "branch" }],
  },
  {
    sha: "11aa22bb33cc44dd55eece6095c3a39a90935134",
    parents: [],
    message: "Initial commit",
    author: grace,
    date: "2026-03-16T08:00:00Z",
  },
]

export const commitGraphExamples: ComponentExample[] = [
  {
    title: "Linear history",
    description:
      "One branch, one lane. The oldest commit has no parents, so its line stops at the dot.",
    render: () => <CommitGraph commits={linearHistory} aria-label="Linear commit history" />,
  },
  {
    title: "A merge and a branch point",
    description:
      "'feature/search' forks off the trunk and is merged back. The merge commit is a hollow dot, so the graph never depends on colour alone.",
    render: () => <CommitGraph commits={branchedHistory} aria-label="Branched commit history" />,
  },
  {
    title: "Ref badges",
    description:
      "HEAD, a local branch, a remote branch and a tag each get their own intent and glyph.",
    render: () => <CommitGraph commits={decoratedHistory} aria-label="Decorated commit history" />,
  },
  {
    title: "Selection",
    description:
      "Controlled through selectedSha / onSelectCommit. The callback always gets the full sha, not the short one the row displays.",
    render: function SelectableCommitGraph() {
      const [selected, setSelected] = useState<string | null>(branchedHistory[1].sha)
      return (
        <div className="flex w-full flex-col gap-3">
          <CommitGraph
            commits={branchedHistory}
            selectedSha={selected}
            onSelectCommit={setSelected}
            aria-label="Selectable commit history"
          />
          <p className="text-quebi-fg-muted text-sm">
            Selected: <span className="font-mono text-quebi-brand-text">{selected ?? "none"}</span>
          </p>
        </div>
      )
    },
  },
  {
    title: "Pagination",
    description:
      "onLoadMore reports the request out and the caller appends the next page; the control lives under the list because the list is what draws the signal it acts on. The oldest row's parent is outside this window, so its lane runs off the bottom — load the next page and the edge terminates on a root dot instead, and the control goes away with it, because a caller says \"pagination is mine\" by passing no onLoadMore at all.",
    render: function PaginatedCommitGraph() {
      const [commits, setCommits] = useState(windowedHistory)
      const exhausted = commits.length > windowedHistory.length
      return (
        <CommitGraph
          commits={commits}
          aria-label="Paginated commit history"
          onLoadMore={
            exhausted
              ? undefined
              : () =>
                  setCommits([
                    ...windowedHistory,
                    {
                      sha: "6c2f9b0d5a81e374c6b9bab74d0d4bd12e1c0fb7",
                      parents: [],
                      message: "Initial commit",
                      author: grace,
                      date: "2026-03-16T08:00:00Z",
                    },
                  ])
          }
        />
      )
    },
  },
  {
    title: "Octopus merge",
    description: "Three parents on one commit: three lanes arrive at the same dot.",
    render: () => <CommitGraph commits={octopusHistory} aria-label="Octopus merge history" />,
  },
  {
    title: "Relative dates",
    description:
      "relativeDates switches the column to '3 days ago'. FormattedDate computes it after mount and renders the absolute date until then, so a prerender and its hydration never disagree.",
    render: () => (
      <CommitGraph commits={linearHistory} relativeDates aria-label="Recent commit history" />
    ),
  },
  {
    title: "Empty",
    description: "A filtered history with no matches.",
    render: () => (
      <CommitGraph
        commits={[]}
        aria-label="Empty commit history"
        emptyState="No commits match this filter."
      />
    ),
  },
  {
    title: "Line weight",
    description:
      "How much of the screen the graph is allowed to be. hairline keeps it background behind a dense history; bold makes it the subject.",
    render: () => (
      <div className="flex w-full flex-col gap-6">
        {(["hairline", "regular", "bold"] as CommitGraphLineWeight[]).map((weight) => (
          <div key={weight} className="flex flex-col gap-2">
            <p className="font-mono text-quebi-fg-subtle text-xs">lineWeight=&quot;{weight}&quot;</p>
            <CommitGraph
              commits={branchedHistory}
              lineWeight={weight}
              aria-label={`Commit history, ${weight} lines`}
            />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Node size",
    description: "The commit markers, from sm to lg. The lines are unchanged.",
    render: () => (
      <div className="flex w-full flex-col gap-6">
        {(["sm", "md", "lg"] as CommitGraphNodeSize[]).map((size) => (
          <div key={size} className="flex flex-col gap-2">
            <p className="font-mono text-quebi-fg-subtle text-xs">nodeSize=&quot;{size}&quot;</p>
            <CommitGraph
              commits={branchedHistory}
              nodeSize={size}
              aria-label={`Commit history, ${size} markers`}
            />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Node shape",
    description:
      "What a commit is drawn as. Whichever you pick, a merge is drawn as its inverse and a hair larger — the top row of every graph here is the merge — so a merge is never told apart by colour alone. That part is not an option.",
    render: () => (
      <div className="flex w-full flex-col gap-6">
        {(["dot", "ring", "square", "diamond"] as CommitGraphNodeShape[]).map((shape) => (
          <div key={shape} className="flex flex-col gap-2">
            <p className="font-mono text-quebi-fg-subtle text-xs">nodeShape=&quot;{shape}&quot;</p>
            <CommitGraph
              commits={branchedHistory}
              nodeShape={shape}
              aria-label={`Commit history, ${shape} markers`}
            />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Lane width",
    description:
      "How much room the lanes get. Shown on the octopus merge, where three lanes are live at once and the difference is the width of the whole column.",
    render: () => (
      <div className="flex w-full flex-col gap-6">
        {(["tight", "regular", "wide"] as CommitGraphLaneWidth[]).map((width) => (
          <div key={width} className="flex flex-col gap-2">
            <p className="font-mono text-quebi-fg-subtle text-xs">laneWidth=&quot;{width}&quot;</p>
            <CommitGraph
              commits={octopusHistory}
              laneWidth={width}
              aria-label={`Octopus merge, ${width} lanes`}
            />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Composed",
    description:
      "The options are independent, so a dense log can go quiet (hairline, small, tight) or a small history can be the subject of the screen (bold, large, wide).",
    render: () => (
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-quebi-fg-subtle text-xs">
            lineWeight=&quot;hairline&quot; nodeSize=&quot;sm&quot; laneWidth=&quot;tight&quot;
          </p>
          <CommitGraph
            commits={branchedHistory}
            lineWeight="hairline"
            nodeSize="sm"
            laneWidth="tight"
            aria-label="Quiet commit history"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-quebi-fg-subtle text-xs">
            lineWeight=&quot;bold&quot; nodeSize=&quot;lg&quot; nodeShape=&quot;ring&quot;
            laneWidth=&quot;wide&quot;
          </p>
          <CommitGraph
            commits={branchedHistory}
            lineWeight="bold"
            nodeSize="lg"
            nodeShape="ring"
            laneWidth="wide"
            aria-label="Prominent commit history"
          />
        </div>
      </div>
    ),
  },
]
