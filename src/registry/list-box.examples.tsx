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
    description: "Pick one row; the selected item fills with brand teal and a check.",
    render: () => (
      <ListBox aria-label="View" selectionMode="single" defaultSelectedKeys={["board"]}>
        <ListBoxItem id="list">List</ListBoxItem>
        <ListBoxItem id="board">Board</ListBoxItem>
        <ListBoxItem id="calendar">Calendar</ListBoxItem>
        <ListBoxItem id="timeline">Timeline</ListBoxItem>
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
        <ListBoxItem id="design">Design</ListBoxItem>
        <ListBoxItem id="eng">Engineering</ListBoxItem>
        <ListBoxItem id="product">Product</ListBoxItem>
        <ListBoxItem id="sales">Sales</ListBoxItem>
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
          <ListBoxLabel>Photos</ListBoxLabel>
          <ListBoxDescription>1,204 items</ListBoxDescription>
        </ListBoxItem>
        <ListBoxItem id="music" textValue="Music">
          <Music data-slot="icon" />
          <ListBoxLabel>Music</ListBoxLabel>
          <ListBoxDescription>312 tracks</ListBoxDescription>
        </ListBoxItem>
        <ListBoxItem id="files" textValue="Files">
          <Folder data-slot="icon" />
          <ListBoxLabel>Files</ListBoxLabel>
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
        <ListBoxSection title="Personal">
          <ListBoxItem id="me">My workspace</ListBoxItem>
          <ListBoxItem id="drafts">Drafts</ListBoxItem>
        </ListBoxSection>
        <ListBoxSection title="Teams">
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
        <ListBoxItem id="free">Free</ListBoxItem>
        <ListBoxItem id="pro">Pro</ListBoxItem>
        <ListBoxItem id="enterprise">Enterprise (contact sales)</ListBoxItem>
      </ListBox>
    ),
  },
]
