import { useRef } from "react"
import { Heading } from "@/components/heading"
import { ScrollArea } from "@/components/scroll-area"
import { TableOfContents, type TableOfContentsItem } from "@/components/table-of-contents"
import { Text } from "@/components/text"
import type { ComponentExample } from "./types"

interface Section {
  id: string
  title: string
  level: 2 | 3
}

// Ids are prefixed per example: every example is on the same page, and an id
// is a document-wide name.
const GUIDE: Section[] = [
  { id: "guide-install", title: "installation", level: 2 },
  { id: "guide-requirements", title: "requirements", level: 3 },
  { id: "guide-cli", title: "using the CLI", level: 3 },
  { id: "guide-usage", title: "usage", level: 2 },
  { id: "guide-items", title: "items as data", level: 3 },
  { id: "guide-spy", title: "scroll-spy", level: 3 },
  { id: "guide-a11y", title: "accessibility", level: 2 },
  { id: "guide-faq", title: "FAQ", level: 2 },
]

const CHANGELOG: Section[] = [
  { id: "log-2-4", title: "2.4 — table of contents", level: 2 },
  { id: "log-2-3", title: "2.3 — quick actions", level: 2 },
  { id: "log-2-2", title: "2.2 — stat groups", level: 2 },
  { id: "log-2-1", title: "2.1 — lists", level: 2 },
]

const RAIL: Section[] = [
  { id: "rail-overview", title: "overview", level: 2 },
  { id: "rail-billing", title: "billing", level: 2 },
  { id: "rail-invoices", title: "invoices", level: 3 },
  { id: "rail-tax", title: "tax details", level: 3 },
  { id: "rail-team", title: "team", level: 2 },
  { id: "rail-danger", title: "danger zone", level: 2 },
]

const REFERENCE: Section[] = [
  { id: "ref-props", title: "props", level: 2 },
  { id: "ref-items", title: "items", level: 3 },
  { id: "ref-active", title: "activeId", level: 3 },
  { id: "ref-hooks", title: "hooks", level: 2 },
  { id: "ref-collect", title: "collectTableOfContents", level: 3 },
  { id: "ref-styling", title: "styling", level: 2 },
]

const PARAGRAPH =
  "Each section is long enough to scroll past, so the rail has something to follow. The heading you are reading is marked in the rail beside it, and a click on any row brings its heading to the top and moves focus there."

// The item list is the same data the headings are drawn from — nothing is
// read back out of the DOM, so it is in the prerendered HTML.
const toItems = (sections: Section[]): TableOfContentsItem[] =>
  sections.map(({ id, title, level }) => ({ id, title, level }))

function Sections({ sections }: { sections: Section[] }) {
  return sections.map((s) => (
    <section key={s.id} className="flex flex-col gap-3 pb-6">
      <Heading level={s.level} id={s.id} className="scroll-mt-4 outline-none">
        {s.title}
      </Heading>
      <Text>{PARAGRAPH}</Text>
      <Text>{PARAGRAPH}</Text>
    </section>
  ))
}

/** A document in its own scrolling panel: the rail measures against that panel, not the window. */
function PanelDocument({
  sections,
  label,
  side = "end",
  collapsible,
}: {
  sections: Section[]
  label?: string
  side?: "start" | "end"
  collapsible?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)
  const rail = (
    <TableOfContents
      items={toItems(sections)}
      label={label}
      scrollRoot={panel}
      offset={24}
      collapsible={collapsible}
      className="w-56 shrink-0 self-start"
    />
  )
  // The side is the order in the row — layout, not a prop of the rail.
  return (
    <div className="flex w-full gap-8">
      {side === "start" && rail}
      <div className="h-96 min-w-0 flex-1">
        <ScrollArea ref={panel} orientation="vertical" className="pe-2">
          <Sections sections={sections} />
        </ScrollArea>
      </div>
      {side === "end" && rail}
    </div>
  )
}

export const tableOfContentsExamples: ComponentExample[] = [
  {
    title: "A long document",
    description:
      "h2 sections with h3s under them. The flat list is nested by `level`; scroll the panel and the current heading follows.",
    render: () => <PanelDocument sections={GUIDE} label="on this page" />,
  },
  {
    title: "A flat list",
    description:
      "Every entry at one level, and no visible label — the landmark is still named \"On this page\".",
    render: () => <PanelDocument sections={CHANGELOG} />,
  },
  {
    title: "Start-side, collapsible",
    description:
      "The rail on the left of the content, with `collapsible`: the label is a button that folds the list away. The links stay in the HTML while it is closed, and the scroll-spy keeps tracking, so it opens on the current heading.",
    render: () => (
      <PanelDocument sections={REFERENCE} label="on this page" side="start" collapsible />
    ),
  },
  {
    title: "Sticky rail",
    description:
      "`sticky` pins the rail to the top of the page and bounds it to the viewport, so it stays beside the content as the window scrolls.",
    frame: "none",
    render: () => (
      <div className="flex w-full gap-8">
        <div className="min-w-0 flex-1">
          <Sections sections={RAIL} />
        </div>
        <TableOfContents
          items={toItems(RAIL)}
          label="on this page"
          sticky
          className="w-56 shrink-0 self-start"
        />
      </div>
    ),
  },
]
