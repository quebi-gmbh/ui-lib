import { TagField } from "@/components/tag-field"
import type { OgScene } from "./types"

/** Three tags already in the box, because an empty one is just an Input. */
export const tagFieldOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <TagField
      label="Tags"
      placeholder="Add a tag…"
      defaultValue={["kiosk", "checkout", "beta"]}
      className="w-80"
    />
  ),
}
