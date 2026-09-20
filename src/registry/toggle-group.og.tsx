import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import type { OgScene } from "./types"

/** Three views, one selected — the shape of a single-selection group. */
export const toggleGroupOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <ToggleGroup selectionMode="single" defaultSelectedKeys={["board"]}>
      <ToggleGroupItem id="list">List</ToggleGroupItem>
      <ToggleGroupItem id="board">Board</ToggleGroupItem>
      <ToggleGroupItem id="calendar">Calendar</ToggleGroupItem>
    </ToggleGroup>
  ),
}
