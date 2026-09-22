import { useState } from "react"
import { Badge } from "@/components/badge"
import { Card } from "@/components/card"
import { Input } from "@/components/input"
import { Label } from "@/components/field"
import { Note } from "@/components/note"
import { TextField } from "@/components/text-field"
import { Code, Text } from "@/components/text"
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import { cn } from "@/lib/utils"
import { seo } from "@/lib/seo"
import { type FocusVariant, type FocusVerdict, focusGroups } from "@/site/focus-catalog"
import { ProseLink } from "@/site/prose-link"

export function meta() {
  return seo({
    title: "Focus indicators",
    description:
      "Every common way to draw keyboard focus on an input — outlines, rings, borders, fills, satellites and system colours — rendered side by side on one field, with the trigger, the backdrop and the field's state as toggles.",
    path: "/components/focus",
  })
}

/* -------------------------------------------------------------------------- */
/*                                 the toggles                                */
/* -------------------------------------------------------------------------- */

/**
 * The trigger is a React decision rather than a CSS one.
 *
 * Writing each of the thirty-three blocks twice — once under `:focus`, once
 * under `:focus-visible` — is the obvious way to make this toggle work and the
 * wrong one: it doubles the file the page exists to let you read. Instead
 * react-aria reports both states as render props on the field, this picks one,
 * and the CSS keys on a single class. `always` is not a real trigger; it holds
 * every tile lit so the grid can be compared without thirty-three tab stops.
 */
type Trigger = "focus" | "focus-visible" | "always"
type Surface = "page" | "card" | "row"
type FieldState = "default" | "invalid" | "disabled"

const SURFACE_CLASS: Record<Surface, string> = {
  page: "quebi-focus-surface-page",
  card: "quebi-focus-surface-card",
  row: "quebi-focus-surface-row",
}

const VERDICT_INTENT: Record<FocusVerdict, "success" | "warning" | "danger"> = {
  passes: "success",
  conditional: "warning",
  fails: "danger",
}

const VERDICT_LABEL: Record<FocusVerdict, string> = {
  passes: "Passes",
  conditional: "Conditional",
  fails: "Fails",
}

interface ControlProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { id: T; label: string }[]
}

function Control<T extends string>({ label, value, onChange, options }: ControlProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-quebi-fg-muted">{label}</span>
      <ToggleGroup
        size="sm"
        aria-label={label}
        selectedKeys={[value]}
        disallowEmptySelection
        onSelectionChange={(keys) => {
          const next = [...keys][0]
          if (next) onChange(next as T)
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.id} id={option.id}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  the field                                 */
/* -------------------------------------------------------------------------- */

interface DemoFieldProps {
  variant: FocusVariant
  trigger: Trigger
  state: FieldState
}

/**
 * The two variants whose label rests *inside* the control until focus lifts it.
 * Their fields start empty, because that is the only state in which a floating
 * label is in its resting position — a floating label over a filled field is
 * already lifted, and the tile would be showing the focused drawing at rest.
 */
const LABEL_STARTS_INSIDE = new Set(["float-label", "notched-outline"])

/**
 * One real field, wearing one variant.
 *
 * It is a `TextField` rather than a bare `Input` so the label is associated
 * with the control the way it would be in an app — two of the variants move
 * that label, and a demo where the label is decorative would be showing
 * something nobody can ship.
 */
function DemoField({ variant, trigger, state }: DemoFieldProps) {
  return (
    <div
      className="quebi-focus-demo"
      data-focus-variant={variant.id}
      data-state={state === "invalid" ? "invalid" : undefined}
    >
      <TextField
        isInvalid={state === "invalid"}
        isDisabled={state === "disabled"}
        defaultValue={LABEL_STARTS_INSIDE.has(variant.id) ? "" : "ada@quebi.de"}
      >
        <Label className="quebi-focus-demo-label">Email</Label>
        <Input
          className={({ isFocused, isFocusVisible }) =>
            cn(
              "quebi-focus-field",
              (trigger === "always" || (trigger === "focus" ? isFocused : isFocusVisible)) &&
                "quebi-focus-lit",
            )
          }
        />
        <Text className="quebi-focus-demo-hint text-xs text-quebi-fg-subtle">
          We only use this to reply.
        </Text>
      </TextField>
    </div>
  )
}

function VariantTile({ variant, trigger, state, surface }: DemoFieldProps & { surface: Surface }) {
  return (
    <Card className="gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-quebi-fg">{variant.name}</h3>
        <Badge intent={VERDICT_INTENT[variant.verdict]}>{VERDICT_LABEL[variant.verdict]}</Badge>
      </div>

      <div className={cn("rounded-quebi-sm px-4 py-5", SURFACE_CLASS[surface])}>
        <DemoField variant={variant} trigger={trigger} state={state} />
      </div>

      <pre className="overflow-x-auto rounded-quebi-sm bg-quebi-bg p-3 font-mono text-xs leading-relaxed text-quebi-fg-muted">
        {variant.css}
      </pre>

      <Text className="text-sm text-quebi-fg-muted">{variant.note}</Text>
      <Text className="mt-auto text-xs text-quebi-fg-subtle">{variant.verdictWhy}</Text>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  the page                                  */
/* -------------------------------------------------------------------------- */

export default function FocusIndicators() {
  const [trigger, setTrigger] = useState<Trigger>("focus-visible")
  const [surface, setSurface] = useState<Surface>("page")
  const [state, setState] = useState<FieldState>("default")

  return (
    <div>
      <span className="quebi-eyebrow">Foundations</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">
        Focus indicators
      </h1>
      <p className="mt-4 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
        Thirty-three ways to say “this control has keyboard focus”, drawn on the same field so they
        can be compared rather than described. None of them is the house style yet — this page
        exists to choose one. The library ships the offset ring today, and it is in the grid below
        on the same terms as the other thirty-two.
      </p>

      <Note intent="info" className="mt-6">
        Tab into a field rather than clicking it. That is the whole difference between the first two
        trigger settings, and it is invisible from a screenshot: <Code>:focus</Code> fires for the
        mouse too, <Code>:focus-visible</Code> is the browser’s judgement that a keyboard put you
        there. <Code>Always on</Code> holds every tile lit so the grid reads without thirty-three tab
        stops.
      </Note>

      <div className="sticky top-20 z-10 -mx-2 mt-8 flex flex-wrap gap-6 rounded-quebi-md bg-quebi-bg/90 px-2 py-4 backdrop-blur">
        <Control
          label="Trigger"
          value={trigger}
          onChange={setTrigger}
          options={[
            { id: "focus", label: ":focus" },
            { id: "focus-visible", label: ":focus-visible" },
            { id: "always", label: "Always on" },
          ]}
        />
        <Control
          label="Backdrop"
          value={surface}
          onChange={setSurface}
          options={[
            { id: "page", label: "Page" },
            { id: "card", label: "Card" },
            { id: "row", label: "Table row" },
          ]}
        />
        <Control
          label="State"
          value={state}
          onChange={setState}
          options={[
            { id: "default", label: "Default" },
            { id: "invalid", label: "Invalid" },
            { id: "disabled", label: "Disabled" },
          ]}
        />
      </div>

      {state === "disabled" && (
        <Note intent="warning" className="mt-6">
          A disabled field cannot be focused, so every tile below is showing its resting state.
          That is the answer rather than a gap in the page: an indicator you cannot reach is the
          reason a control that is merely unavailable should be <Code>aria-disabled</Code> and still
          in the tab order.
        </Note>
      )}

      {focusGroups.map((group) => (
        <section key={group.id} className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-quebi-fg">{group.title}</h2>
          <p className="mt-2 max-w-quebi-content text-sm leading-relaxed text-quebi-fg-muted">
            {group.blurb}
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {group.variants.map((variant) => (
              <VariantTile
                key={variant.id}
                variant={variant}
                trigger={trigger}
                state={state}
                surface={surface}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-quebi-fg">
          What the verdicts are measured against
        </h2>
        <div className="mt-4 max-w-quebi-content space-y-3 text-sm leading-relaxed text-quebi-fg-muted">
          <p>
            <strong className="font-semibold text-quebi-fg">WCAG 1.4.11 Non-text Contrast</strong>{" "}
            (AA) asks the indicator to reach 3:1 against what is next to it.{" "}
            <strong className="font-semibold text-quebi-fg">WCAG 2.4.13 Focus Appearance</strong>{" "}
            (AAA) adds a shape: at least the area of a 2px perimeter, and a 3:1 change between the
            focused and unfocused states. A badge here describes the drawing on this page, not the
            family in general — a border at 2px can clear both criteria where the same border at 1px
            cannot.
          </p>
          <p>
            Colour is not the axis. <Code>--q-brand-mark</Code> clears 3:1 on both themes with 0.45
            to spare, so everything marked <em>Fails</em> below fails on geometry or on
            translucency. Where a variant depends on something else being drawn beside it — the
            opaque border under a soft glow, the ring beside a floating label — the verdict says so,
            because that dependency is what breaks the first time someone simplifies it.
          </p>
          <p>
            Two failure modes no badge can carry. A <Code>box-shadow</Code> is dropped entirely in
            forced-colors mode, which takes out the whole ring family; an <Code>outline</Code> is
            kept. And an outline or ring is clipped by an ancestor’s <Code>overflow: hidden</Code>,
            which is why an indicator inside a scroll container is usually drawn{" "}
            <Code>inset</Code>. The <ProseLink to="/rules">rules</ProseLink> pages carry what this
            library enforces today.
          </p>
        </div>
      </section>
    </div>
  )
}
