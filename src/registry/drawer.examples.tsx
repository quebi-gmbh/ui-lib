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
        <DrawerTrigger>open drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>mobile menu</DrawerTitle>
            <DrawerDescription>Drag down or tap a button to dismiss.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-sm text-quebi-fg-muted">
              Drawers slide in from an edge and support drag-to-dismiss gestures, making them
              well-suited to mobile-first surfaces.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose intent="outline">cancel</DrawerClose>
            <Button intent="primary">continue</Button>
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
        <DrawerTrigger intent="outline">open settings</DrawerTrigger>
        <DrawerContent side="right" notch={false}>
          <DrawerHeader>
            <DrawerTitle>settings</DrawerTitle>
            <DrawerDescription>Manage your workspace preferences.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-sm text-quebi-fg-muted">
              A right-side drawer is a common pattern for detail panels and configuration.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose intent="ghost">close</DrawerClose>
            <Button intent="primary">save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
  },
  {
    title: "Floating",
    description: "`isFloat` insets the panel from the edges and rules it all round.",
    render: () => (
      <Drawer>
        <DrawerTrigger intent="secondary">open floating</DrawerTrigger>
        <DrawerContent side="left" isFloat notch={false}>
          <DrawerHeader>
            <DrawerTitle>navigation</DrawerTitle>
            <DrawerDescription>A floating left drawer.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <p className="text-sm text-quebi-fg-muted">
              Floating drawers detach from the viewport edge, ruled on every side.
            </p>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose intent="outline">done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
  },
]
