import { GridList, GridListItem } from "@/components/grid-list"
import type { OgScene } from "./types"

/** Four rows, one selected. */
export const gridListOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <GridList
      aria-label="Favorite frameworks"
      selectionMode="single"
      defaultSelectedKeys={["react"]}
      className="w-72"
    >
      <GridListItem id="react">React</GridListItem>
      <GridListItem id="solid">Solid</GridListItem>
      <GridListItem id="svelte">Svelte</GridListItem>
      <GridListItem id="vue">Vue</GridListItem>
    </GridList>
  ),
}
