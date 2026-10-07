import { ListBox, ListBoxItem } from "@/components/list-box"
import type { OgScene } from "./types"

/** Four rows, one selected — marked with an ink check. */
export const listBoxOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <ListBox
      aria-label="View"
      selectionMode="single"
      defaultSelectedKeys={["board"]}
      className="w-64"
    >
      <ListBoxItem id="list">list</ListBoxItem>
      <ListBoxItem id="board">board</ListBoxItem>
      <ListBoxItem id="calendar">calendar</ListBoxItem>
      <ListBoxItem id="timeline">timeline</ListBoxItem>
    </ListBox>
  ),
}
