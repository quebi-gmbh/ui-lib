import { Tag, TagGroup, TagList } from "@/components/tag-group"
import type { OgScene } from "./types"

/** Four static pills. */
export const tagGroupOgScene: OgScene = {
  scale: 2,
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
}
