"use client"

import { Cloud, GitBranch, GitCommitHorizontal, Tag } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { FormattedDate } from "@/components/formatted-date"
import { GridList, GridListItem } from "@/components/grid-list"
import { Snippet } from "@/components/snippet"
import { cn } from "@/lib/utils"

/**
 * CommitGraph — quebi design system
 *
 * A `git log --graph` surface: one row per commit, with the branch/merge graph
 * drawn down the left edge.
 *
 * ## Who owns the query
 *
 * The same split as `DataTable` vs `ServerTable`: this component renders the
 * commits it is handed and never fetches, filters or re-orders them. `git log`
 * is already paginated and already topologically ordered, so sorting `commits`
 * here would reorder one page of an answer the caller asked for — and worse, it
 * would reorder the one thing the lane layout depends on. Pagination is reported
 * out through `onLoadMore`; the affordance lives here rather than beside the
 * component because *this* component is what draws the "there is more" signal —
 * the edges that run off the bottom of the last row — so the control that acts
 * on it belongs under them. Omit `onLoadMore` and nothing is rendered.
 *
 * ## Dates
 *
 * The date column goes through `FormattedDate`, never `toLocaleString()`: the
 * site is prerendered, so an implicit locale is a hydration bug. `relativeDates`
 * switches the column to "3 days ago", which `FormattedDate` computes after
 * mount (rendering the absolute date until then) for the same reason.
 *
 * ## Lane colours
 *
 * Lane colour is a pure function of the lane index (`laneColor`), so a lane
 * keeps its colour for as long as it is alive and a reused lane picks up the
 * colour of its index rather than of its history. The hues are quebi semantic
 * tokens, which are re-declared per theme, so the graph reads in light and dark
 * without a second palette — see `LANE_COLOR_TOKENS` for why that rules out the
 * brand teal, of all colours.
 */

/** A ref pointing at a commit. `kind` drives the badge's colour and glyph. */
export interface CommitGraphRef {
  name: string
  kind: "branch" | "tag" | "head" | "remote"
}

/** One commit, in the shape `git log` hands it over. */
export interface CommitGraphCommit {
  sha: string
  /** 0 = root, 1 = normal, 2+ = merge. Parents outside the window are fine. */
  parents: string[]
  /** The subject line. The body is the caller's business. */
  message: string
  author: { name: string; avatarUrl?: string }
  date: Date | string
  refs?: CommitGraphRef[]
}

/**
 * One line drawn inside a single row's band.
 *
 * A row's band runs from the top of the row to the bottom, with the commit's
 * dot at the vertical middle. An edge therefore has two endpoints, each of which
 * is either a lane on the band's boundary or the dot itself:
 *
 * - `top` → `bottom`: a lane passing through this row untouched.
 * - `top` → `node`: a child's line arriving at this commit (the commit's own
 *   lane, or a second lane merging into it).
 * - `node` → `bottom`: a line leaving for one of this commit's parents. When
 *   that parent is outside the window the line simply keeps going, row after
 *   row, and runs off the bottom of the last one.
 */
export interface CommitGraphEdge {
  /** Lane the edge occupies at the top of the band. */
  fromLane: number
  /** Lane it occupies at the bottom. */
  toLane: number
  /** Where it starts: the top of the band, or this row's dot. */
  from: "top" | "node"
  /** Where it ends: the bottom of the band, or this row's dot. */
  to: "bottom" | "node"
  /** The lane whose colour the edge takes — the end away from the dot. */
  colorLane: number
}

/** One laid-out commit. */
export interface CommitGraphRow {
  commit: CommitGraphCommit
  /** Lane index the commit's dot sits on. */
  lane: number
  edges: CommitGraphEdge[]
  /** More than one parent. */
  isMerge: boolean
  /** No parents at all — the start of history. */
  isRoot: boolean
}

export interface CommitGraphLayout {
  rows: CommitGraphRow[]
  /** How many lanes the widest row uses — the graph column's width, in lanes. */
  lanes: number
}

/**
 * Assign lanes and edges to an already topologically ordered list of commits.
 *
 * Exported and pure on purpose: this is the whole difficulty of the component
 * and the drawing is easy once it is right, so it is unit-testable without
 * rendering anything (`tests/commit-graph-layout.test.ts`).
 *
 * The algorithm is one pass, newest commit first, over a list of *active lanes*.
 * A lane holds the sha it is still waiting for — the next commit that will
 * appear on it. For each commit:
 *
 * 1. Every lane waiting for this sha ends here. The leftmost of them is the
 *    commit's own lane; the rest are branches merging in and are freed. A commit
 *    no lane was waiting for is a head, and claims the leftmost free lane.
 * 2. The first parent continues on the commit's own lane, so a linear history
 *    draws one straight line.
 * 3. Every other parent either joins a lane that is already waiting for it —
 *    which is what a branch point looks like from below — or claims a lane of
 *    its own. Freed lanes are reused from the left, so a lane that a branch
 *    finished with is picked up by the next unrelated branch.
 *
 * Nothing is ever re-indexed: a lane keeps its index for its whole life, which
 * is what makes a pass-through edge a straight vertical line and lets a row be
 * drawn from its own band alone.
 */
export function layoutCommitGraph(commits: CommitGraphCommit[]): CommitGraphLayout {
  // active[i] === the sha lane i is waiting for, or null when the lane is free.
  const active: (string | null)[] = []
  const rows: CommitGraphRow[] = []
  let lanes = 0

  /** The leftmost free lane, growing the list only when there is none. */
  const claim = () => {
    const free = active.indexOf(null)
    if (free !== -1) return free
    active.push(null)
    return active.length - 1
  }

  for (const commit of commits) {
    const incoming = active.slice()

    const waiting: number[] = []
    for (let i = 0; i < incoming.length; i++) {
      if (incoming[i] === commit.sha) waiting.push(i)
    }

    const lane = waiting.length > 0 ? waiting[0] : claim()
    // Every lane that was waiting for this commit terminates at it, the
    // commit's own lane included — the first parent re-claims it below. Freeing
    // them before the parents are placed is what lets a merged-away lane be
    // reused by one of this commit's own parents.
    for (const index of waiting) active[index] = null

    const edges: CommitGraphEdge[] = []
    for (let i = 0; i < incoming.length; i++) {
      const expected = incoming[i]
      if (expected === null) continue
      if (expected === commit.sha) {
        edges.push({ fromLane: i, toLane: lane, from: "top", to: "node", colorLane: i })
      } else {
        edges.push({ fromLane: i, toLane: i, from: "top", to: "bottom", colorLane: i })
      }
    }

    // A commit listing the same parent twice is malformed, but it costs one Set
    // to draw it once rather than to draw two edges on top of each other.
    const placed = new Set<string>()
    for (let k = 0; k < commit.parents.length; k++) {
      const parent = commit.parents[k]
      if (placed.has(parent)) continue
      placed.add(parent)

      const existing = active.indexOf(parent)
      let target: number
      if (existing !== -1) {
        // Another branch already leads to this parent: join it. This is the
        // branch-point case, seen from the younger of the two children.
        target = existing
      } else if (k === 0) {
        target = lane
        active[lane] = parent
      } else {
        target = claim()
        active[target] = parent
      }
      edges.push({ fromLane: lane, toLane: target, from: "node", to: "bottom", colorLane: target })
    }

    let width = lane + 1
    for (const edge of edges) {
      width = Math.max(width, edge.fromLane + 1, edge.toLane + 1)
    }
    lanes = Math.max(lanes, width)

    rows.push({
      commit,
      lane,
      edges,
      isMerge: commit.parents.length > 1,
      isRoot: commit.parents.length === 0,
    })
  }

  return { rows, lanes }
}

/** Width of one lane, in SVG units — also the row band's horizontal step. */
const LANE_WIDTH = 16
/** Height of one row's band. Pinned to the row's `h-14` so the lines join up. */
const ROW_HEIGHT = 56
const DOT_RADIUS = 4

/**
 * The lane palette, written as whole `var(…)` literals on the theme's *runtime*
 * variables.
 *
 * Both of those are deliberate, and neither is a style preference.
 *
 * **Why `--q-*` and not the `--color-quebi-*` alias.** quebi declares the
 * aliases inside `@theme inline`, which makes emitting them Tailwind's job, and
 * Tailwind only emits a theme variable it can see used — by scanning source text
 * for the name. A colour that reaches the DOM through an SVG `stroke` attribute
 * is not a utility class, so the only thing that can keep the variable alive is
 * the literal name appearing in a file Tailwind scans. The `--q-*` variables are
 * declared in ordinary `:root` / `.light` rules, so they exist no matter what a
 * scanner concludes.
 *
 * **Why whole literals rather than a built string.** This list used to hold bare
 * token names and `laneColor` assembled `var(--color-${name})`. That reads
 * tidier and it silently broke three of the five lanes: the assembled name never
 * appears in the source, Tailwind never emitted `--color-quebi-accent`,
 * `-info` or `-danger`, and those lanes fell back to SVG's own defaults — black
 * dots and, because SVG's default stroke is `none`, no line at all. Nothing
 * failed; the graph just quietly lost its branches. Keep these as literals.
 *
 * The list is five and not the six it reads like it wants to be because a lane
 * line is a graphical object carrying meaning, so WCAG 1.4.11 asks 3:1 of it,
 * and two otherwise obvious candidates miss on the light surface: `--q-brand` is
 * deliberately the *same* teal in both modes and measures 1.74:1 there, and
 * `--q-warn` misses at 2.94:1. `--q-success` is within a shade of the brand teal
 * on dark, so lane 0 still looks like quebi without being the one colour that
 * cannot flip.
 *
 * `tests/commit-graph-contrast.test.ts` checks both halves against
 * `src/quebi-theme.css`: that every variable named here is really declared by
 * both themes, and that each clears 3:1 against its own background.
 *
 * Ordered so no two adjacent lanes are neighbouring hues.
 */
export const LANE_COLORS = [
  "var(--q-success)",
  "var(--q-accent)",
  "var(--q-info)",
  "var(--q-danger)",
  "var(--q-fg-muted)",
] as const

/** The colour a lane index draws in. Stable, and defined for every integer. */
export function laneColor(lane: number): string {
  const count = LANE_COLORS.length
  return LANE_COLORS[((lane % count) + count) % count]
}

/** Horizontal centre of a lane within the band. */
function laneX(lane: number) {
  return lane * LANE_WIDTH + LANE_WIDTH / 2
}

/**
 * The `d` of one edge: a straight line when it stays in its lane, and a
 * symmetric cubic when it changes lane, so a branch leaves and rejoins with the
 * same curve.
 */
function edgePath(edge: CommitGraphEdge): string {
  const middle = ROW_HEIGHT / 2
  const x1 = laneX(edge.fromLane)
  const x2 = laneX(edge.toLane)
  const y1 = edge.from === "top" ? 0 : middle
  const y2 = edge.to === "bottom" ? ROW_HEIGHT : middle
  if (x1 === x2) return `M ${x1} ${y1} L ${x2} ${y2}`
  const bend = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${bend} ${x2} ${bend} ${x2} ${y2}`
}

/** A row's slice of the graph. Decorative — the row's text carries the meaning. */
function CommitGraphLanes({ row, lanes }: { row: CommitGraphRow; lanes: number }) {
  const width = Math.max(lanes, 1) * LANE_WIDTH
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={width}
      height={ROW_HEIGHT}
      viewBox={`0 0 ${width} ${ROW_HEIGHT}`}
      className="shrink-0 self-stretch"
    >
      {row.edges.map((edge) => (
        <path
          key={`${edge.from}:${edge.fromLane}-${edge.to}:${edge.toLane}`}
          d={edgePath(edge)}
          fill="none"
          stroke={laneColor(edge.colorLane)}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
      {/* A merge is a hollow dot, so the graph does not rely on colour alone to
          say which commits joined two histories. */}
      <circle
        cx={laneX(row.lane)}
        cy={ROW_HEIGHT / 2}
        r={row.isMerge ? DOT_RADIUS + 1 : DOT_RADIUS}
        fill={row.isMerge ? "var(--q-bg)" : laneColor(row.lane)}
        stroke={laneColor(row.lane)}
        strokeWidth={2}
      />
    </svg>
  )
}

const refIntents = {
  head: "brand",
  branch: "info",
  remote: "outline",
  tag: "warning",
} as const

const refIcons = {
  head: GitCommitHorizontal,
  branch: GitBranch,
  remote: Cloud,
  tag: Tag,
}

function RefBadge({ commitRef }: { commitRef: CommitGraphRef }) {
  const Icon = refIcons[commitRef.kind]
  return (
    <Badge intent={refIntents[commitRef.kind]} className="max-w-44 shrink-0">
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      <span className="truncate">{commitRef.name}</span>
    </Badge>
  )
}

/** First and last initial, which is what an avatar falls back to. */
function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export interface CommitGraphProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /**
   * The commits to draw, already topologically ordered (newest first), exactly
   * as `git log` hands them over. Never re-ordered here.
   */
  commits: CommitGraphCommit[]
  /** Controlled selection. `null` selects nothing; omit it to leave the list uncontrolled. */
  selectedSha?: string | null
  /** Called with the full sha of the row the user selected. */
  onSelectCommit?: (sha: string) => void
  /**
   * Fetch the next page. Omit it and no pagination affordance is rendered —
   * the caller is then free to put its own `ShowMore` around the component.
   */
  onLoadMore?: () => void
  /** Disables the load-more control and swaps its label while a page is in flight. */
  isLoadingMore?: boolean
  /** Label for the load-more control. */
  loadMoreLabel?: string
  /** Number of sha characters shown (and copied) per row. */
  shortShaLength?: number
  /**
   * Render the date column as "3 days ago". Computed after mount — the absolute
   * date is rendered until then, so a prerender and its hydration agree.
   */
  relativeDates?: boolean
  /** Shown in place of the list when `commits` is empty. */
  emptyState?: React.ReactNode
  "aria-label"?: string
}

/**
 * A commit history with the lane graph drawn beside it.
 */
export function CommitGraph({
  commits,
  selectedSha,
  onSelectCommit,
  onLoadMore,
  isLoadingMore = false,
  loadMoreLabel = "Load older commits",
  shortShaLength = 7,
  relativeDates = false,
  emptyState = "No commits to show.",
  className,
  "aria-label": ariaLabel = "Commit history",
  ...props
}: CommitGraphProps) {
  const { rows, lanes } = layoutCommitGraph(commits)
  const isSelectable = onSelectCommit !== undefined || selectedSha !== undefined

  return (
    <div
      data-slot="commit-graph"
      className={cn(
        "w-full overflow-hidden rounded-quebi-md border border-quebi-line/10 bg-quebi-bg",
        className,
      )}
      {...props}
    >
      <GridList
        aria-label={ariaLabel}
        className="gap-y-0"
        selectionMode={isSelectable ? "single" : "none"}
        selectionBehavior="replace"
        {...(selectedSha === undefined
          ? {}
          : { selectedKeys: selectedSha === null ? [] : [selectedSha] })}
        onSelectionChange={(keys) => {
          if (keys === "all") return
          const [first] = keys
          if (first !== undefined) onSelectCommit?.(String(first))
        }}
        renderEmptyState={() => (
          <div className="px-4 py-10 text-center text-quebi-fg-muted text-sm">{emptyState}</div>
        )}
      >
        {rows.map((row) => {
          const { commit } = row
          const shortSha = commit.sha.slice(0, shortShaLength)
          return (
            <GridListItem
              key={commit.sha}
              id={commit.sha}
              textValue={`${shortSha} ${commit.message}`}
              // Two overrides here, and only one of them is a matter of taste.
              //
              // `py-0` is load-bearing: the band is drawn at exactly ROW_HEIGHT
              // and stretched to the row's content box, so vertical padding
              // would squash it below the row's own pitch and the lines would
              // stop meeting across rows. The horizontal padding is *not*
              // overridden — GridListItem's `px-3` is what every other row in
              // the library sits on, and the graph column needs that gutter as
              // much as the text does.
              //
              // The row separator is a pseudo-element rather than a bottom
              // border: GridListItem's own `border` is a four-sided one, and
              // killing it needs `border-0`, which then has to out-order a
              // `border-b` in the generated sheet rather than simply beating it.
              // Absolute + `inset-x-0` resolves against the padding box, so the
              // rule still spans the full row rather than stopping at the text.
              className="relative h-14 gap-3 rounded-none border-0 py-0 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-quebi-line/10 last:after:hidden sm:gap-3"
            >
              <CommitGraphLanes row={row} lanes={lanes} />
              <Snippet
                text={shortSha}
                symbol=""
                className="w-auto shrink-0 gap-1.5 rounded-none border-0 bg-transparent px-0 py-0"
              />
              <span className="min-w-0 flex-1 truncate text-quebi-fg text-sm">
                {commit.message}
              </span>
              {commit.refs?.length ? (
                <span className="hidden shrink-0 items-center gap-1.5 lg:flex">
                  {commit.refs.map((commitRef) => (
                    <RefBadge key={`${commitRef.kind}:${commitRef.name}`} commitRef={commitRef} />
                  ))}
                </span>
              ) : null}
              <span className="hidden shrink-0 items-center gap-2 sm:flex">
                <Avatar
                  size="xs"
                  src={commit.author.avatarUrl}
                  initials={initialsOf(commit.author.name)}
                  alt={commit.author.name}
                />
                <span className="max-w-32 truncate text-quebi-fg-muted text-xs">
                  {commit.author.name}
                </span>
              </span>
              <FormattedDate
                date={commit.date}
                dateStyle="medium"
                relative={relativeDates}
                className="shrink-0 text-quebi-fg-subtle text-xs tabular-nums"
              />
            </GridListItem>
          )
        })}
      </GridList>
      {onLoadMore ? (
        <div className="flex justify-center border-quebi-line/10 border-t px-4 py-3">
          <Button
            intent="outline"
            size="sm"
            isDisabled={isLoadingMore}
            onPress={() => onLoadMore()}
          >
            {isLoadingMore ? "Loading…" : loadMoreLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
