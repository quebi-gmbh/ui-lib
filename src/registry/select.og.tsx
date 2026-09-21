import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select"
import type { OgScene } from "./types"

export const selectOgScene: OgScene = {
  scale: 1.5,
  align: "top",
  render: () => (
    <Select aria-label="Region" defaultSelectedKey="eu-central" defaultOpen className="w-64">
      <SelectTrigger />
      <SelectContent>
        <SelectItem id="eu-central">Frankfurt</SelectItem>
        <SelectItem id="eu-west">Dublin</SelectItem>
        <SelectItem id="us-east">Virginia</SelectItem>
      </SelectContent>
    </Select>
  ),
}
