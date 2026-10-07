import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import type { OgScene } from "./types"

/** Three views, one selected — the shape of a single-selection group. */
export const toggleGroupOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <ToggleGroup selectionMode="single" defaultSelectedKeys={["board"]}>
      <ToggleGroupItem id="list">list</ToggleGroupItem>
      <ToggleGroupItem id="board">board</ToggleGroupItem>
      <ToggleGroupItem id="calendar">calendar</ToggleGroupItem>
    </ToggleGroup>
  ),
}
