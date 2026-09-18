import { CreditCard, Settings, User } from "lucide-react"
import { DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/dropdown"
import { ListBox } from "@/components/list-box"
import type { OgScene } from "./types"

/**
 * The rows, on the surface they are meant for, and no overlay. Dropdown is the
 * item vocabulary the menus and the selects share — Menu is where you see one
 * of these open on a trigger.
 */
export const dropdownOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <ListBox aria-label="Account" selectionMode="none" className="w-64 p-1.5">
      <DropdownItem>
        <User data-slot="icon" aria-hidden="true" />
        <DropdownLabel>Profile</DropdownLabel>
      </DropdownItem>
      <DropdownItem>
        <CreditCard data-slot="icon" aria-hidden="true" />
        <DropdownLabel>Billing</DropdownLabel>
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem>
        <Settings data-slot="icon" aria-hidden="true" />
        <DropdownLabel>Settings</DropdownLabel>
      </DropdownItem>
    </ListBox>
  ),
}
