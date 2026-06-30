import { BarList } from "@/components/bar-list"
import type { ComponentExample } from "./types"

const pages = [
  { name: "/home", value: 8420 },
  { name: "/pricing", value: 5310 },
  { name: "/docs", value: 4180 },
  { name: "/blog", value: 2240 },
  { name: "/changelog", value: 980 },
]

export const barListExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Each bar's brand-teal width is scaled to the largest value.",
    render: () => <BarList data={pages} className="w-full max-w-md" />,
  },
  {
    title: "Formatted values",
    description: "Pass valueFormatter to render the value column however you like.",
    render: () => (
      <BarList
        data={pages}
        valueFormatter={(value) => value.toLocaleString()}
        className="w-full max-w-md"
      />
    ),
  },
  {
    title: "Clickable rows",
    description: "Provide onValueChange to make rows interactive — the bar brightens on hover.",
    render: () => (
      <BarList
        data={pages.slice(0, 4)}
        valueFormatter={(value) => value.toLocaleString()}
        onValueChange={() => {}}
        className="w-full max-w-md"
      />
    ),
  },
  {
    title: "Linked names",
    description: "Rows with an href render the name as a sibling Link that opens in a new tab.",
    render: () => (
      <BarList
        data={[
          { name: "react-aria-components", href: "https://react-spectrum.adobe.com", value: 1240 },
          { name: "tailwind-variants", href: "https://www.tailwind-variants.org", value: 860 },
          { name: "tailwind-merge", href: "https://github.com/dcastil/tailwind-merge", value: 540 },
        ]}
        valueFormatter={(value) => value.toLocaleString()}
        className="w-full max-w-md"
      />
    ),
  },
  {
    title: "Ascending order",
    render: () => (
      <BarList
        data={pages}
        sortOrder="ascending"
        valueFormatter={(value) => value.toLocaleString()}
        className="w-full max-w-md"
      />
    ),
  },
]
