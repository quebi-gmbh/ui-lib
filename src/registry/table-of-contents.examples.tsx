import { useRef } from "react"
import { Heading } from "@/components/heading"
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
  { id: "guide-install", title: "Installation", level: 2 },
  { id: "guide-requirements", title: "Requirements", level: 3 },
  { id: "guide-cli", title: "Using the CLI", level: 3 },
  { id: "guide-usage", title: "Usage", level: 2 },
  { id: "guide-items", title: "Items as data", level: 3 },
  { id: "guide-spy", title: "Scroll-spy", level: 3 },
  { id: "guide-a11y", title: "Accessibility", level: 2 },
  { id: "guide-faq", title: "FAQ", level: 2 },
]

const CHANGELOG: Section[] = [
  { id: "log-2-4", title: "2.4 — Table of contents", level: 2 },
  { id: "log-2-3", title: "2.3 — Quick actions", level: 2 },
  { id: "log-2-2", title: "2.2 — Stat groups", level: 2 },
  { id: "log-2-1", title: "2.1 — Lists", level: 2 },
]

const RAIL: Section[] = [
  { id: "rail-overview", title: "Overview", level: 2 },
  { id: "rail-billing", title: "Billing", level: 2 },
  { id: "rail-invoices", title: "Invoices", level: 3 },
  { id: "rail-tax", title: "Tax details", level: 3 },
  { id: "rail-team", title: "Team", level: 2 },
  { id: "rail-danger", title: "Danger zone", level: 2 },
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
function PanelDocument({ sections, label }: { sections: Section[]; label?: string }) {
  const panel = useRef<HTMLDivElement>(null)
  return (
    <div className="flex w-full gap-8">
      <div ref={panel} className="h-96 min-w-0 flex-1 overflow-y-auto pe-2">
        <Sections sections={sections} />
      </div>
      <TableOfContents
        items={toItems(sections)}
        label={label}
        scrollRoot={panel}
        offset={24}
        className="w-56 shrink-0 self-start"
      />
    </div>
  )
}

export const tableOfContentsExamples: ComponentExample[] = [
  {
    title: "A long document",
    description:
      "h2 sections with h3s under them. The flat list is nested by `level`; scroll the panel and the current heading follows.",
    render: () => <PanelDocument sections={GUIDE} label="On this page" />,
  },
  {
    title: "A flat list",
    description:
      "Every entry at one level, and no visible label — the landmark is still named \"On this page\".",
    render: () => <PanelDocument sections={CHANGELOG} />,
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
          label="On this page"
          sticky
          className="w-56 shrink-0 self-start"
        />
      </div>
    ),
  },
]
