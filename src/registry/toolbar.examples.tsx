import { useState } from "react"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarItem,
  ToolbarSeparator,
} from "@/components/toolbar"
import type { ComponentExample } from "./types"

const BoldIcon = () => (
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
    <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
    <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
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

const AlignLeftIcon = () => (
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
    <line x1="17" y1="10" x2="3" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="17" y1="18" x2="3" y2="18" />
  </svg>
)

const AlignCenterIcon = () => (
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
    <line x1="18" y1="10" x2="6" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="18" y1="18" x2="6" y2="18" />
  </svg>
)

const AlignRightIcon = () => (
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
    <line x1="21" y1="10" x2="7" y2="10" />
    <line x1="21" y1="6" x2="3" y2="6" />
    <line x1="21" y1="14" x2="3" y2="14" />
    <line x1="21" y1="18" x2="7" y2="18" />
  </svg>
)

const UndoIcon = () => (
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
    <path d="M3 7v6h6" />
    <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
  </svg>
)

const TrashIcon = () => (
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
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </svg>
)

export const toolbarExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A horizontal toolbar grouping text-formatting toggles with a separator.",
    render: () => (
      <Toolbar aria-label="Text formatting">
        <ToolbarGroup aria-label="Style">
          <ToolbarItem size="sq-sm" aria-label="Bold">
            <BoldIcon />
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Italic">
            <ItalicIcon />
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Underline">
            <UnderlineIcon />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup aria-label="Alignment">
          <ToolbarItem size="sq-sm" aria-label="Align left">
            <AlignLeftIcon />
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Align center">
            <AlignCenterIcon />
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Align right">
            <AlignRightIcon />
          </ToolbarItem>
        </ToolbarGroup>
      </Toolbar>
    ),
  },
  {
    title: "Actions and toggles",
    description:
      "ToolbarItem is a toggle, so it reports a pressed state; ToolbarButton is a plain action that does not. Both carry the toolbar's size and intent defaults, so a mixed row lines up without hand-sizing anything.",
    render: () => (
      <Toolbar aria-label="Document">
        <ToolbarGroup aria-label="Style">
          <ToolbarItem size="sq-sm" aria-label="Bold">
            <BoldIcon />
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Italic">
            <ItalicIcon />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarGroup aria-label="Document actions">
          <ToolbarButton size="sq-sm" aria-label="Undo">
            <UndoIcon />
          </ToolbarButton>
          <ToolbarButton>Save</ToolbarButton>
          <ToolbarButton intent="danger">
            <TrashIcon />
            Delete
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
    ),
  },
  {
    title: "With labels",
    description: "Items can carry text alongside (or instead of) icons.",
    render: () => (
      <Toolbar aria-label="Text formatting">
        <ToolbarItem aria-label="Bold">
          <BoldIcon />
          Bold
        </ToolbarItem>
        <ToolbarItem aria-label="Italic">
          <ItalicIcon />
          Italic
        </ToolbarItem>
        <ToolbarItem aria-label="Underline">
          <UnderlineIcon />
          Underline
        </ToolbarItem>
      </Toolbar>
    ),
  },
  {
    title: "Vertical",
    description: "Set orientation to stack items into a vertical rail.",
    render: () => (
      <Toolbar orientation="vertical" aria-label="Text formatting">
        <ToolbarItem size="sq-sm" aria-label="Bold">
          <BoldIcon />
        </ToolbarItem>
        <ToolbarItem size="sq-sm" aria-label="Italic">
          <ItalicIcon />
        </ToolbarItem>
        <ToolbarSeparator />
        <ToolbarItem size="sq-sm" aria-label="Align left">
          <AlignLeftIcon />
        </ToolbarItem>
        <ToolbarItem size="sq-sm" aria-label="Align center">
          <AlignCenterIcon />
        </ToolbarItem>
      </Toolbar>
    ),
  },
  {
    title: "Circle",
    description: "isCircle rounds the toolbar and its items into pill/circle shapes.",
    render: () => (
      <Toolbar isCircle aria-label="Text formatting">
        <ToolbarItem size="sq-sm" aria-label="Bold">
          <BoldIcon />
        </ToolbarItem>
        <ToolbarItem size="sq-sm" aria-label="Italic">
          <ItalicIcon />
        </ToolbarItem>
        <ToolbarItem size="sq-sm" aria-label="Underline">
          <UnderlineIcon />
        </ToolbarItem>
      </Toolbar>
    ),
  },
  {
    title: "Controlled selection",
    description: "ToolbarItem is a toggle — wire its selected state like any controlled toggle.",
    render: function ControlledExample() {
      const [align, setAlign] = useState<"left" | "center" | "right">("left")
      return (
        <Toolbar aria-label="Alignment">
          <ToolbarGroup aria-label="Alignment">
            <ToolbarItem
              size="sq-sm"
              aria-label="Align left"
              isSelected={align === "left"}
              onChange={() => setAlign("left")}
            >
              <AlignLeftIcon />
            </ToolbarItem>
            <ToolbarItem
              size="sq-sm"
              aria-label="Align center"
              isSelected={align === "center"}
              onChange={() => setAlign("center")}
            >
              <AlignCenterIcon />
            </ToolbarItem>
            <ToolbarItem
              size="sq-sm"
              aria-label="Align right"
              isSelected={align === "right"}
              onChange={() => setAlign("right")}
            >
              <AlignRightIcon />
            </ToolbarItem>
          </ToolbarGroup>
        </Toolbar>
      )
    },
  },
  {
    title: "Disabled group",
    description: "A ToolbarGroup can disable all of its items at once.",
    render: () => (
      <Toolbar aria-label="Text formatting">
        <ToolbarGroup isDisabled aria-label="Style">
          <ToolbarItem size="sq-sm" aria-label="Bold">
            <BoldIcon />
          </ToolbarItem>
          <ToolbarItem size="sq-sm" aria-label="Italic">
            <ItalicIcon />
          </ToolbarItem>
        </ToolbarGroup>
      </Toolbar>
    ),
  },
]
