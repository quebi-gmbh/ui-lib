import { Stepper, type StepItem } from "@/components/stepper"
import type { ComponentExample } from "./types"

const adminSteps: StepItem[] = [
  { id: "account", label: "Account", status: "done" },
  { id: "details", label: "Details", status: "done" },
  { id: "billing", label: "Billing", status: "active" },
  { id: "review", label: "Review", status: "upcoming" },
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
      "Labelled bullets connected by progress lines. Completed steps fill teal; the active step glows.",
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
          { id: "a", label: "Plan", status: "active" },
          { id: "b", label: "Build", status: "upcoming" },
          { id: "c", label: "Ship", status: "upcoming" },
        ]}
      />
    ),
  },
  {
    title: "All complete",
    render: () => (
      <Stepper
        steps={[
          { id: "a", label: "Plan", status: "done" },
          { id: "b", label: "Build", status: "done" },
          { id: "c", label: "Ship", status: "done" },
        ]}
      />
    ),
  },
]
