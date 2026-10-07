import { Button } from "@/components/button"
import { ButtonGroup, ButtonGroupText } from "@/components/button-group"
import type { ComponentExample } from "./types"

const ChevronLeft = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

const ChevronRight = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
)

export const buttonGroupExamples: ComponentExample[] = [
  {
    title: "Horizontal",
    description: "The default — buttons connect into a single segmented control.",
    render: () => (
      <ButtonGroup>
        <Button intent="outline">day</Button>
        <Button intent="outline">week</Button>
        <Button intent="outline">month</Button>
      </ButtonGroup>
    ),
  },
  {
    title: "Vertical",
    description: "Stack the same group with `orientation=\"vertical\"`.",
    render: () => (
      <ButtonGroup orientation="vertical">
        <Button intent="outline">profile</Button>
        <Button intent="outline">billing</Button>
        <Button intent="outline">team</Button>
      </ButtonGroup>
    ),
  },
  {
    title: "Icon controls",
    description: "Square icon buttons make a tidy pager / stepper.",
    render: () => (
      <ButtonGroup>
        <Button intent="outline" size="sq-md" aria-label="Previous">
          <ChevronLeft />
        </Button>
        <Button intent="outline" size="sq-md" aria-label="Next">
          <ChevronRight />
        </Button>
      </ButtonGroup>
    ),
  },
  {
    title: "With text addon",
    description: "Pair buttons with a flush, non-interactive label via ButtonGroupText.",
    render: () => (
      <ButtonGroup>
        <ButtonGroupText>qty</ButtonGroupText>
        <Button intent="outline" size="sq-md" aria-label="Decrease">
          –
        </Button>
        <Button intent="outline" size="sq-md" aria-label="Increase">
          +
        </Button>
      </ButtonGroup>
    ),
  },
  {
    title: "Active selection",
    description: "Promote the chosen segment with the primary intent.",
    render: () => (
      <ButtonGroup>
        <Button intent="outline">list</Button>
        <Button intent="primary">board</Button>
        <Button intent="outline">timeline</Button>
      </ButtonGroup>
    ),
  },
]
