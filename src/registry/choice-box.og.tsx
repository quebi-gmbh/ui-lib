import { ChoiceBox, ChoiceBoxItem } from "@/components/choice-box"
import type { OgScene } from "./types"

/** Two cards, one chosen — the selected border is the whole component. */
export const choiceBoxOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <ChoiceBox aria-label="Plan" defaultSelectedKeys={["pro"]} className="w-96">
      <ChoiceBoxItem id="starter" label="Starter" description="For solo projects." />
      <ChoiceBoxItem id="pro" label="Pro" description="For teams that ship often." />
    </ChoiceBox>
  ),
}
