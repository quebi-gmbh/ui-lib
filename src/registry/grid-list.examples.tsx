import {
  GridList,
  GridListDescription,
  GridListItem,
  GridListLabel,
} from "@/components/grid-list"
import type { ComponentExample } from "./types"

export const gridListExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A single-selection list. Click or use the keyboard to select a row.",
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
  },
  {
    title: "Multiple selection",
    description: "selectionMode=\"multiple\" renders a checkbox on each row.",
    render: () => (
      <GridList
        aria-label="Permissions"
        selectionMode="multiple"
        defaultSelectedKeys={["read"]}
        className="w-72"
      >
        <GridListItem id="read">Read</GridListItem>
        <GridListItem id="write">Write</GridListItem>
        <GridListItem id="admin">Administer</GridListItem>
      </GridList>
    ),
  },
  {
    title: "Label and description",
    description: "Compose rows with GridListLabel and GridListDescription.",
    render: () => (
      <GridList aria-label="Team" selectionMode="single" className="w-80">
        <GridListItem id="ada" textValue="Ada Lovelace">
          <div className="flex min-w-0 flex-col">
            <GridListLabel>Ada Lovelace</GridListLabel>
            <GridListDescription>ada@quebi.de</GridListDescription>
          </div>
        </GridListItem>
        <GridListItem id="alan" textValue="Alan Turing">
          <div className="flex min-w-0 flex-col">
            <GridListLabel>Alan Turing</GridListLabel>
            <GridListDescription>alan@quebi.de</GridListDescription>
          </div>
        </GridListItem>
      </GridList>
    ),
  },
  {
    title: "Disabled item",
    description: "Disabled rows are dimmed and not selectable.",
    render: () => (
      <GridList
        aria-label="Plans"
        selectionMode="single"
        disabledKeys={["enterprise"]}
        className="w-72"
      >
        <GridListItem id="free">Free</GridListItem>
        <GridListItem id="pro">Pro</GridListItem>
        <GridListItem id="enterprise">Enterprise (coming soon)</GridListItem>
      </GridList>
    ),
  },
]
