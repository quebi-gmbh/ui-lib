import { Checkbox, CheckboxGroup } from "@/components/checkbox"
import type { OgScene } from "./types"

/** A group with one of each state that has a mark in it. */
export const checkboxOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <CheckboxGroup aria-label="Notify me about" defaultValue={["deploys", "incidents"]}>
      <Checkbox value="deploys">Deploys</Checkbox>
      <Checkbox value="incidents">Incidents</Checkbox>
      <Checkbox value="digest">Weekly digest</Checkbox>
    </CheckboxGroup>
  ),
}
