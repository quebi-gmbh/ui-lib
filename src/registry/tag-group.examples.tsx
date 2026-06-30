import { useState } from "react"
import type { Selection } from "react-aria-components"
import { Tag, TagGroup, TagList } from "@/components/tag-group"
import type { ComponentExample } from "./types"

export const tagGroupExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A simple set of static tag pills.",
    render: () => (
      <TagGroup aria-label="Technologies">
        <TagList>
          <Tag>React</Tag>
          <Tag>TypeScript</Tag>
          <Tag>Tailwind</Tag>
          <Tag>react-aria</Tag>
        </TagList>
      </TagGroup>
    ),
  },
  {
    title: "Selection",
    description: "Single-select tags; the active tag fills with brand teal.",
    render: () => (
      <TagGroup aria-label="Filter" selectionMode="single" defaultSelectedKeys={["all"]}>
        <TagList>
          <Tag id="all">All</Tag>
          <Tag id="active">Active</Tag>
          <Tag id="archived">Archived</Tag>
        </TagList>
      </TagGroup>
    ),
  },
  {
    title: "Removable",
    description: "Tags with a remove button, driven by controlled state.",
    render: () => {
      const RemovableExample = () => {
        const [items, setItems] = useState([
          { id: "design", name: "Design" },
          { id: "eng", name: "Engineering" },
          { id: "product", name: "Product" },
        ])
        return (
          <TagGroup
            aria-label="Teams"
            onRemove={(keys) => setItems((prev) => prev.filter((i) => !keys.has(i.id)))}
          >
            <TagList items={items}>{(item) => <Tag>{item.name}</Tag>}</TagList>
          </TagGroup>
        )
      }
      return <RemovableExample />
    },
  },
  {
    title: "Multiple selection",
    render: () => {
      const MultiExample = () => {
        const [selected, setSelected] = useState<Selection>(new Set(["js"]))
        return (
          <TagGroup
            aria-label="Languages"
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={setSelected}
          >
            <TagList>
              <Tag id="js">JavaScript</Tag>
              <Tag id="py">Python</Tag>
              <Tag id="go">Go</Tag>
              <Tag id="rs">Rust</Tag>
            </TagList>
          </TagGroup>
        )
      }
      return <MultiExample />
    },
  },
  {
    title: "Disabled",
    render: () => (
      <TagGroup aria-label="Statuses" selectionMode="single" disabledKeys={["pending"]}>
        <TagList>
          <Tag id="ready">Ready</Tag>
          <Tag id="pending">Pending</Tag>
          <Tag id="done">Done</Tag>
        </TagList>
      </TagGroup>
    ),
  },
]
