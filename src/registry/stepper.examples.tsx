import { Stepper, type StepItem } from "@/components/stepper"
import type { ComponentExample } from "./types"

const adminSteps: StepItem[] = [
  { id: "account", label: "account", status: "done" },
  { id: "details", label: "details", status: "done" },
  { id: "billing", label: "billing", status: "active" },
  { id: "review", label: "review", status: "upcoming" },
]

const kioskSteps: StepItem[] = [
  { id: "1", status: "done" },
  { id: "2", status: "done" },
  { id: "3", status: "active" },
  { id: "4", status: "upcoming" },
  { id: "5", status: "upcoming" },
]

export const stepperExamples: ComponentExample[] = [
  {
    title: "Admin",
    description:
      "Labelled bullets joined by rules. The active step is the one solid bullet; done steps are an ink ring with an ink rule after them, upcoming ones a hairline.",
    render: () => <Stepper steps={adminSteps} aria-label="Onboarding progress" />,
  },
  {
    title: "Kiosk",
    description: "Compact, bullet-only variant. Completed steps show a checkmark.",
    render: () => (
      <Stepper variant="kiosk" steps={kioskSteps} aria-label="Wizard progress" />
    ),
  },
  {
    title: "First step active",
    render: () => (
      <Stepper
        steps={[
          { id: "a", label: "plan", status: "active" },
          { id: "b", label: "build", status: "upcoming" },
          { id: "c", label: "ship", status: "upcoming" },
        ]}
      />
    ),
  },
  {
    title: "All complete",
    render: () => (
      <Stepper
        steps={[
          { id: "a", label: "plan", status: "done" },
          { id: "b", label: "build", status: "done" },
          { id: "c", label: "ship", status: "done" },
        ]}
      />
    ),
  },
]
