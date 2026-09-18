import type { ComponentMeta } from "./types"

export const commitGraphMeta: ComponentMeta = {
  slug: "commit-graph",
  name: "Commit Graph",
  description:
    "A git history list with the branch/merge lane graph drawn down its left edge — the `git log --graph` surface every git client has. One row per commit: the graph column, the short sha in a Snippet so it copies, the subject line, ref badges that tell a branch from a tag from a remote from HEAD, the author, and the date through FormattedDate (never a bare toLocaleString, because the site is prerendered). The lane assignment is a pure exported function, layoutCommitGraph(commits), so merges, branch points, reused lanes, octopus merges, root commits and parents outside the window are unit-testable without rendering anything. It renders the commits it is given and never fetches or re-orders them — git log is already topologically ordered and already paginated, so re-sorting here would scramble the one thing the layout depends on; the next page is asked for through onLoadMore, whose affordance sits under the list because this component is what draws the 'there is more' signal, the edges running off the bottom of the last row. Omit onLoadMore and no pagination chrome is rendered at all.",
  category: "Display",
  tags: ["git", "commits", "history", "graph", "lanes", "list", "selection", "interactive"],
}
