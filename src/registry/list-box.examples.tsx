import { Folder, Image, Music } from "lucide-react"
import {
  ListBox,
  ListBoxDescription,
  ListBoxItem,
  ListBoxLabel,
  ListBoxSection,
} from "@/components/list-box"
import type { ComponentExample } from "./types"

export const listBoxExamples: ComponentExample[] = [
  {
    title: "Single selection",
    description: "Pick one row; the selected item is marked with an ink check.",
    render: () => (
      <ListBox aria-label="View" selectionMode="single" defaultSelectedKeys={["board"]}>
        <ListBoxItem id="list">list</ListBoxItem>
        <ListBoxItem id="board">board</ListBoxItem>
        <ListBoxItem id="calendar">calendar</ListBoxItem>
        <ListBoxItem id="timeline">timeline</ListBoxItem>
      </ListBox>
    ),
  },
  {
    title: "Multiple selection",
    description: "Allow selecting several rows at once.",
    render: () => (
      <ListBox
        aria-label="Tags"
        selectionMode="multiple"
        defaultSelectedKeys={["design", "eng"]}
      >
        <ListBoxItem id="design">design</ListBoxItem>
        <ListBoxItem id="eng">engineering</ListBoxItem>
        <ListBoxItem id="product">product</ListBoxItem>
        <ListBoxItem id="sales">sales</ListBoxItem>
      </ListBox>
    ),
  },
  {
    title: "Icons & descriptions",
    description: "Each row can carry a leading icon and a secondary description line.",
    render: () => (
      <ListBox aria-label="Media" selectionMode="single" defaultSelectedKeys={["photos"]}>
        <ListBoxItem id="photos" textValue="Photos">
          <Image data-slot="icon" />
          <ListBoxLabel>photos</ListBoxLabel>
          <ListBoxDescription>1,204 items</ListBoxDescription>
        </ListBoxItem>
        <ListBoxItem id="music" textValue="Music">
          <Music data-slot="icon" />
          <ListBoxLabel>music</ListBoxLabel>
          <ListBoxDescription>312 tracks</ListBoxDescription>
        </ListBoxItem>
        <ListBoxItem id="files" textValue="Files">
          <Folder data-slot="icon" />
          <ListBoxLabel>files</ListBoxLabel>
          <ListBoxDescription>48 documents</ListBoxDescription>
        </ListBoxItem>
      </ListBox>
    ),
  },
  {
    title: "Sections",
    description: "Group related rows under titled sections.",
    render: () => (
      <ListBox aria-label="Workspaces" selectionMode="single" defaultSelectedKeys={["acme"]}>
        <ListBoxSection title="personal">
          <ListBoxItem id="me">my workspace</ListBoxItem>
          <ListBoxItem id="drafts">drafts</ListBoxItem>
        </ListBoxSection>
        <ListBoxSection title="teams">
          <ListBoxItem id="acme">Acme Inc.</ListBoxItem>
          <ListBoxItem id="globex">Globex</ListBoxItem>
        </ListBoxSection>
      </ListBox>
    ),
  },
  {
    title: "Disabled items",
    description: "Individual rows can be disabled.",
    render: () => (
      <ListBox
        aria-label="Plans"
        selectionMode="single"
        disabledKeys={["enterprise"]}
        defaultSelectedKeys={["pro"]}
      >
        <ListBoxItem id="free">free</ListBoxItem>
        <ListBoxItem id="pro">pro</ListBoxItem>
        <ListBoxItem id="enterprise">enterprise (contact sales)</ListBoxItem>
      </ListBox>
    ),
  },
]
