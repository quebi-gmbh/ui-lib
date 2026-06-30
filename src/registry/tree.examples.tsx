import { Tree, TreeContent, TreeItem } from "@/components/tree"
import type { ComponentExample } from "./types"

interface Node {
  id: string
  name: string
  children?: Node[]
}

const fileTree: Node[] = [
  {
    id: "src",
    name: "src",
    children: [
      {
        id: "components",
        name: "components",
        children: [
          { id: "button", name: "button.tsx" },
          { id: "checkbox", name: "checkbox.tsx" },
          { id: "tree", name: "tree.tsx" },
        ],
      },
      { id: "index", name: "index.ts" },
    ],
  },
  {
    id: "public",
    name: "public",
    children: [{ id: "favicon", name: "favicon.ico" }],
  },
  { id: "package", name: "package.json" },
]

const renderItem = (node: Node) => (
  <TreeItem key={node.id} id={node.id} textValue={node.name}>
    <TreeContent>{node.name}</TreeContent>
    {node.children?.map(renderItem)}
  </TreeItem>
)

export const treeExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A nested file tree with expand/collapse chevrons.",
    render: () => (
      <Tree
        aria-label="Files"
        items={fileTree}
        defaultExpandedKeys={["src", "components"]}
        className="w-72"
      >
        {renderItem}
      </Tree>
    ),
  },
  {
    title: "Single selection",
    description: "Click a row to select it; selected rows get a brand-teal tint.",
    render: () => (
      <Tree
        aria-label="Files"
        items={fileTree}
        selectionMode="single"
        defaultExpandedKeys={["src", "components"]}
        defaultSelectedKeys={["tree"]}
        className="w-72"
      >
        {renderItem}
      </Tree>
    ),
  },
  {
    title: "Multiple selection",
    description: "Multi-select mode shows a checkbox on each row.",
    render: () => (
      <Tree
        aria-label="Files"
        items={fileTree}
        selectionMode="multiple"
        defaultExpandedKeys={["src", "components"]}
        defaultSelectedKeys={["button", "checkbox"]}
        className="w-72"
      >
        {renderItem}
      </Tree>
    ),
  },
]
