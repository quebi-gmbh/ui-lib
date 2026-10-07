import { Eyebrow } from "@/components/eyebrow"
import { Logo } from "@/components/logo"
import { LowTitle } from "@/components/low-title"
import { Stage } from "@/components/stage"
import { TextLink } from "@/components/text"
import type { ComponentExample } from "./types"

export const stageExamples: ComponentExample[] = [
  {
    title: "Cinematic",
    description:
      "The default: the stage light from the top right, the mark as a watermark, a label under the nav and the headline set low.",
    frame: "none",
    render: () => (
      <Stage>
        <Logo />
        <Eyebrow>scene 01 — the studio</Eyebrow>
        <LowTitle
          as="h1"
          title="full-stack software development."
          action={<TextLink href="#">get started →</TextLink>}
        >
          We build web applications end to end: database, backend and interface.
        </LowTitle>
      </Stage>
    ),
  },
  {
    title: "Gallery",
    description: "Plain paper with a bigger watermark in the bottom-right corner, for team, about and contact pages.",
    frame: "none",
    render: () => (
      <Stage variant="gallery">
        <Logo />
        <Eyebrow>studio — issue 04</Eyebrow>
        <LowTitle size="xl" title="full-stack software." action={<TextLink href="#">talk to us →</TextLink>}>
          Two developers, Munich.
        </LowTitle>
      </Stage>
    ),
  },
  {
    title: "Without the glyph",
    description: "`glyph={false}` removes the watermark; the light and the low title carry the frame alone.",
    frame: "none",
    render: () => (
      <Stage glyph={false} className="md:min-h-115">
        <Eyebrow>full-stack studio — münchen</Eyebrow>
        <LowTitle title="selected work." action={<TextLink href="#">read the case →</TextLink>}>
          Four projects, from the first data model to production.
        </LowTitle>
      </Stage>
    ),
  },
]
