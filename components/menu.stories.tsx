import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import { Menu, MenuContent, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from "./menu"

const meta = {
  title: "Cellestial DS/Components/Menu",
  parameters: { layout: "centered" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const RowActions: Story = {
  render: () => (
    <MenuTrigger>
      <Button intent="outline" size="sm">
        Actions
      </Button>
      <Menu>
        <MenuContent>
          <MenuItem>Duplicate</MenuItem>
          <MenuItem>Archive</MenuItem>
          <MenuSeparator />
          <MenuItem intent="danger">Delete</MenuItem>
        </MenuContent>
      </Menu>
    </MenuTrigger>
  ),
}

export const Sections: Story = {
  render: () => (
    <MenuTrigger>
      <Button intent="outline" size="sm">
        Filter by status
      </Button>
      <Menu>
        <MenuContent>
          <MenuSection label="Plans">
            <MenuItem>Live</MenuItem>
            <MenuItem>Draft</MenuItem>
            <MenuItem>Archived</MenuItem>
          </MenuSection>
          <MenuSeparator />
          <MenuSection label="Devices">
            <MenuItem>In stock</MenuItem>
            <MenuItem>Low stock</MenuItem>
            <MenuItem>Out of stock</MenuItem>
          </MenuSection>
        </MenuContent>
      </Menu>
    </MenuTrigger>
  ),
}
