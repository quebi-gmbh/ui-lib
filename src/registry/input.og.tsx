import { Search } from "lucide-react"
import { Input, InputGroup } from "@/components/input"
import type { OgScene } from "./types"

/** The bare control and the grouped one, so the adornment slot is in the frame. */
export const inputOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Input aria-label="Name" defaultValue="Ada Lovelace" readOnly />
      <InputGroup>
        <Search data-slot="icon" />
        <Input type="search" aria-label="Search" placeholder="Search components" />
      </InputGroup>
    </div>
  ),
}
