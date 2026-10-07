import { ColorField } from "@/components/color-field"
import { ColorSwatch } from "@/components/color-swatch"
import { ColorSwatchPicker, ColorSwatchPickerItem } from "@/components/color-swatch-picker"
import { Input } from "@/components/input"
import { ColorPicker, EyeDropper } from "@/components/color-picker"
import type { ComponentExample } from "./types"

export const colorPickerExamples: ComponentExample[] = [
  {
    title: "Swatch with hex field",
    description: "A live color swatch paired with an editable hex input.",
    render: () => (
      <ColorPicker defaultValue="#14b8a6">
        {/* 38px: the field scale's `sm`, which is what the input beside it is.
            The swatch draws its own hairline, so there is no border here. */}
        <ColorSwatch className="size-9.5" />
        <ColorField className="flex flex-col gap-1">
          <Input
            className="w-32 font-mono"
            aria-label="Hex color"
          />
        </ColorField>
      </ColorPicker>
    ),
  },
  {
    title: "With eye dropper",
    description: "Sample any pixel on screen using the browser EyeDropper API.",
    render: () => (
      <ColorPicker defaultValue="#a855f7">
        {/* Swatch, input and dropper are all 38px — the dropper's `sq-sm`. */}
        <ColorSwatch className="size-9.5" />
        <ColorField className="flex flex-col gap-1">
          <Input
            className="w-32 font-mono"
            aria-label="Hex color"
          />
        </ColorField>
        <EyeDropper />
      </ColorPicker>
    ),
  },
  {
    title: "Swatch palette",
    description: "Pick from a curated set of preset colors.",
    render: () => (
      <ColorPicker defaultValue="#14b8a6">
        <ColorSwatchPicker className="flex flex-wrap gap-2">
          {["#14b8a6", "#a855f7", "#ef4444", "#3b82f6", "#f59e0b", "#ffffff"].map((color) => (
            // The size is on the option and the swatch fills it; the swatch's
            // own inset hairline is the only line, and the selected and focus
            // rings are the item's own.
            <ColorSwatchPickerItem
              key={color}
              color={color}
              className="size-8 cursor-pointer"
            >
              <ColorSwatch className="size-full" />
            </ColorSwatchPickerItem>
          ))}
        </ColorSwatchPicker>
      </ColorPicker>
    ),
  },
]
