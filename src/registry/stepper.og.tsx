import { Stepper, type StepItem } from "@/components/stepper"
import type { OgScene } from "./types"

const STEPS: StepItem[] = [
  { id: "account", label: "account", status: "done" },
  { id: "details", label: "details", status: "done" },
  { id: "billing", label: "billing", status: "active" },
  { id: "review", label: "review", status: "upcoming" },
]

/** All three statuses in one run: two done, one active, one still to come. */
export const stepperOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <div className="w-136">
      <Stepper steps={STEPS} aria-label="Onboarding progress" />
    </div>
  ),
}
