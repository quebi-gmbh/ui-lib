"use client"

import { use } from "react"
import type { FieldErrorProps, LabelProps, TextProps } from "react-aria-components"
import {
  composeRenderProps,
  FieldErrorContext,
  FieldError as FieldErrorPrimitive,
  Label as LabelPrimitive,
  Text,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Field primitives — quebi design system
 *
 * Built on react-aria-components. A small set of building blocks for composing
 * accessible form fields: a Label, a muted Description hint, a red FieldError
 * message, plus Field/Fieldset/Legend wrappers that lay out the
 * label → control → hint stack with consistent spacing.
 *
 * Three of those wrappers are the layout convention the whole library shares.
 * `Field` (and `fieldStyles`, which is the same rules for a root that is
 * already a react-aria field) is the stack down one field; `FieldRow` puts
 * fields side by side on one subgrid so their labels, controls and hints share
 * three baselines; `FieldGroup` stacks fields and rows down a form.
 */

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive
      data-slot="label"
      {...props}
      className={cn(
        "select-none font-semibold text-[13px] text-quebi-fg",
        "in-disabled:opacity-50 group-disabled:opacity-50",
        className,
      )}
    />
  )
}

export function Description({ className, ...props }: TextProps) {
  return (
    <Text
      {...props}
      slot="description"
      className={cn(
        "block text-[12px] text-quebi-fg-muted",
        "in-disabled:opacity-50 group-disabled:opacity-50",
        className,
      )}
    />
  )
}

/** The shared look of an inline field error, in one place for both branches below. */
const fieldErrorClasses = (className?: string) =>
  cn(
    "block text-[12px] text-red-500",
    "in-disabled:opacity-50 group-disabled:opacity-50",
    "forced-colors:text-[Mark]",
    className,
  )

/**
 * FieldError — the inline error message for a field.
 *
 * Inside a react-aria field (TextField, NumberField, RadioGroup, …) this is
 * RAC's FieldError, which reads validity off the surrounding FieldErrorContext.
 *
 * Outside one it renders the message itself. That branch is the reason this
 * wrapper exists: RAC's FieldError returns `null` whenever no FieldErrorContext
 * supplies `isInvalid`, and a bare Checkbox, Switch, Slider, or hidden-input
 * control provides none — so the same JSX that shows an error inside a
 * TextField silently shows nothing next to a Switch. Falling back keeps one
 * error shape usable everywhere, which is what lets every conform-* variant
 * render its message the same way:
 *
 *     {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
 *
 * The `id` is the only part that moves. Outside a react-aria field it is the
 * only reference the control gets, paired with `describedBy` on the control
 * itself. Inside one, drop it: the field has already generated an id for its
 * error slot and pointed the control at it. See `describedBy` below.
 *
 * Render props (a function `className` or `children`) only make sense with a
 * ValidationResult behind them, so the fallback branch ignores them — there is
 * nothing to compute them from.
 */
export function FieldError({ className, children, elementType, style, ...props }: FieldErrorProps) {
  const validation = use(FieldErrorContext)

  if (validation === null) {
    if (typeof children === "function" || children == null || children === false) return null
    return (
      <span
        {...props}
        slot="errorMessage"
        style={typeof style === "function" ? undefined : style}
        className={fieldErrorClasses(typeof className === "string" ? className : undefined)}
      >
        {children}
      </span>
    )
  }

  return (
    <FieldErrorPrimitive
      {...props}
      elementType={elementType}
      style={style}
      className={composeRenderProps(className, (className) => fieldErrorClasses(className))}
    >
      {children}
    </FieldErrorPrimitive>
  )
}

/**
 * Joins the ids a control's `aria-describedby` should point at, dropping the
 * ones that are not currently rendered.
 *
 *     aria-describedby={describedBy(hasErrors && field.errorId, description && field.descriptionId)}
 *
 * An `aria-describedby` pointing at an element that is not on the page is worse
 * than none at all: assistive technology announces nothing and there is no
 * attribute missing to notice.
 *
 * Only reach for this when the control is **not** a react-aria field, or when
 * the message is rendered outside one. Inside a TextField, NumberField,
 * RadioGroup, ComboBox, Select, DateField, TimeField (…) the field generates
 * the ids for its own description and error slots and already points the
 * control at them, so there is nothing left to wire: render Description and
 * FieldError with no ids and no aria-describedby at all.
 *
 * Passing `id={field.errorId}` in there is not a break — on mount react-aria
 * re-points the control at whatever id the element actually carries, so the
 * message is still announced — it is redundant wiring that reads as if it were
 * load-bearing, and the next reader has to work out which half is real.
 *
 * The line is the field's subtree, not the component name: ConformCalendar and
 * ConformRangeCalendar render their message as a sibling of the calendar, so
 * nothing generates those ids and they are set here by hand like everywhere
 * else. Whoever owns the ids does the wiring.
 */
export function describedBy(...ids: Array<string | false | null | undefined>) {
  const joined = ids.filter(Boolean).join(" ")
  return joined === "" ? undefined : joined
}

/**
 * Every element inside `container` that a user could put keyboard focus on,
 * in document order. `[tabindex]` is in the list for the ones that are only
 * focusable because react-aria said so — a date segment, the focusable day of
 * a calendar grid, the row of a GridList.
 */
const focusableSelector = "a[href], button, input, select, textarea, [tabindex]"

/**
 * Moves focus to the first control a user can actually reach inside
 * `container`, and reports whether it found one.
 *
 * This exists for the conform-* variants whose control has no native form
 * value (TimeField, DateRangePicker, FileTrigger, ChoiceBox, Calendar,
 * RangeCalendar, DaySchedule, ColorPicker). Conform focuses the first errored
 * field after a failed submit by calling `element.focus()` on it, and for those
 * variants that field is the registered `BaseControl` — an element nobody can
 * see. Each one forwards the focus here from `useControl`'s `onFocus`, and this
 * hands it to the date segment, the calendar cell, the Browse button: whatever
 * the visible control puts first.
 *
 * The registered control carries `tabIndex={-1}`, and `hidden` elements are
 * skipped, so passing the container that holds both it and the visible control
 * is safe — unless it is a `type="fieldset"` control, whose nested inputs are
 * ordinary focusable inputs and would answer first. The two variants built on
 * one (DateRangePicker, RangeCalendar) pass a container holding only the
 * visible control.
 */
export function focusFirstControl(container: HTMLElement | null | undefined): boolean {
  const candidates = container ? container.querySelectorAll<HTMLElement>(focusableSelector) : []
  for (const element of Array.from(candidates)) {
    if (element.tabIndex < 0 || element.hidden) continue
    if ((element as { disabled?: boolean }).disabled) continue
    // Rendered, not merely present. react-aria hides its own plumbing behind
    // `display: none` — FileTrigger's picker input, a DatePicker's native date
    // inputs — and those are focusable-looking but unfocusable, so the loop
    // would stop on one and put focus nowhere. `checkVisibility` is what tells
    // them apart from the clipped-but-rendered control above; a DOM
    // implementation without it (jsdom, happy-dom) simply skips the question.
    if (typeof element.checkVisibility === "function" && !element.checkVisibility()) continue
    element.focus()
    return true
  }
  return false
}

/**
 * The label → control → hint stack, in one place.
 *
 * Every field root in this library wears this: `Field` below, and the root of
 * each `conform-*` variant, whether that root is a `Field` or the react-aria
 * field itself (`TextField`, `Select`, `NumberField`, …). Before task #186 the
 * stack was written five ways with four different values — these selectors,
 * verbatim copies of them in `TextField`, `NumberField`, `TimeField` and
 * `ColorField`, and a `gap-1.5` / `gap-2` / `gap-3` / nothing flex root in
 * thirty of the variants — so a `ConformField` and a `ConformCheckbox` in the
 * same column had label→control gaps of 6px and 8px. That was drift, not a
 * decision. `tests/field-stack.test.ts` fails on the sixth copy.
 *
 * Sibling selectors rather than a flex `gap` for three reasons: they are the
 * older and documented primitive here; they let a description sit *above* the
 * control (`ConformStoragePicker` and `ConformColorSwatchPicker` do) as well
 * as below; and they give label→description its own 4px, which one `gap` on
 * the root cannot. Like `gap`, they produce nothing for a child that is not
 * rendered, which is what a field with no label or no error needs.
 *
 * The cost is that the control must say it is the control:
 * `data-slot="control"` on the element the label points at. Every field
 * primitive in this library already sets it (`Input`, `SelectTrigger`,
 * `DateInput`, `Textarea`, `Switch`, …); where a control does not — a
 * calendar, a `role="group"` box, a `<fieldset>` of chips — the variant that
 * wraps it marks it. `FieldRow` reads the same marks to place the parts on its
 * grid, so one convention pays for both.
 */
export const fieldStackStyles = [
  // label → control → hint stack with 6px between siblings.
  "[&>[data-slot=label]+[data-slot=control]]:mt-1.5",
  "[&>[data-slot=label]+[slot='description']]:mt-1",
  "[&>[slot=description]+[data-slot=control]]:mt-1.5",
  "[&>[data-slot=control]+[slot=description]]:mt-1.5",
  "[&>[data-slot=control]+[slot=errorMessage]]:mt-1.5",
].join(" ")

/**
 * The whole look of a field root: the stack above, one footprint rule, and the
 * disabled dimming.
 *
 * `w-full` is the footprint rule, and it is one rule on purpose. Fields used
 * to be `w-full`, `w-fit` or nothing at all depending on which variant you
 * reached for, so half of them did not fill their cell in a
 * `grid sm:grid-cols-2`. The only fields that keep `w-fit` are the four built
 * on a calendar grid, which say why in their own source.
 */
export const fieldStyles = cn(
  "w-full",
  fieldStackStyles,
  "in-disabled:opacity-50 disabled:opacity-50",
)

export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div {...props} className={cn(fieldStyles, className)} />
}

/**
 * FieldRow — fields side by side, sharing one label / control / hint grid.
 *
 * Fields of different shapes do not line up beside each other, and no amount
 * of agreeing on the gap inside a field fixes it: a `Textarea` is ~40px taller
 * than a `Select`, so the two hints below them sit 40px apart, and the moment
 * one field goes invalid its row grows and everything under it jumps. Both are
 * questions about the *row*, which is why they are answered here rather than
 * in each of the thirty-three variants.
 *
 * The row is a three-row grid — label, control, hint — and each field is
 * handed a `grid-template-rows: subgrid` spanning all three, so every label
 * lands on row 1, every control on row 2 and every description-or-error on row
 * 3. Each row then sizes to its tallest member and the fields share three
 * baselines whatever their heights.
 *
 * The hint row carries a floor of one line of 12px text, so a field going
 * invalid fills reserved space instead of pushing the page down. That
 * reservation is only affordable because of the subgrid: under a plain stack
 * it would cost ~18px under every field on the page forever, whereas here the
 * row is already as tall as the tallest hint in it.
 *
 * Placement is by the same marks the stack above uses — `data-slot="label"`,
 * `data-slot="control"`, `slot="description"` / `slot="errorMessage"`. Anything
 * else a variant renders (a hidden `BaseControl`, a popover) is out of flow or
 * portalled and takes no cell; anything else that is *not* goes to the control
 * row, which is why each variant keeps its control in a single marked element.
 *
 * Subgrid is guarded, as it is everywhere else in this repo (`sidebar.tsx`,
 * `navbar.tsx`, `dropdown.tsx`): without support the row is a plain
 * `grid-cols-*` with a 24px gap, which is exactly what consumers write by hand
 * today. Below `sm` it is a stack and each field spaces its own parts, because
 * one field per line has nothing to align with.
 *
 * Usage:
 *   <FieldRow>
 *     <ConformField field={fields.firstName} label="First name" />
 *     <ConformSelect field={fields.country} label="Country">…</ConformSelect>
 *   </FieldRow>
 */
const fieldRowColumns = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
} as const

export interface FieldRowProps extends React.ComponentProps<"div"> {
  /** How many fields stand side by side from `sm` up. Default 2. */
  columns?: keyof typeof fieldRowColumns
}

export function FieldRow({ className, columns = 2, ...props }: FieldRowProps) {
  return (
    <div
      data-slot="control"
      {...props}
      className={cn(
        // Narrow: one field per line, each spacing its own parts.
        "flex w-full flex-col gap-6",
        // From `sm`: side by side. Without subgrid this is the whole component,
        // and it is the `grid sm:grid-cols-2` a consumer writes today.
        "sm:grid sm:gap-x-4 sm:gap-y-6",
        fieldRowColumns[columns],
        // With subgrid: three rows, the last with a floor of one line of hint.
        "sm:supports-[grid-template-rows:subgrid]:[grid-template-rows:auto_auto_minmax(--spacing(4.5),auto)]",
        // `!` for the same reason as the margins below: `sm:gap-y-6` above and
        // this differ only by a variant, so tailwind-merge keeps both and the
        // winner would be sheet order.
        "sm:supports-[grid-template-rows:subgrid]:gap-y-1.5!",
        // A field spans all three rows and lays its parts out on them.
        "sm:supports-[grid-template-rows:subgrid]:*:row-span-3",
        // `!` on the display: a field root that keeps a flex column of its own
        // (`Slider` does, for its thumb row) is a plain `.flex` at the same
        // specificity as this rule, and the winner would be sheet order.
        "sm:supports-[grid-template-rows:subgrid]:*:grid!",
        "sm:supports-[grid-template-rows:subgrid]:*:grid-rows-subgrid",
        "sm:supports-[grid-template-rows:subgrid]:[&>*>[data-slot=label]]:row-start-1",
        "sm:supports-[grid-template-rows:subgrid]:[&>*>[slot=description]]:row-start-3",
        "sm:supports-[grid-template-rows:subgrid]:[&>*>[slot=errorMessage]]:row-start-3",
        "sm:supports-[grid-template-rows:subgrid]:[&>*>*:not([data-slot=label]):not([slot=description]):not([slot=errorMessage])]:row-start-2",
        // The row's gap replaces the stack's margins. The `!` is load-bearing
        // for the same reason it is in `pagination.tsx`: tailwind-merge groups
        // by utility name and leaves two `mt-*` that differ only by an
        // arbitrary variant both standing, so this would otherwise win or lose
        // on sheet order.
        "sm:supports-[grid-template-rows:subgrid]:[&>*>*]:mt-0!",
        // A row that overflows its columns wraps, and the 6px row gap is then
        // also the gap between the two lines — far too tight. The margin puts
        // 24px back between them; the negative one on the row takes the last
        // line's copy of it off again.
        "sm:supports-[grid-template-rows:subgrid]:-mb-6",
        "sm:supports-[grid-template-rows:subgrid]:*:mb-6",
        className,
      )}
    />
  )
}

export function Fieldset({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={cn("*:data-[slot=text]:mt-1 [&>*+[data-slot=control]]:mt-6", className)}
      {...props}
    />
  )
}

/**
 * FieldGroup — the vertical counterpart to `FieldRow`: fields, and rows of
 * fields, stacked down a form.
 *
 * Its 24px is the same 24px `FieldRow` puts between two lines that wrapped, so
 * a form built from `FieldGroup` and `FieldRow` has one vertical rhythm however
 * the fields are arranged. It carries `data-slot="control"` so a `Fieldset`
 * treats the whole group as one control under its legend.
 */
export function FieldGroup({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return <div data-slot="control" className={cn("space-y-6", className)} {...props} />
}

export function Legend({ className, ...props }: React.ComponentProps<"legend">) {
  return (
    <legend
      data-slot="legend"
      {...props}
      className={cn("font-semibold text-base/6 text-quebi-fg data-disabled:opacity-50", className)}
    />
  )
}
