"use client"

import type { FieldMetadata } from "@conform-to/react"
import { useState } from "react"
import type { Color } from "react-aria-components"
import { ColorPicker as ColorPickerPrimitive, parseColor } from "react-aria-components"
import { ColorArea } from "@/components/color-area"
import { ColorField } from "@/components/color-field"
import { EyeDropper } from "@/components/color-picker"
import { ColorSlider, ColorSliderThumb, ColorSliderTrack } from "@/components/color-slider"
import { ColorSwatch } from "@/components/color-swatch"
import { Dialog } from "@/components/dialog"
import { Description, Field, FieldError, Label } from "@/components/field"
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@/components/popover"

interface ConformColorPickerProps {
  // Loose value type param: the field carries a hex string but only
  // name/initialValue/default/required/errors are read here.
  // biome-ignore lint/suspicious/noExplicitAny: form-schema type params vary per call site
  field: FieldMetadata<any, any, string[]>
  label?: string
  placeholder?: string
  description?: string
  onValueChange?: (value: string) => void
}

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
 * eyedropper. Derives name, default, required, and validity from the field
 * metadata, mirrors the chosen color into a hidden input, and renders inline
 * errors.
 */
export function ConformColorPicker({
  field,
  label,
  placeholder,
  description,
  onValueChange,
}: ConformColorPickerProps) {
  const initialValue = (field.initialValue as string) ?? ""
  const [isEmpty, setIsEmpty] = useState(!initialValue)
  const [color, setColor] = useState<Color>(
    () => tryParseColor(initialValue) ?? tryParseColor(placeholder ?? "") ?? parseColor("#000000"),
  )

  const hexValue = isEmpty ? "" : color.toString("hex").toUpperCase()
  const hasErrors = !field.valid && !!field.errors

  const handleColorChange = (newColor: Color) => {
    setColor(newColor)
    setIsEmpty(false)
    onValueChange?.(newColor.toString("hex").toUpperCase())
  }

  const displayColor = isEmpty ? (placeholder ?? "#000000") : hexValue

  return (
    <Field>
      {label && (
        <Label className={hasErrors ? "text-red-500" : undefined}>{label}</Label>
      )}

      <ColorPickerPrimitive value={color} onChange={handleColorChange}>
        <Popover>
          <PopoverTrigger
            intent="outline"
            className="w-full justify-start gap-2 font-normal"
          >
            <ColorSwatch
              color={displayColor}
              className="size-5 shrink-0 rounded-quebi-sm"
            />
            <span className={isEmpty ? "text-quebi-fg-subtle" : undefined}>
              {isEmpty ? (placeholder ?? "Select color") : hexValue}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-[280px]">
            <Dialog>
              <PopoverBody className="space-y-3 p-3">
                <ColorArea
                  colorSpace="hsb"
                  xChannel="saturation"
                  yChannel="brightness"
                  className="w-full"
                />
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

      <input type="hidden" name={field.name} value={hexValue} />

      {description && <Description>{description}</Description>}
      {hasErrors && <FieldError>{field.errors?.join(", ")}</FieldError>}
    </Field>
  )
}
