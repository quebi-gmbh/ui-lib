import { Button } from "@/components/button"
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/popover"
import type { ComponentExample } from "./types"

export const popoverExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A trigger opens a popover with header, body, and footer.",
    render: () => (
      <Popover>
        <PopoverTrigger>open popover</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>workspace</PopoverTitle>
            <PopoverDescription>Manage members and projects.</PopoverDescription>
          </PopoverHeader>
          <PopoverBody>
            <p className="text-sm text-quebi-fg-muted">
              Invite teammates to collaborate on everything in this workspace.
            </p>
          </PopoverBody>
          <PopoverFooter>
            <PopoverClose intent="outline">close</PopoverClose>
            <Button intent="primary">invite</Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    ),
  },
  {
    title: "With arrow",
    description: "Set `arrow` to render an anchor arrow pointing at the trigger.",
    render: () => (
      <Popover>
        <PopoverTrigger intent="outline">details</PopoverTrigger>
        <PopoverContent arrow>
          <PopoverHeader
            title="quick details"
            description="This popover points back at its trigger."
          />
          <PopoverBody>
            <p className="text-sm text-quebi-fg-muted">
              The arrow follows the placement automatically.
            </p>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    ),
  },
  {
    title: "Simple content",
    description: "PopoverContent accepts arbitrary children — no slots required.",
    render: () => (
      <Popover>
        <PopoverTrigger intent="ghost">help</PopoverTrigger>
        <PopoverContent className="max-w-sm">
          <div className="p-4">
            <p className="font-medium text-sm text-quebi-fg">Need a hand?</p>
            <p className="mt-1 text-sm text-quebi-fg-muted">
              Reach out to support any time and we will get back to you within a day.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    ),
  },
]
