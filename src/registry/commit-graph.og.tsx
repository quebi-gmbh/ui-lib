import { CommitGraph, type CommitGraphCommit } from "@/components/commit-graph"
import type { OgScene } from "./types"

/**
 * A branch and the merge that closes it — the one history that needs a graph.
 * Fixed shas and ISO dates, so the picture is the same one twice.
 */
const HISTORY: CommitGraphCommit[] = [
  {
    sha: "9f1c0a4e7b2d8c3f5a616213943c73e9e9cb977e",
    parents: ["7c4e2b9d1a6f8e0c3b57ac1d1bed210783c42f41", "4a9d6f1c8b3e5072d4a13c2716662755932e584a"],
    message: "Merge the date-picker branch",
    author: { name: "Ada Lovelace" },
    date: "2026-03-18T09:24:00Z",
  },
  {
    sha: "4a9d6f1c8b3e5072d4a13c2716662755932e584a",
    parents: ["1b7e3c5a9d2f4608e7c94f8a832bd7472d6ecf98"],
    message: "Open on the month you are looking at",
    author: { name: "Grace Hopper" },
    date: "2026-03-17T16:02:00Z",
  },
  {
    sha: "7c4e2b9d1a6f8e0c3b57ac1d1bed210783c42f41",
    parents: ["1b7e3c5a9d2f4608e7c94f8a832bd7472d6ecf98"],
    message: "Pin the time zone so prerender and hydration agree",
    author: { name: "Alan Turing" },
    date: "2026-03-17T11:47:00Z",
  },
  {
    sha: "1b7e3c5a9d2f4608e7c94f8a832bd7472d6ecf98",
    parents: [],
    message: "Extract the Intl format cache",
    author: { name: "Ada Lovelace" },
    date: "2026-03-16T08:10:00Z",
  },
]

export const commitGraphOgScene: OgScene = {
  scale: 1.3,
  render: () => (
    <div className="w-144">
      <CommitGraph commits={HISTORY} aria-label="Commit history" />
    </div>
  ),
}
