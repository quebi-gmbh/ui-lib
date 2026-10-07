import { LinkToggleGroup } from "@/components/link-toggle-group"
import type { OgScene } from "./types"

/** A segmented control whose segments are addresses. */
export const linkToggleGroupOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <LinkToggleGroup
      ariaLabel="Calendar range"
      current="week"
      options={[
        { value: "day", label: "day", href: "#day" },
        { value: "week", label: "week", href: "#week" },
        { value: "month", label: "month", href: "#month" },
      ]}
    />
  ),
}
