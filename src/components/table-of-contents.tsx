"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Link } from "@/components/link"

/**
 * TableOfContents — quebi design system
 *
 * The "on this page" rail: a `<nav>` of links to the headings of the document
 * it sits beside, nested by heading level, with the heading you are reading
 * marked current. It looks like the sidebar nav on purpose — same row, same
 * current treatment — because it is the same kind of thing, one level down:
 * the sidebar moves between pages, this moves within one.
 *
 * **The items are data.** `items` is `{ id, title, level, children? }[]` and is
 * rendered on the first pass, so a prerendered page ships the whole list in its
 * HTML. `useTableOfContents` can collect the items from a container's headings
 * instead, but it reads the DOM, so it has nothing until after mount — reach
 * for it only where the page is client-rendered anyway.
 *
 * A flat list is nested by `level` (an h3 after an h2 goes under it); an item
 * with `children` keeps them as given.
 *
 * **Scroll-spy** runs on an IntersectionObserver, and only after mount: the
 * first render marks nothing current, so the prerender and the hydration pass
 * agree. The current heading is the last one whose top has passed the reading
 * line, `offset` down from the top of the scroll root. Pass `activeId` to own
 * the answer yourself (the observer is not started).
 *
 * **A click** scrolls the heading into view — smoothly, unless the reader asked
 * for reduced motion — writes its `#id` into the URL, and moves focus to the
 * heading, so the next Tab continues from there rather than from the rail. The
 * URL is written with `replaceState`, keeping the current history entry's
 * state: a client-side router keeps its bookkeeping in that state, and a
 * `pushState` behind its back is a Back button that goes nowhere. A modified
 * click (new tab, new window) is left to the browser.
 *
 * Give the headings a `scroll-mt-*` if a sticky header covers the top of the
 * page; `scrollIntoView` honours it.
 */

export interface TableOfContentsItem {
  /** The heading element's `id`; the link points at `#id`. */
  id: string
  title: React.ReactNode
  /** Heading level, 2 for an h2. Used to nest a flat list; defaults to 2. */
  level?: number
  children?: TableOfContentsItem[]
}

export interface TableOfContentsProps
  extends Omit<React.ComponentProps<"nav">, "children" | "onChange"> {
  items: TableOfContentsItem[]
  /** Visible label above the list. Also names the landmark. */
  label?: React.ReactNode
  /** Names the landmark when there is no visible `label`. */
  "aria-label"?: string
  /** The current heading, if you own it. `null` marks nothing; omit it to let the rail track scrolling. */
  activeId?: string | null
  /** Called when the tracked heading changes, and on a click. */
  onActiveChange?: (id: string | null) => void
  /**
   * The element that scrolls the headings, when it is not the window — an
   * `overflow-auto` panel, say. The scroll-spy measures against its box.
   */
  scrollRoot?: React.RefObject<HTMLElement | null>
  /** Distance of the reading line from the top of the scroll root, in px. Defaults to 96. */
  offset?: number
  /**
   * Keep the current item visible when the rail is shorter than its list —
   * `sticky` bounds it to the viewport, so a long list scrolls itself. Defaults to true.
   */
  followActive?: boolean
  /** Pin the rail to the top of its scrolling ancestor and bound its height to the viewport. */
  sticky?: boolean
}

const ROW =
  "block min-w-0 rounded-quebi-sm px-3 py-1.5 text-sm/5 no-underline transition-colors duration-150 hover:no-underline"
const RESTING =
  "font-normal text-quebi-fg-muted hover:bg-quebi-surface/[0.04] hover:text-quebi-fg"
const CURRENT = "bg-quebi-brand/10 font-medium text-quebi-brand-text hover:text-quebi-brand-text"

export function TableOfContents({
  items,
  label,
  "aria-label": ariaLabel,
  activeId: activeIdProp,
  onActiveChange,
  scrollRoot,
  offset = 96,
  followActive = true,
  sticky = false,
  className,
  ...props
}: TableOfContentsProps) {
  const tree = useMemo(() => nestTableOfContents(items), [items])
  const ids = useMemo(() => flattenIds(tree), [tree])
  const isControlled = activeIdProp !== undefined

  const tracked = useActiveHeading(isControlled ? [] : ids, { scrollRoot, offset })
  const [clicked, setClicked] = useState<{ id: string; tracked: string | null } | null>(null)
  // A click wins until the scroll it started moves the spy somewhere else, so
  // the row you pressed is current at once rather than when the scroll settles
  // — and a click on a heading too near the bottom to reach the reading line
  // stays current at all.
  const uncontrolled = clicked && clicked.tracked === tracked ? clicked.id : tracked
  const activeId = isControlled ? activeIdProp : uncontrolled

  const onActiveChangeRef = useRef(onActiveChange)
  onActiveChangeRef.current = onActiveChange
  const lastReported = useRef<string | null>(null)
  useEffect(() => {
    if (isControlled || activeId === lastReported.current) return
    lastReported.current = activeId
    onActiveChangeRef.current?.(activeId)
  }, [activeId, isControlled])

  const navRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = navRef.current
    if (!followActive || !activeId || !nav || nav.scrollHeight <= nav.clientHeight) return
    const link = nav.querySelector<HTMLElement>(`[data-toc-id="${CSS.escape(activeId)}"]`)
    if (!link) return
    // Scroll the rail, never the page: `scrollIntoView` would move every
    // scrolling ancestor, including the document the reader is in.
    const navBox = nav.getBoundingClientRect()
    const linkBox = link.getBoundingClientRect()
    if (linkBox.top < navBox.top) nav.scrollTop -= navBox.top - linkBox.top + 8
    else if (linkBox.bottom > navBox.bottom) nav.scrollTop += linkBox.bottom - navBox.bottom + 8
  }, [activeId, followActive])

  const navigate = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const heading = document.getElementById(id)
      if (!heading) return
      event.preventDefault()
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      heading.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" })
      window.history.replaceState(window.history.state, "", `#${id}`)
      if (!heading.hasAttribute("tabindex") && heading.tabIndex < 0) {
        heading.setAttribute("tabindex", "-1")
      }
      heading.focus({ preventScroll: true })
      if (isControlled) onActiveChangeRef.current?.(id)
      else setClicked({ id, tracked })
    },
    [isControlled, tracked],
  )

  const labelId = useId()
  const hasLabel = label != null && label !== false
  return (
    <nav
      ref={navRef}
      data-slot="table-of-contents"
      aria-label={hasLabel ? undefined : (ariaLabel ?? "On this page")}
      aria-labelledby={hasLabel ? labelId : undefined}
      className={cn(
        "flex min-w-0 flex-col gap-y-1",
        sticky && "sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    >
      {hasLabel && (
        <div id={labelId} className="px-3 font-medium text-quebi-fg-muted text-xs/6">
          {label}
        </div>
      )}
      <TocList items={tree} activeId={activeId} onNavigate={navigate} depth={0} />
    </nav>
  )
}

function TocList({
  items,
  activeId,
  onNavigate,
  depth,
}: {
  items: TableOfContentsItem[]
  activeId: string | null
  onNavigate: (id: string, event: React.MouseEvent) => void
  depth: number
}) {
  return (
    <ul
      data-slot="table-of-contents-list"
      className={cn(
        "flex min-w-0 flex-col gap-y-0.5",
        depth > 0 && "ms-3 mt-0.5 border-quebi-line/10 border-s ps-2",
      )}
    >
      {items.map((item) => {
        const isCurrent = item.id === activeId
        return (
          <li key={item.id} className="min-w-0">
            <Link
              href={`#${item.id}`}
              data-toc-id={item.id}
              aria-current={isCurrent ? "location" : undefined}
              onClick={(event) => onNavigate(item.id, event)}
              className={({ isFocusVisible }) =>
                cn(
                  ROW,
                  isCurrent ? CURRENT : RESTING,
                  isFocusVisible && "outline-hidden ring-2 ring-quebi-brand-mark ring-inset",
                )
              }
            >
              {item.title}
            </Link>
            {item.children && item.children.length > 0 && (
              <TocList
                items={item.children}
                activeId={activeId}
                onNavigate={onNavigate}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Nest a flat list by `level`: each item goes under the nearest earlier item
 * with a lower level. Items that already carry `children` keep them, and their
 * children are nested the same way.
 */
export function nestTableOfContents(items: TableOfContentsItem[]): TableOfContentsItem[] {
  const root: TableOfContentsItem[] = []
  const stack: { level: number; children: TableOfContentsItem[] }[] = []
  for (const item of items) {
    const level = item.level ?? 2
    const node: TableOfContentsItem = {
      ...item,
      children: item.children ? nestTableOfContents(item.children) : [],
    }
    while (stack.length > 0 && (stack[stack.length - 1]?.level ?? 0) >= level) stack.pop()
    const parent = stack[stack.length - 1]
    ;(parent ? parent.children : root).push(node)
    stack.push({ level, children: node.children as TableOfContentsItem[] })
  }
  return root
}

function flattenIds(items: TableOfContentsItem[]): string[] {
  return items.flatMap((item) => [item.id, ...flattenIds(item.children ?? [])])
}

/**
 * Which of `ids` is being read: the last heading, in the order given, whose
 * top is at or above the reading line `offset` px below the top of the scroll
 * root. `null` before mount and while the reader is above the first heading.
 *
 * The IntersectionObserver watches a band that ends at the reading line, so it
 * fires exactly when a heading crosses it; the answer is then measured rather
 * than read off the entries, which only describe the headings that moved.
 */
export function useActiveHeading(
  ids: string[],
  {
    scrollRoot,
    offset = 96,
  }: { scrollRoot?: React.RefObject<HTMLElement | null> | undefined; offset?: number } = {},
): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join("\u0000")

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const headings = key
      .split("\u0000")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return
    const root = scrollRoot?.current ?? null

    const measure = () => {
      const line = (root ? root.getBoundingClientRect().top : 0) + offset
      let current: string | null = null
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line + 1) current = heading.id
      }
      setActive(current)
    }

    const height = root ? root.clientHeight : window.innerHeight
    const observer = new IntersectionObserver(measure, {
      root,
      rootMargin: `0px 0px ${-Math.max(0, height - offset)}px 0px`,
    })
    for (const heading of headings) observer.observe(heading)
    measure()
    return () => observer.disconnect()
  }, [key, scrollRoot, offset])

  return active
}

/**
 * Collect table-of-contents items from the headings inside `container` that
 * have an `id`. Reads the DOM, so the list is empty until after mount — on a
 * prerendered page, pass `items` from your data instead.
 */
export function useTableOfContents(
  container: React.RefObject<HTMLElement | null>,
  selector = "h2[id], h3[id]",
): TableOfContentsItem[] {
  const [items, setItems] = useState<TableOfContentsItem[]>([])
  useEffect(() => {
    if (container.current) setItems(collectTableOfContents(container.current, selector))
  }, [container, selector])
  return items
}

/** The same collection as `useTableOfContents`, for when you hold the element. */
export function collectTableOfContents(
  container: ParentNode,
  selector = "h2[id], h3[id]",
): TableOfContentsItem[] {
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).map((el) => ({
    id: el.id,
    title: el.textContent?.trim() ?? "",
    level: /^H[1-6]$/.test(el.tagName) ? Number(el.tagName[1]) : 2,
  }))
}
