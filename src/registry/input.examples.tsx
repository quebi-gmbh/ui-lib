import { Search } from "lucide-react"
import { useState } from "react"
import { Input, InputGroup } from "@/components/input"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full max-w-xs flex-col items-stretch gap-3">{children}</div>
)

/**
 * Candidate focus treatments — a comparison sheet for task #110, not API.
 *
 * Each row is the real `Input` with exactly one thing changed through
 * `className`, so what you tab through is the component and not a mock-up.
 * `Input` merges `className` last through `cn`, so `focus:ring-1` really does
 * replace `focus:ring-2` rather than racing it in the sheet.
 *
 * Every candidate paints the indicator opaque, and none of them is a lower
 * alpha. That is not restraint, it is the bar: task #96 made the mark token a
 * role of its own precisely because the old half-alpha brand ring was 1.35:1
 * on the light page and 3.29:1 on the dark one, and `tests/mark-contrast.test.ts`
 * composites every alpha it finds in this file. `--q-brand-mark` is teal-600 on
 * light at 3.45:1 — a mark with 0.45 of headroom over 1.4.11's 3:1, and none at
 * all to spend on translucency. So the levers left are geometry (is the ring
 * detached, how thick, which way does it grow) and trigger (any focus, or only
 * keyboard focus).
 *
 * Do not copy a row into an app. The treatment that wins becomes the default
 * inside `input.tsx` and lands across every control in the library as one
 * change, and this example is deleted in the same commit — see task #150.
 */
const focusTreatments: { name: string; note: string; className: string }[] = [
  {
    name: "A · today",
    note: "ring-2 flush against the 1px border, both in the mark teal: 3px of continuous, fully opaque teal, with nothing between the two to say where one ends. That is what reads as a bloom rather than an edge — and since #96 dropped the /50, there is more of it than the version that was reported.",
    className: "",
  },
  {
    name: "B · offset ring",
    note: "The same ink, detached — ring-offset-2 in the page background cuts a gap between border and ring, so it reads as a ring instead of a glow. Textarea and NumberField's steppers already do this; Input is the outlier. Also the strongest of these against 2.4.11, because the indicator now has page background on both sides of it.",
    className: "focus:ring-offset-2 focus:ring-offset-quebi-bg",
  },
  {
    name: "C · thin ring",
    note: "ring-1, still flush: 2px of teal total instead of 3px. Less mass without changing the shape, and still the 2px-thick perimeter 2.4.11 asks for, because the border counts toward it.",
    className: "focus:ring-1",
  },
  {
    name: "D · inward only",
    note: "No outward spread at all — inset-ring-1 thickens the border inward, so the focused field occupies exactly the pixels the resting one did and a row of them cannot shift. The quietest row here, and the one with the least indicator area.",
    className: "focus:ring-0 focus:inset-ring-1 focus:inset-ring-quebi-brand-mark",
  },
  {
    name: "E · keyboard only",
    note: "B again, but on focus-visible: clicking into the field leaves it at its resting hairline, and only keyboard navigation gets the indicator. Composable with any row above rather than an alternative to them — and worth deciding separately, because it answers a different question (who needs the cue) from the rest (how loud the cue is).",
    className:
      "focus:border-quebi-line/20 focus:ring-0 focus-visible:border-quebi-brand-mark focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
  },
]

export const inputExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A basic text input with placeholder.",
    render: () => <Input aria-label="Name" placeholder="Enter your name" className="max-w-xs" />,
  },
  {
    title: "Focus treatments — pick one",
    description:
      "Five candidates for the focused state, side by side. Tab in from the top to walk them in order, then hover each one while it is focused; flip the theme toggle and do it again, because the mark teal is a different colour per theme (teal-600 on light, mint on dark) and the same geometry does not read the same in both. None of these is a lower opacity: the mark has 0.45 of contrast headroom over WCAG 1.4.11 and nothing to spend on translucency, so what varies is the shape of the indicator, not its strength. A decision aid, not API — it disappears when the winner is applied across the library.",
    render: () => (
      <div className="flex w-full flex-col gap-6">
        {focusTreatments.map((treatment) => (
          <div key={treatment.name} className="flex flex-col gap-1.5">
            <span className="font-medium text-quebi-fg text-xs">{treatment.name}</span>
            <Input
              aria-label={treatment.name}
              placeholder="Enter your name"
              className={`max-w-xs ${treatment.className}`}
            />
            <p className="max-w-quebi-content text-quebi-fg-subtle text-xs">{treatment.note}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "States",
    description: "Default, invalid, and disabled.",
    render: () => (
      <Col>
        <Input aria-label="Default" placeholder="Default" />
        <Input aria-label="Invalid" placeholder="Invalid" required defaultValue="" aria-invalid />
        <Input aria-label="Disabled" placeholder="Disabled" disabled />
        <Input aria-label="Disabled with value" defaultValue="Read only-ish" disabled />
      </Col>
    ),
  },
  {
    title: "Types",
    description: "Email, password, and search inputs.",
    render: () => (
      <Col>
        <Input type="email" aria-label="Email" placeholder="you@example.com" />
        <Input type="password" aria-label="Password" placeholder="Password" />
        <Input type="search" aria-label="Search" placeholder="Search" />
      </Col>
    ),
  },
  {
    title: "Sizes",
    description:
      "xs, sm, and the default md. xs (30px) and sm (38px) are exactly Button's xs and sm, so a field and the button beside it share a height.",
    render: () => (
      <Col>
        <Input size="xs" aria-label="Extra small" placeholder="xs — 30px" />
        <Input size="sm" aria-label="Small" placeholder="sm — 38px" />
        <Input aria-label="Medium" placeholder="md — 42px (default)" />
      </Col>
    ),
  },
  {
    title: "With icon",
    description: "InputGroup with a leading icon adornment.",
    render: () => (
      <InputGroup className="max-w-xs">
        <Search data-slot="icon" />
        <Input type="search" aria-label="Search" placeholder="Search components" />
      </InputGroup>
    ),
  },
  {
    title: "With text addon",
    description: "InputGroup with a trailing unit label.",
    render: () => (
      <InputGroup className="max-w-xs">
        <Input type="number" aria-label="Weight" placeholder="0" />
        <span data-slot="text" className="text-sm">
          kg
        </span>
      </InputGroup>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState("")
        return (
          <Col>
            <Input
              aria-label="Controlled"
              placeholder="Type something"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <p className="text-sm text-quebi-fg-muted">You typed: {value || "nothing yet"}</p>
          </Col>
        )
      }
      return <ControlledExample />
    },
  },
]
