import { Eyebrow } from "@/components/eyebrow"
import { IndexList } from "@/components/index-list"
import type { ComponentExample } from "./types"

const work = [
  { title: "quebi cloud", meta: "workspace", href: "#" },
  { title: "klartex", meta: "collaborative latex editor", href: "#" },
  { title: "equana", meta: "matlab to typescript", href: "#" },
  { title: "robi", meta: "measurement instruments", href: "#" },
]

export const indexListExamples: ComponentExample[] = [
  {
    title: "Selected work",
    description:
      "A display-s heading and an eyebrow count above it. Every row is a link: it shifts right and lifts on hover.",
    frame: "none",
    render: () => (
      <div className="w-full">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="m-0 font-display text-quebi-display-s text-quebi-fg">selected work</h2>
          <Eyebrow as="span">04 entries</Eyebrow>
        </div>
        <IndexList items={work} />
      </div>
    ),
  },
  {
    title: "Static rows",
    description: "Without an href a row is plain text and does not move on hover.",
    frame: "none",
    render: () => (
      <IndexList
        className="w-full"
        items={[
          { title: "discovery", meta: "two weeks" },
          { title: "first release", meta: "six weeks" },
          { title: "production", meta: "ongoing" },
        ]}
      />
    ),
  },
  {
    title: "Custom numbers",
    description: "`number` replaces the zero-padded position — a year, an issue, a letter.",
    frame: "none",
    render: () => (
      <IndexList
        className="w-full"
        items={[
          { number: "2025", title: "klartex", meta: "editor", href: "#" },
          { number: "2024", title: "equana", meta: "transpiler", href: "#" },
          { number: "2023", title: "robi instruments", meta: "hardware + web", href: "#" },
        ]}
      />
    ),
  },
]
