import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import {
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet"

const meta = {
  title: "Cellestial DS/Components/Sheet",
  parameters: { layout: "centered" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const RightEdit: Story = {
  render: () => (
    <SheetTrigger>
      <Button intent="outline">Edit pricing</Button>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Edit pricing — Essentials 20</SheetTitle>
          <SheetDescription>
            Changes autosave. Customers see the updated price on their next kiosk session.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p className="text-ink-600 text-body-s">Pricing fields go here.</p>
        </SheetBody>
        <SheetFooter>
          <SheetClose>
            <Button intent="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </SheetTrigger>
  ),
}

export const BottomFilter: Story = {
  render: () => (
    <SheetTrigger>
      <Button intent="outline">Filter devices</Button>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Filter devices</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <p className="text-ink-600 text-body-s">Filter controls go here.</p>
        </SheetBody>
        <SheetFooter>
          <SheetClose>
            <Button intent="outline">Cancel</Button>
          </SheetClose>
          <Button intent="primary">Apply filters</Button>
        </SheetFooter>
      </SheetContent>
    </SheetTrigger>
  ),
}
