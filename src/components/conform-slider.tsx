"use client"

import type { FieldMetadata } from "@conform-to/react"
import type { SliderProps } from "react-aria-components"
import { cn } from "@/lib/utils"
import { describedBy, Description, FieldError, Label } from "@/components/field"
import { Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack } from "@/components/slider"

export interface ConformSliderProps
  extends Omit<SliderProps, "name" | "form" | "value" | "defaultValue" | "onChange"> {
  /**
   * A slider bound to a numeric form value. Conform sees the raw wire value, so
   * the metadata carries `number | string`; a range slider submits its name
   * twice and surfaces as `string[]`.
   */
  field: FieldMetadata<number | string | number[] | string[]>
  label?: string
  description?: string
  /** Render two thumbs and submit a low/high pair under the same name. */
  isRange?: boolean
  /** Show the live value next to the label. */
  showOutput?: boolean
}

/** Read the field's initial value as slider state, tolerating the wire's strings. */
function toDefaultValue(initialValue: unknown, isRange: boolean): number | number[] | undefined {
  const toNumber = (raw: unknown) => {
    const parsed = Number.parseFloat(String(raw))
    return Number.isNaN(parsed) ? undefined : parsed
  }
  if (Array.isArray(initialValue)) {
    const values = initialValue.map(toNumber).filter((n): n is number => n !== undefined)
    return values.length > 0 ? values : undefined
  }
  const single = initialValue === undefined || initialValue === "" ? undefined : toNumber(initialValue)
  if (single === undefined) return undefined
  return isRange ? [single, single] : single
}

/**
 * ConformSlider — Slider wired to Conform.
 *
 * Binds a numeric Conform field to the quebi Slider: derives name, form,
 * default, and the described-by wiring from the field metadata and renders
 * inline errors.
 *
 * Two things worth knowing about this control:
 *
 * 1. **The name goes on the thumb, not on the slider.** Each SliderThumb is
 *    what renders a real `<input type="range">`; a `name` on Slider itself goes
 *    nowhere. A range slider therefore submits two inputs under the same name,
 *    which is why the parsed value is an array.
 * 2. react-aria's Slider has no `isRequired`/`isInvalid` and provides no
 *    FieldErrorContext — a slider always has a value, so there is nothing to
 *    require. Invalidity is announced through `aria-describedby` and the
 *    message below.
 */
export function ConformSlider({
  field,
  label,
  description,
  isRange = false,
  showOutput = true,
  className,
  ...props
}: ConformSliderProps) {
  const hasErrors = !field.valid && !!field.errors
  const thumbProps = {
    name: field.name,
    form: field.formId,
    "aria-describedby": describedBy(
      hasErrors && field.errorId,
      description && field.descriptionId,
    ),
  }

  return (
    <Slider
      {...props}
      defaultValue={toDefaultValue(field.initialValue, isRange)}
      className={cn("w-full", className)}
    >
      {(label || showOutput) && (
        <div className={cn("flex items-center", label ? "justify-between" : "justify-end")}>
          {label && <Label className={cn(hasErrors && "text-red-500")}>{label}</Label>}
          {showOutput && <SliderOutput />}
        </div>
      )}
      <SliderTrack>
        <SliderFill />
        {isRange ? (
          <>
            <SliderThumb index={0} {...thumbProps} />
            <SliderThumb index={1} {...thumbProps} />
          </>
        ) : (
          <SliderThumb {...thumbProps} />
        )}
      </SliderTrack>
      {/* These ids are ours to set: react-aria's Slider provides no
          description or error slot wiring (see above), so rendering these
          inside it generates nothing — the thumbs' aria-describedby is their
          only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Slider>
  )
}
