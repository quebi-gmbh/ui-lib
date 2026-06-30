import { Separator } from "@/components/separator"
import type { ComponentExample } from "./types"

export const separatorExamples: ComponentExample[] = [
  {
    title: "Horizontal",
    description: "The default. A full-width hairline that splits stacked content.",
    render: () => (
      <div className="w-full max-w-sm">
        <p className="text-sm text-white">Account</p>
        <Separator className="my-3" />
        <p className="text-sm text-quebi-fg-muted">Manage your account settings and preferences.</p>
      </div>
    ),
  },
  {
    title: "Vertical",
    description: "Set orientation to vertical to divide items in a row.",
    render: () => (
      <div className="flex h-5 items-center gap-3 text-sm text-quebi-fg-muted">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>API</span>
        <Separator orientation="vertical" />
        <span>Support</span>
      </div>
    ),
  },
  {
    title: "In a list",
    description: "Hairlines between rows keep dense content legible.",
    render: () => (
      <div className="w-full max-w-sm rounded-quebi-md border border-cyan-500/10 p-4">
        <div className="flex flex-col gap-3">
          <span className="text-sm text-white">First item</span>
          <Separator />
          <span className="text-sm text-white">Second item</span>
          <Separator />
          <span className="text-sm text-white">Third item</span>
        </div>
      </div>
    ),
  },
]
