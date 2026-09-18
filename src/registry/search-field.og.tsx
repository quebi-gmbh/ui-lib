import { SearchField, SearchInput } from "@/components/search-field"
import type { OgScene } from "./types"

/**
 * Typed into, not empty: the clear button only exists once there is something
 * to clear, and it is half of what separates this from a plain Input.
 */
export const searchFieldOgScene: OgScene = {
  scale: 2,
  render: () => (
    <SearchField className="w-72" aria-label="Search" defaultValue="date picker">
      <SearchInput placeholder="Search components" />
    </SearchField>
  ),
}
