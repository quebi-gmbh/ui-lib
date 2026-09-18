import { ChoiceBoxDescription, ChoiceBoxItem, ChoiceBoxLabel } from "@/components/choice-box"
import { ConformChoiceBox } from "@/components/conform-choice-box"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

const PLANS = [
  { id: "starter", name: "Starter", hint: "One project, community support." },
  { id: "growth", name: "Growth", hint: "Ten projects, email support." },
]

/** Cards, but a real form value. */
export const conformChoiceBoxOgScene: OgScene = {
  scale: 1.4,
  render: () => (
    <OgForm<{ plan: string }> defaultValue={{ plan: "growth" }} className="w-96">
      {(fields) => (
        <ConformChoiceBox
          field={fields.plan}
          label="Plan"
          selectionMode="single"
          gap={2}
          items={PLANS}
        >
          {(plan) => (
            <ChoiceBoxItem id={plan.id} textValue={plan.name}>
              <ChoiceBoxLabel>{plan.name}</ChoiceBoxLabel>
              <ChoiceBoxDescription>{plan.hint}</ChoiceBoxDescription>
            </ChoiceBoxItem>
          )}
        </ConformChoiceBox>
      )}
    </OgForm>
  ),
}
