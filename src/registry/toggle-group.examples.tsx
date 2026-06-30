import { useState } from "react"
import type { Key } from "react-aria-components"
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import type { ComponentExample } from "./types"

const BoldIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
    <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
  </svg>
)

const ItalicIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
)

const UnderlineIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <line x1="4" y1="20" x2="20" y2="20" />
  </svg>
)

export const toggleGroupExamples: ComponentExample[] = [
  {
    title: "Single selection",
    description: "Exactly one item active at a time — items float with a small gutter.",
    render: () => (
      <ToggleGroup selectionMode="single" defaultSelectedKeys={["list"]}>
        <ToggleGroupItem id="list">List</ToggleGroupItem>
        <ToggleGroupItem id="board">Board</ToggleGroupItem>
        <ToggleGroupItem id="calendar">Calendar</ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  {
    title: "Multiple selection",
    description: "Many items active at once — items butt together into a segmented bar.",
    render: () => (
      <ToggleGroup selectionMode="multiple" defaultSelectedKeys={["bold"]} aria-label="Text format">
        <ToggleGroupItem id="bold" size="sq-md" aria-label="Bold">
          <BoldIcon />
        </ToggleGroupItem>
        <ToggleGroupItem id="italic" size="sq-md" aria-label="Italic">
          <ItalicIcon />
        </ToggleGroupItem>
        <ToggleGroupItem id="underline" size="sq-md" aria-label="Underline">
          <UnderlineIcon />
        </ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  {
    title: "Sizes",
    render: () => (
      <div className="flex flex-col items-start gap-3">
        <ToggleGroup size="xs" defaultSelectedKeys={["a"]}>
          <ToggleGroupItem id="a">Extra small</ToggleGroupItem>
          <ToggleGroupItem id="b">Option</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup size="sm" defaultSelectedKeys={["a"]}>
          <ToggleGroupItem id="a">Small</ToggleGroupItem>
          <ToggleGroupItem id="b">Option</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup size="md" defaultSelectedKeys={["a"]}>
          <ToggleGroupItem id="a">Default</ToggleGroupItem>
          <ToggleGroupItem id="b">Option</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup size="lg" defaultSelectedKeys={["a"]}>
          <ToggleGroupItem id="a">Large</ToggleGroupItem>
          <ToggleGroupItem id="b">Option</ToggleGroupItem>
        </ToggleGroup>
      </div>
    ),
  },
  {
    title: "Vertical",
    description: "Stack the group along the vertical axis.",
    render: () => (
      <ToggleGroup orientation="vertical" selectionMode="single" defaultSelectedKeys={["day"]}>
        <ToggleGroupItem id="day">Day</ToggleGroupItem>
        <ToggleGroupItem id="week">Week</ToggleGroupItem>
        <ToggleGroupItem id="month">Month</ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  {
    title: "Pill",
    description: "Fully rounded with isCircle for a softer, segmented pill.",
    render: () => (
      <ToggleGroup selectionMode="multiple" isCircle defaultSelectedKeys={["wifi"]}>
        <ToggleGroupItem id="wifi">Wi-Fi</ToggleGroupItem>
        <ToggleGroupItem id="bt">Bluetooth</ToggleGroupItem>
        <ToggleGroupItem id="air">Airplane</ToggleGroupItem>
      </ToggleGroup>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const [selected, setSelected] = useState<Set<Key>>(new Set(["grid"]))
      return (
        <div className="flex flex-col items-start gap-3">
          <ToggleGroup
            selectionMode="single"
            selectedKeys={selected}
            onSelectionChange={setSelected}
          >
            <ToggleGroupItem id="grid">Grid</ToggleGroupItem>
            <ToggleGroupItem id="rows">Rows</ToggleGroupItem>
            <ToggleGroupItem id="gallery">Gallery</ToggleGroupItem>
          </ToggleGroup>
          <p className="text-sm text-quebi-fg-subtle">
            View: {[...selected][0] ?? "none"}
          </p>
        </div>
      )
    },
  },
  {
    title: "Disabled",
    render: () => (
      <ToggleGroup selectionMode="single" defaultSelectedKeys={["one"]} isDisabled>
        <ToggleGroupItem id="one">One</ToggleGroupItem>
        <ToggleGroupItem id="two">Two</ToggleGroupItem>
        <ToggleGroupItem id="three">Three</ToggleGroupItem>
      </ToggleGroup>
    ),
  },
]
