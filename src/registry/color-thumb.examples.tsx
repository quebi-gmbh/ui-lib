import { ColorArea } from "@/components/color-area"
import { ColorThumb } from "@/components/color-thumb"
import type { ComponentExample } from "./types"

export const colorThumbExamples: ComponentExample[] = [
  {
    title: "The default handle, and one of your own",
    description:
      "A ColorThumb only means anything inside a color picker, and the reason to reach for it directly is ColorArea's `children`: the area renders `{children ?? <ColorThumb />}`, so a thumb you pass replaces its default rather than joining it. On the left the area draws that default; on the right the same component is larger, square-cornered and ringed in quebi teal. Both grow and take a teal focus ring when you tab to them.",
    render: () => (
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex flex-col gap-2">
          <span className="quebi-eyebrow text-quebi-fg-subtle">The area's default</span>
          <ColorArea
            defaultValue="hsb(220, 100%, 100%)"
            xChannel="saturation"
            yChannel="brightness"
            aria-label="Saturation and brightness, default thumb"
            className="size-40"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="quebi-eyebrow text-quebi-fg-subtle">A thumb you pass</span>
          <ColorArea
            defaultValue="hsb(220, 100%, 100%)"
            xChannel="saturation"
            yChannel="brightness"
            aria-label="Saturation and brightness, custom thumb"
            className="size-40"
          >
            <ColorThumb className="size-8 rounded-quebi-sm ring-2 ring-quebi-brand-mark disabled:opacity-100" />
          </ColorArea>
        </div>
      </div>
    ),
  },
  {
    title: "Disabled, without dimming twice",
    description:
      "A disabled ColorArea mutes its whole subtree with `opacity-50`, and ColorThumb carries a `disabled:opacity-50` of its own for the surfaces that do not — compounded, a nested thumb lands at a quarter and reads as broken rather than disabled. So a thumb passed to an area takes `disabled:opacity-100`, which is exactly what the area's own default carries. Here the fill stays legible under the muted gradient.",
    render: () => (
      <ColorArea
        isDisabled
        defaultValue="hsb(120, 80%, 90%)"
        xChannel="saturation"
        yChannel="brightness"
        aria-label="Saturation and brightness, disabled"
        className="size-40"
      >
        <ColorThumb className="size-8 rounded-quebi-sm ring-2 ring-quebi-brand-mark disabled:opacity-100" />
      </ColorArea>
    ),
  },
]
