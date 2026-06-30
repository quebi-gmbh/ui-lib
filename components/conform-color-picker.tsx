"use client"

import type { FieldMetadata } from "@conform-to/react"
import { parseColor } from "@react-stately/color"
import { useState } from "react"
import type { Color } from "react-aria-components"
import { ColorPicker as ColorPickerPrimitive } from "react-aria-components"
import { ColorArea } from "./color-area"
import { ColorField } from "./color-field"
import { EyeDropper } from "./color-picker"
import { ColorSlider, ColorSliderTrack } from "./color-slider"
import { ColorSwatch } from "./color-swatch"
import { ColorThumb } from "./color-thumb"
import { Dialog } from "./dialog"
import { Description, FieldError, fieldStyles, Label } from "./field"
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "./popover"

interface ConformColorPickerProps {
  field: FieldMetadata<string | undefined>
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
  const hasErrors = !field.valid && field.errors

  const handleColorChange = (newColor: Color) => {
    setColor(newColor)
    setIsEmpty(false)
    onValueChange?.(newColor.toString("hex").toUpperCase())
  }

  const displayColor = isEmpty ? (placeholder ?? "#000000") : hexValue

  return (
    <div className={fieldStyles()}>
      {label && (
        <Label data-slot="label" className={hasErrors ? "text-danger" : undefined}>
          {label}
        </Label>
      )}

      <ColorPickerPrimitive value={color} onChange={handleColorChange}>
        <Popover>
          <PopoverTrigger
            intent="outline"
            className="w-full justify-start gap-2 font-normal"
            data-slot="control"
          >
            <ColorSwatch
              color={displayColor}
              className="size-5 shrink-0 rounded-[calc(var(--radius-md)-1px)]"
            />
            <span className={isEmpty ? "text-muted-fg" : undefined}>
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
                    <ColorThumb />
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
    </div>
  )
}
