import { Button } from "@/components/button"
import { ToastProvider, useToast } from "@/components/toast"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

function timestamp() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function AutosaveDemo() {
  const toast = useToast()
  return (
    <Row>
      <Button intent="primary" onPress={() => toast({ title: `Changes autosaved · ${timestamp()}` })}>
        Trigger autosave toast
      </Button>
    </Row>
  )
}

function StatusDemo() {
  const toast = useToast()
  return (
    <Row>
      <Button intent="outline" onPress={() => toast.success("Catalog synced · 24 plans updated")}>
        Success
      </Button>
      <Button intent="outline" onPress={() => toast.warning("One device is missing a product image")}>
        Warning
      </Button>
      <Button intent="outline" onPress={() => toast.error("Stripe webhook failed — retry in 2m")}>
        Error
      </Button>
      <Button intent="outline" onPress={() => toast.info("Tabular numerals line up in price columns")}>
        Info
      </Button>
    </Row>
  )
}

function DescriptionDemo() {
  const toast = useToast()
  return (
    <Row>
      <Button
        intent="primary"
        onPress={() =>
          toast.success("Invoice sent", {
            description: "Receipt emailed to billing@acme.com · due in 14 days",
          })
        }
      >
        Toast with description
      </Button>
    </Row>
  )
}

function PersistentDemo() {
  const toast = useToast()
  return (
    <Row>
      <Button
        intent="accent"
        onPress={() =>
          toast.warning("Sync paused — reconnect to resume", { duration: 0 })
        }
      >
        Persistent toast
      </Button>
    </Row>
  )
}

export const toastExamples: ComponentExample[] = [
  {
    title: "Autosave",
    description:
      "Default toast for autosave confirmations. Keep copy specific — include the timestamp.",
    render: () => (
      <ToastProvider position="bottom-right">
        <AutosaveDemo />
      </ToastProvider>
    ),
  },
  {
    title: "Status intents",
    description: "Success / warning / error / info map to the quebi status ramps.",
    render: () => (
      <ToastProvider position="bottom-right">
        <StatusDemo />
      </ToastProvider>
    ),
  },
  {
    title: "With description",
    description: "A bold title with a muted secondary line below.",
    render: () => (
      <ToastProvider position="bottom-right">
        <DescriptionDemo />
      </ToastProvider>
    ),
  },
  {
    title: "Persistent",
    description: "Pass duration={0} to keep a toast until it is dismissed.",
    render: () => (
      <ToastProvider position="bottom-right">
        <PersistentDemo />
      </ToastProvider>
    ),
  },
]
