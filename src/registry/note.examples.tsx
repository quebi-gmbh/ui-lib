import { Note } from "@/components/note"
import type { ComponentExample } from "./types"

const Column = ({ children }: { children: React.ReactNode }) => (
  <div className="flex max-w-xl flex-col gap-3">{children}</div>
)

export const noteExamples: ComponentExample[] = [
  {
    title: "Intents",
    description: "Five intents — neutral default plus info, success, warning and danger.",
    render: () => (
      <Column>
        <Note intent="default">
          Heads up — this plan is still a draft and isn't live on any kiosk yet.
        </Note>
        <Note intent="info">
          Pricing for this carrier is managed centrally and syncs automatically.
        </Note>
        <Note intent="success">
          Changes autosaved · 14:02. Your kiosk will pick them up within a minute.
        </Note>
        <Note intent="warning">
          Two devices in this bundle are out of stock — customers can't complete checkout.
        </Note>
        <Note intent="danger">
          We couldn't save this price — check your connection and try again.
        </Note>
      </Column>
    ),
  },
  {
    title: "With title",
    description: "A bold heading sits above the body content.",
    render: () => (
      <Column>
        <Note intent="info" title="Centrally managed">
          Carriers, devices and plans flow from the catalog. Edits here apply to your storefront
          only.
        </Note>
        <Note intent="danger" title="Couldn't publish">
          Three plans failed validation. Fix the highlighted prices and publish again.
        </Note>
      </Column>
    ),
  },
  {
    title: "Without indicator",
    description: "Drop the leading status icon for a quieter inline note.",
    render: () => (
      <Column>
        <Note intent="success" indicator={false}>
          Changes autosaved · 14:02.
        </Note>
        <Note intent="info" indicator={false}>
          This device is system-managed and can't be edited.
        </Note>
      </Column>
    ),
  },
  {
    title: "Rich content",
    description: "Bodies accept inline markup like links and emphasis.",
    render: () => (
      <Column>
        <Note intent="warning" title="Action needed">
          <strong>VAT rate changed.</strong> Review affected plans in{" "}
          <a href="#settings">billing settings</a> before your next publish.
        </Note>
      </Column>
    ),
  },
]
