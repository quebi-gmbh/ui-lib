import {
  ColorField,
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  Input,
} from "react-aria-components"
import { ColorPicker, EyeDropper } from "@/components/color-picker"
import type { ComponentExample } from "./types"

export const colorPickerExamples: ComponentExample[] = [
  {
    title: "Swatch with hex field",
    description: "A live color swatch paired with an editable hex input.",
    render: () => (
      <ColorPicker defaultValue="#14b8a6">
        <ColorSwatch className="size-9 rounded-quebi-sm border border-cyan-500/20" />
        <ColorField className="flex flex-col gap-1">
          <Input
            className="w-32 rounded-quebi-sm border border-cyan-500/20 bg-quebi-bg px-3 py-2 font-mono text-sm text-white outline-none transition-colors focus-visible:border-quebi-brand focus-visible:ring-2 focus-visible:ring-quebi-brand/50"
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
        <ColorSwatch className="size-9 rounded-quebi-sm border border-cyan-500/20" />
        <ColorField className="flex flex-col gap-1">
          <Input
            className="w-32 rounded-quebi-sm border border-cyan-500/20 bg-quebi-bg px-3 py-2 font-mono text-sm text-white outline-none transition-colors focus-visible:border-quebi-brand focus-visible:ring-2 focus-visible:ring-quebi-brand/50"
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
            <ColorSwatchPickerItem
              key={color}
              color={color}
              className="size-8 cursor-pointer rounded-quebi-sm border border-cyan-500/20 outline-none transition-all hover:scale-[1.05] selected:ring-2 selected:ring-quebi-brand selected:ring-offset-2 selected:ring-offset-quebi-bg focus-visible:ring-2 focus-visible:ring-quebi-brand/50"
            >
              <ColorSwatch className="size-full rounded-quebi-sm" />
            </ColorSwatchPickerItem>
          ))}
        </ColorSwatchPicker>
      </ColorPicker>
    ),
  },
]
