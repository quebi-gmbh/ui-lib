import { Button } from "@/components/button"
import { Menu, MenuContent, MenuItem, MenuSeparator } from "@/components/menu"
import type { OgScene } from "./types"

/** Open on its trigger, with the danger intent the destructive row wears. */
export const menuOgScene: OgScene = {
  scale: 1.3,
  align: "top",
  render: () => (
    <Menu defaultOpen>
      <Button intent="outline" size="sm">
        Actions
      </Button>
      <MenuContent placement="bottom start">
        <MenuItem>Duplicate</MenuItem>
        <MenuItem>Archive</MenuItem>
        <MenuSeparator />
        <MenuItem intent="danger">Delete</MenuItem>
      </MenuContent>
    </Menu>
  ),
}
