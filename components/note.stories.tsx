import type { Meta, StoryObj } from "@storybook/react-vite"
import { Note } from "./note"

const meta = {
  title: "Cellestial DS/Components/Note",
  component: Note,
  parameters: { layout: "padded" },
  argTypes: {
    intent: {
      control: "select",
      options: ["default", "info", "success", "warning", "danger"],
    },
    indicator: { control: "boolean" },
    title: { control: "text" },
  },
} satisfies Meta<typeof Note>

export default meta
type Story = StoryObj<typeof meta>

const Column = ({ children }: { children: React.ReactNode }) => (
  <div className="flex max-w-xl flex-col gap-3">{children}</div>
)

export const Variants: Story = {
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
}

export const WithTitle: Story = {
  render: () => (
    <Column>
      <Note intent="info" title="Centrally managed">
        Carriers, devices and plans flow from the catalog. Edits here apply to your storefront only.
      </Note>
      <Note intent="danger" title="Couldn't publish">
        Three plans failed validation. Fix the highlighted prices and publish again.
      </Note>
    </Column>
  ),
}

export const WithoutIndicator: Story = {
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
}

export const RichContent: Story = {
  render: () => (
    <Column>
      <Note intent="warning" title="Action needed">
        <strong>VAT rate changed.</strong> Review affected plans in{" "}
        <a href="#settings">billing settings</a> before your next publish.
      </Note>
    </Column>
  ),
}

export const Playground: Story = {
  args: {
    intent: "info",
    indicator: true,
    title: "",
    children: "We couldn't save this price — check your connection and try again.",
  },
}
