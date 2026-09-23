import {
  Archive,
  BookOpen,
  Copy,
  FilePlus,
  Pencil,
  Share2,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react"
import { useState } from "react"
import { ConfirmProvider, useConfirm } from "@/components/alert-dialog"
import {
  QuickActions,
  QuickActionsContent,
  QuickActionsFab,
  QuickActionsItem,
  QuickActionsSection,
  QuickActionsSeparator,
  QuickActionsTrigger,
} from "@/components/quick-actions"
import type { ComponentExample } from "./types"

const Answer = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-quebi-fg-muted">{children}</p>
)

function HeaderDemo() {
  const [last, setLast] = useState("Nothing picked yet.")
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between border-quebi-line/20 border-b pb-3">
        <span className="font-semibold text-quebi-fg">Q3 roadmap</span>
        <QuickActions>
          <QuickActionsTrigger size="sm">Actions</QuickActionsTrigger>
          <QuickActionsContent onAction={(key) => setLast(`Picked: ${key}`)}>
            <QuickActionsItem id="edit" icon={Pencil} shortcut="E">
              Edit
            </QuickActionsItem>
            <QuickActionsItem id="duplicate" icon={Copy} shortcut="⌘D">
              Duplicate
            </QuickActionsItem>
            <QuickActionsItem id="share" icon={Share2} description="Anyone with the link can view">
              Share
            </QuickActionsItem>
          </QuickActionsContent>
        </QuickActions>
      </div>
      <Answer>{last}</Answer>
    </div>
  )
}

function FabDemo() {
  const [last, setLast] = useState("Nothing picked yet.")
  return (
    // A phone-width frame. The FAB is `fixed` to the viewport by default; here
    // it is pinned to the frame instead so the example stays inside its card.
    <div className="relative h-96 w-full max-w-xs overflow-hidden rounded-quebi-md border border-quebi-line/20 bg-quebi-bg p-4">
      <p className="font-semibold text-quebi-fg">Inbox</p>
      <Answer>{last}</Answer>
      <QuickActions>
        <QuickActionsFab aria-label="Quick actions" className="absolute" />
        <QuickActionsContent side="bottom" onAction={(key) => setLast(`Picked: ${key}`)}>
          <QuickActionsItem id="compose" icon={Pencil}>
            Compose
          </QuickActionsItem>
          <QuickActionsItem id="invite" icon={UserPlus}>
            Invite someone
          </QuickActionsItem>
          <QuickActionsItem id="upload" icon={Upload}>
            Upload a file
          </QuickActionsItem>
        </QuickActionsContent>
      </QuickActions>
    </div>
  )
}

function GroupedDemo() {
  const [last, setLast] = useState("Nothing picked yet.")
  return (
    <div className="flex flex-col items-start gap-3">
      <QuickActions>
        <QuickActionsTrigger>Project actions</QuickActionsTrigger>
        <QuickActionsContent title="Project actions" onAction={(key) => setLast(`Picked: ${key}`)}>
          <QuickActionsSection label="Create">
            <QuickActionsItem id="new-doc" icon={FilePlus} shortcut="⌘N">
              New document
            </QuickActionsItem>
            <QuickActionsItem id="upload" icon={Upload}>
              Upload
            </QuickActionsItem>
          </QuickActionsSection>
          <QuickActionsSection label="Team">
            <QuickActionsItem id="invite" icon={UserPlus} description="By email or link">
              Invite members
            </QuickActionsItem>
            <QuickActionsItem id="share" icon={Share2} isDisabled>
              Share publicly
            </QuickActionsItem>
          </QuickActionsSection>
        </QuickActionsContent>
      </QuickActions>
      <Answer>{last}</Answer>
    </div>
  )
}

function DestructiveDemo() {
  const confirm = useConfirm()
  const [status, setStatus] = useState("Nothing deleted yet.")

  // The panel closes as soon as the item is picked, so the question opens on
  // a clear screen; the await keeps the question and the work in one handler.
  async function onDelete() {
    const confirmed = await confirm({
      title: "Delete this project?",
      description: "This permanently removes the project and all of its documents.",
      confirmLabel: "Delete project",
      intent: "danger",
    })
    setStatus(confirmed ? "Deleted. (Not really: this is a gallery example.)" : "Kept.")
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <QuickActions>
        <QuickActionsTrigger>Actions</QuickActionsTrigger>
        <QuickActionsContent>
          <QuickActionsItem id="archive" icon={Archive} onAction={() => setStatus("Archived.")}>
            Archive
          </QuickActionsItem>
          <QuickActionsSeparator />
          <QuickActionsItem id="delete" icon={Trash2} intent="danger" onAction={onDelete}>
            Delete project
          </QuickActionsItem>
        </QuickActionsContent>
      </QuickActions>
      <Answer>{status}</Answer>
    </div>
  )
}

export const quickActionsExamples: ComponentExample[] = [
  {
    title: "Header trigger",
    description:
      "QuickActionsTrigger is a plain Button for a header or Navbar. The panel comes up from the bottom on a narrow viewport and in from the right on a wide one.",
    render: () => <HeaderDemo />,
  },
  {
    title: "Floating button on a phone",
    description:
      "QuickActionsFab is a round button fixed to the bottom-right corner, clear of the safe-area inset and below the overlay layer. It is what a mobile layout reaches for when the header has no room.",
    render: () => <FabDemo />,
  },
  {
    title: "Grouped sections",
    description:
      "QuickActionsSection gives a group its heading; `title` names the panel. Items take a description, a shortcut hint, and `isDisabled`.",
    render: () => <GroupedDemo />,
  },
  {
    title: "A destructive action asks first",
    description:
      "`intent=\"danger\"` marks it; `await confirm(...)` from useConfirm() asks the question once the panel has closed. Never window.confirm().",
    render: () => (
      <ConfirmProvider>
        <DestructiveDemo />
      </ConfirmProvider>
    ),
  },
  {
    title: "A link action",
    description:
      "An item with `href` is a link: it navigates, and closes the panel like any other action.",
    render: () => (
      <QuickActions>
        <QuickActionsTrigger>Help</QuickActionsTrigger>
        <QuickActionsContent title="Help">
          <QuickActionsItem
            id="docs"
            icon={BookOpen}
            href="/components/command-menu"
            description="When the list needs a search field"
          >
            Read about Command Menu
          </QuickActionsItem>
        </QuickActionsContent>
      </QuickActions>
    ),
  },
]
