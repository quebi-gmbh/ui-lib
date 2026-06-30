import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "./modal"

const meta = {
  title: "Cellestial DS/Components/Modal",
  parameters: { layout: "centered" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Confirm: Story = {
  render: () => (
    <ModalTrigger>
      <Button intent="danger">Delete plan</Button>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Delete "Essentials 20"?</ModalTitle>
          <ModalDescription>
            This removes the plan from all 4 kiosks and from the tenant catalog. Existing contracts
            keep running until their term ends.
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose>
            <Button intent="outline">Cancel</Button>
          </ModalClose>
          <ModalClose>
            <Button intent="danger">Delete plan</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </ModalTrigger>
  ),
}

export const Form: Story = {
  render: () => (
    <ModalTrigger>
      <Button intent="primary">New plan</Button>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>New plan</ModalTitle>
          <ModalDescription>Basics first — you can add inclusions later.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <p className="text-ink-600 text-body-s">Form fields would go here.</p>
        </ModalBody>
        <ModalFooter>
          <ModalClose>
            <Button intent="outline">Cancel</Button>
          </ModalClose>
          <Button intent="primary">Create plan</Button>
        </ModalFooter>
      </ModalContent>
    </ModalTrigger>
  ),
}
