import { Button } from "@/components/button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer"
import type { ComponentExample } from "./types"

/**
 * Drawer is composed from a `Drawer` (react-aria DialogTrigger) wrapping a
 * `DrawerTrigger` and a `DrawerContent`. `DrawerContent` accepts a `side` to
 * choose the edge it slides from and can be dismissed by dragging.
 */
export const drawerExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A bottom drawer with a notch, header, body, and footer.",
    render: () => (
      <Drawer>
        <DrawerTrigger>
          <Button>Open drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Mobile menu</DrawerTitle>
            <DrawerDescription>Drag down or tap a button to dismiss.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-sm text-quebi-fg-muted">
              Drawers slide in from an edge and support drag-to-dismiss gestures, making them
              well-suited to mobile-first surfaces.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose intent="outline">Cancel</DrawerClose>
            <Button intent="primary">Continue</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
  },
  {
    title: "From the right",
    description: "Set `side` to slide the panel in from any edge.",
    render: () => (
      <Drawer>
        <DrawerTrigger>
          <Button intent="outline">Open settings</Button>
        </DrawerTrigger>
        <DrawerContent side="right" notch={false}>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Manage your workspace preferences.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-sm text-quebi-fg-muted">
              A right-side drawer is a common pattern for detail panels and configuration.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose intent="ghost">Close</DrawerClose>
            <Button intent="primary">Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
  },
  {
    title: "Floating",
    description: "`isFloat` insets the panel from the edges with rounded corners.",
    render: () => (
      <Drawer>
        <DrawerTrigger>
          <Button intent="secondary">Open floating</Button>
        </DrawerTrigger>
        <DrawerContent side="left" isFloat notch={false}>
          <DrawerHeader>
            <DrawerTitle>Navigation</DrawerTitle>
            <DrawerDescription>A floating left drawer.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-sm text-quebi-fg-muted">
              Floating drawers detach from the viewport edge and pick up the quebi glow.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose intent="outline">Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
  },
]
