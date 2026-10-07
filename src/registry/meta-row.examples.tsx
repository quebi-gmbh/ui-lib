import { MetaRow } from "@/components/meta-row"
import type { ComponentExample } from "./types"

export const metaRowExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Three pairs, all lowercase.",
    render: () => (
      <MetaRow
        items={[
          { term: "studio", value: "quebi GmbH" },
          { term: "people", value: "2" },
          { term: "practice", value: "full-stack" },
        ]}
      />
    ),
  },
  {
    title: "Under a project title",
    description: "The row wraps on a narrow screen rather than shrinking.",
    render: () => (
      <div className="grid w-full gap-4">
        <h2 className="m-0 font-display text-quebi-display-s text-quebi-fg">klartex</h2>
        <MetaRow
          items={[
            { term: "client", value: "internal" },
            { term: "year", value: "2025" },
            { term: "stack", value: "typescript, cloudflare" },
            { term: "role", value: "design and build" },
          ]}
        />
      </div>
    ),
  },
]
