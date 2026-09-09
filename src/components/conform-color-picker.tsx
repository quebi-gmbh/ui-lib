"use client"

import type { FieldMetadata } from "@conform-to/react"
import { BaseControl, useControl } from "@conform-to/react/future"
import type { Color } from "react-aria-components"
import { ColorPicker as ColorPickerPrimitive, parseColor } from "react-aria-components"
import { cn } from "@/lib/utils"
import { ColorArea } from "@/components/color-area"
import { ColorField } from "@/components/color-field"
import { EyeDropper } from "@/components/color-picker"
import { ColorSlider, ColorSliderThumb, ColorSliderTrack } from "@/components/color-slider"
import { ColorSwatch } from "@/components/color-swatch"
import { Dialog } from "@/components/dialog"
import { describedBy, Description, Field, FieldError, Label } from "@/components/field"
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@/components/popover"

export interface ConformColorPickerProps {
  /** A colour bound to a string form value — an uppercase `#RRGGBB` hex. */
  field: FieldMetadata<string>
  label?: string
  placeholder?: string
  description?: string
  className?: string
  onValueChange?: (value: string) => void
}

/** Parse a hex string into a Color, or null when it is empty or malformed. */
function tryParseColor(hex: string): Color | null {
  try {
    return parseColor(hex)
  } catch {
    return null
  }
}

/**
 * ConformColorPicker — full color picker wired to Conform.
 *
 * Binds a hex-string Conform field to the quebi color primitives: a popover
 * with a saturation/brightness area, a hue slider, a hex field, and an
 * eyedropper, submitted through a registered hidden input.
 *
 * The hex string lives in Conform's state rather than in `useState`, so it
 * survives a failed submit and snaps back on a form reset. `BaseControl`
 * renders the input with the `hidden` attribute and no React `value` prop; both
 * matter, see `conform-time-field`.
 */
export function ConformColorPicker({
  field,
  label,
  placeholder,
  description,
  className,
  onValueChange,
}: ConformColorPickerProps) {
  const control = useControl({ defaultValue: (field.initialValue as string) ?? "" })
  const hasErrors = !field.valid && !!field.errors
  const isRequired = field.required ?? false

  const hexValue = control.value ?? ""
  const isEmpty = hexValue === ""
  const color =
    tryParseColor(hexValue) ?? tryParseColor(placeholder ?? "") ?? parseColor("#000000")
  const displayColor = isEmpty ? (placeholder ?? "#000000") : hexValue

  const handleColorChange = (newColor: Color) => {
    const next = newColor.toString("hex").toUpperCase()
    control.change(next)
    onValueChange?.(next)
  }

  return (
    <Field className={cn(className)}>
      {label && (
        <Label className={cn(hasErrors && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-quebi-brand">*</span>}
        </Label>
      )}

      <BaseControl
        name={field.name}
        form={field.formId}
        ref={control.register}
        defaultValue={control.defaultValue ?? ""}
      />

      <ColorPickerPrimitive value={color} onChange={handleColorChange}>
        <Popover>
          <PopoverTrigger
            intent="outline"
            className="w-full justify-start gap-2 font-normal"
            aria-describedby={describedBy(
              hasErrors && field.errorId,
              description && field.descriptionId,
            )}
          >
            <ColorSwatch color={displayColor} className="size-5 shrink-0 rounded-quebi-sm" />
            <span className={isEmpty ? "text-quebi-fg-subtle" : undefined}>
              {isEmpty ? (placeholder ?? "Select color") : hexValue}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-[280px]">
            <Dialog>
              <PopoverBody className="space-y-3 p-3">
                <ColorArea colorSpace="hsb" xChannel="saturation" yChannel="brightness" className="w-full" />
                <ColorSlider channel="hue" colorSpace="hsb">
                  <ColorSliderTrack>
                    <ColorSliderThumb />
                  </ColorSliderTrack>
                </ColorSlider>
                <div className="flex items-center gap-2">
                  <ColorField aria-label="Hex color" className="flex-1" />
                  <EyeDropper />
                  <ColorSwatch className="size-9 shrink-0" />
                </div>
              </PopoverBody>
            </Dialog>
          </PopoverContent>
        </Popover>
      </ColorPickerPrimitive>

      {/* These ids are ours to set: the trigger is a Button inside a popover,
          not a react-aria field, so nothing generates them and the
          aria-describedby above is their only reference. */}
      {description && <Description id={field.descriptionId}>{description}</Description>}
      {hasErrors && <FieldError id={field.errorId}>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
