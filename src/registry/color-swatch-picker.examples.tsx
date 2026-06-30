import { useState } from "react"
import { ColorSwatch, parseColor } from "react-aria-components"
import { ColorSwatchPicker, ColorSwatchPickerItem } from "@/components/color-swatch-picker"
import type { ComponentExample } from "./types"

const PALETTE = ["#14b8a6", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#f59e0b"]

export const colorSwatchPickerExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A grid of swatches; the selected one shows a brand-teal ring.",
    render: () => (
      <ColorSwatchPicker defaultValue="#14b8a6" aria-label="Accent color">
        {PALETTE.map((color) => (
          <ColorSwatchPickerItem key={color} color={color}>
            <ColorSwatch className="size-8" />
          </ColorSwatchPickerItem>
        ))}
      </ColorSwatchPicker>
    ),
  },
  {
    title: "Disabled item",
    description: "Individual swatches can be disabled.",
    render: () => (
      <ColorSwatchPicker defaultValue="#0ea5e9" aria-label="Accent color">
        {PALETTE.map((color, i) => (
          <ColorSwatchPickerItem key={color} color={color} isDisabled={i === 2}>
            <ColorSwatch className="size-8" />
          </ColorSwatchPickerItem>
        ))}
      </ColorSwatchPicker>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [color, setColor] = useState(parseColor("#a855f7"))
        return (
          <div className="flex flex-col items-start gap-3">
            <ColorSwatchPicker value={color} onChange={setColor} aria-label="Accent color">
              {PALETTE.map((c) => (
                <ColorSwatchPickerItem key={c} color={c}>
                  <ColorSwatch className="size-8" />
                </ColorSwatchPickerItem>
              ))}
            </ColorSwatchPicker>
            <span className="text-sm text-quebi-fg-muted">{color.toString("hex")}</span>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
