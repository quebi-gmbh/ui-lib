import { Button } from "@/components/button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer"
import type { OgScene } from "./types"

/**
 * Up from the bottom edge, with the notch you drag it back down by. Opened
 * through the trigger's own `defaultOpen` rather than a standalone `isOpen`, so
 * the scene photographs the shape the examples use; the trigger sits under the
 * scrim.
 */
export const drawerOgScene: OgScene = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger>Open drawer</DrawerTrigger>
      <DrawerContent side="bottom" aria-label="Mobile menu">
        <DrawerHeader>
          <DrawerTitle>Mobile menu</DrawerTitle>
          <DrawerDescription>Drag down or tap a button to dismiss.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <p className="text-sm text-quebi-fg-muted">
            Drawers slide in from an edge and support drag-to-dismiss gestures.
          </p>
        </DrawerBody>
        <DrawerFooter>
          <Button intent="outline">Cancel</Button>
          <Button intent="primary">Continue</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}
