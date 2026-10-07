import { Button } from "@/components/button"
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/sheet"
import type { ComponentExample } from "./types"

export const sheetExamples: ComponentExample[] = [
  {
    title: "Right (default)",
    description: "A panel that slides in from the right edge — good for detail editing.",
    render: () => (
      <Sheet>
        <Button intent="outline">edit pricing</Button>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>edit pricing — Essentials 20</SheetTitle>
            <SheetDescription>
              Changes autosave. Customers see the updated price on their next session.
            </SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p className="text-sm text-quebi-fg-muted">Pricing fields go here.</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose intent="outline">close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
  },
  {
    title: "Bottom",
    description: "A panel that slides up from the bottom edge — good for filters on mobile.",
    render: () => (
      <Sheet>
        <Button intent="outline">filter devices</Button>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>filter devices</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <p className="text-sm text-quebi-fg-muted">Filter controls go here.</p>
          </SheetBody>
          <SheetFooter>
            <SheetClose intent="outline">cancel</SheetClose>
            <Button intent="primary">apply filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    ),
  },
  {
    title: "Left",
    description: "A navigation drawer sliding in from the left edge.",
    render: () => (
      <Sheet>
        <Button intent="outline">open menu</Button>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>navigation</SheetTitle>
            <SheetDescription>Jump to any section of the workspace.</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <nav className="flex flex-col gap-2 text-sm text-quebi-fg-muted">
              <span>dashboard</span>
              <span>devices</span>
              <span>billing</span>
              <span>settings</span>
            </nav>
          </SheetBody>
        </SheetContent>
      </Sheet>
    ),
  },
]
