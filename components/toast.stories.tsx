import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import { Toast, toast } from "./toast"

const meta = {
  title: "Cellestial DS/Components/Toast",
  component: Toast,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

function timestamp() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-2">{children}</div>
)

export const Autosave: Story = {
  render: () => (
    <div>
      <p className="text-ink-600 text-body-s mb-3">
        Autosave toasts replace explicit "Save" buttons. Keep copy specific — include the timestamp.
      </p>
      <Row>
        <Button intent="primary" onPress={() => toast(`Changes autosaved · ${timestamp()}`)}>
          Trigger autosave toast
        </Button>
      </Row>
      <Toast position="bottom-right" />
    </div>
  ),
}

export const StatusToasts: Story = {
  render: () => (
    <div>
      <Row>
        <Button intent="outline" onPress={() => toast.success("Catalog synced · 24 plans updated")}>
          Success
        </Button>
        <Button
          intent="outline"
          onPress={() => toast.warning("One device is missing a product image")}
        >
          Warning
        </Button>
        <Button intent="outline" onPress={() => toast.error("Stripe webhook failed — retry in 2m")}>
          Error
        </Button>
        <Button
          intent="outline"
          onPress={() => toast.info("Tabular numerals line up in price columns")}
        >
          Info
        </Button>
      </Row>
      <Toast position="bottom-right" richColors />
    </div>
  ),
}
