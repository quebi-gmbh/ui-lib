import { Tree, TreeContent, TreeItem } from "@/components/tree"
import type { OgScene } from "./types"

interface Node {
  id: string
  name: string
  children?: Node[]
}

const FILES: Node[] = [
  {
    id: "src",
    name: "src",
    children: [
      {
        id: "components",
        name: "components",
        children: [
          { id: "button", name: "button.tsx" },
          { id: "tree", name: "tree.tsx" },
        ],
      },
      { id: "index", name: "index.ts" },
    ],
  },
  { id: "package", name: "package.json" },
]

const renderItem = (node: Node) => (
  <TreeItem key={node.id} id={node.id} textValue={node.name}>
    <TreeContent>{node.name}</TreeContent>
    {node.children?.map(renderItem)}
  </TreeItem>
)

/** Two levels expanded, so the indent and the chevrons are both in the frame. */
export const treeOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <Tree
      aria-label="Files"
      items={FILES}
      defaultExpandedKeys={["src", "components"]}
      className="w-72"
    >
      {renderItem}
    </Tree>
  ),
}
