import { ListBox, ListBoxItem } from "@/components/list-box"
import type { OgScene } from "./types"

/** Four rows, one selected — teal fill and a check. */
export const listBoxOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <ListBox
      aria-label="View"
      selectionMode="single"
      defaultSelectedKeys={["board"]}
      className="w-64"
    >
      <ListBoxItem id="list">List</ListBoxItem>
      <ListBoxItem id="board">Board</ListBoxItem>
      <ListBoxItem id="calendar">Calendar</ListBoxItem>
      <ListBoxItem id="timeline">Timeline</ListBoxItem>
    </ListBox>
  ),
}
