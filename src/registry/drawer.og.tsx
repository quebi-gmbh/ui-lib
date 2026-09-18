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
 * Up from the bottom edge, with the notch you drag it back down by. Unlike
 * `ModalContent`, `DrawerContent` throws outside a `Drawer` — it reads the open
 * state off the trigger's context — so the trigger is here, under the scrim,
 * with `defaultOpen` on the wrapper.
 */
export const drawerOgScene: OgScene = {
  render: () => (
    <Drawer defaultOpen>
      <DrawerTrigger>
        <Button>Open drawer</Button>
      </DrawerTrigger>
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
