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
 * Only reach for this when the control is **not** a react-aria field. Inside a
 * TextField, NumberField, RadioGroup, ComboBox, Select, DateField, TimeField,
 * Calendar (…) the field generates its own ids for the description and error
 * slots and already points the control at them — give those children an id of
 * your own and the control keeps referencing the generated one, so the message
 * silently stops being announced. Whoever owns the ids does the wiring.
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

export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "w-full",
        // label → control → hint stack with 6px between siblings.
        "[&>[data-slot=label]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=label]+[slot='description']]:mt-1",
        "[&>[slot=description]+[data-slot=control]]:mt-1.5",
        "[&>[data-slot=control]+[slot=description]]:mt-1.5",
        "[&>[data-slot=control]+[slot=errorMessage]]:mt-1.5",
        "in-disabled:opacity-50 disabled:opacity-50",
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
