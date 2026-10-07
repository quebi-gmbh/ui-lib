import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/tooltip"
import type { ComponentExample } from "./types"

const TriggerButton = ({ children }: { children: React.ReactNode }) => (
  <TooltipTrigger className="cursor-pointer rounded-(--q-radius-control) border border-quebi-hairline bg-transparent px-4 py-2 font-medium text-quebi-fg text-sm outline-none transition-colors duration-150 hover:bg-quebi-raised focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg">
    {children}
  </TooltipTrigger>
)

export const tooltipExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Hover or focus the trigger to reveal the tooltip.",
    render: () => (
      <Tooltip>
        <TriggerButton>hover me</TriggerButton>
        <TooltipContent>Quebi keeps your roster in sync.</TooltipContent>
      </Tooltip>
    ),
  },
  {
    title: "Placements",
    description: "The arrow re-orients itself to the chosen side.",
    render: () => (
      <div className="flex flex-wrap items-center gap-3">
        <Tooltip>
          <TriggerButton>top</TriggerButton>
          <TooltipContent placement="top">Above the trigger</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TriggerButton>right</TriggerButton>
          <TooltipContent placement="right">Right of the trigger</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TriggerButton>bottom</TriggerButton>
          <TooltipContent placement="bottom">Below the trigger</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TriggerButton>left</TriggerButton>
          <TooltipContent placement="left">Left of the trigger</TooltipContent>
        </Tooltip>
      </div>
    ),
  },
  {
    title: "Without arrow",
    description: "Pass arrow={false} for a plain panel.",
    render: () => (
      <Tooltip>
        <TriggerButton>no arrow</TriggerButton>
        <TooltipContent arrow={false}>A plain panel, no arrow.</TooltipContent>
      </Tooltip>
    ),
  },
  {
    title: "Rich content",
    description: "Tooltips accept arbitrary markup, not just plain strings.",
    render: () => (
      <Tooltip>
        <TriggerButton>details</TriggerButton>
        <TooltipContent>
          <strong>Last synced</strong>
          <div className="text-muted">2 minutes ago</div>
        </TooltipContent>
      </Tooltip>
    ),
  },
]
