import { Button } from "@/components/button"
import {
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/sheet"
import type { OgScene } from "./types"

/** The panel arrived from the right edge, which is the whole of the difference. */
export const sheetOgScene: OgScene = {
  render: () => (
    <SheetContent
      defaultOpen
      side="right"
      aria-label="Edit pricing"
      // Clear of the card's eyebrow, which sits in the same corner and is
      // painted over the scrim so that it stays readable.
      className="pt-28"
    >
      <SheetHeader>
        <SheetTitle>Edit pricing — Essentials 20</SheetTitle>
        <SheetDescription>Changes autosave.</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <p className="text-sm text-quebi-fg-muted">Pricing fields go here.</p>
      </SheetBody>
      <SheetFooter>
        <Button intent="outline">Close</Button>
      </SheetFooter>
    </SheetContent>
  ),
}
