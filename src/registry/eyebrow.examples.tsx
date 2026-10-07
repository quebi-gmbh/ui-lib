import { Eyebrow } from "@/components/eyebrow"
import type { ComponentExample } from "./types"

export const eyebrowExamples: ComponentExample[] = [
  {
    title: "Kickers, counts and timecodes",
    description: "Written lowercase; the caps come from CSS. An em dash with spaces separates parts.",
    render: () => (
      <div className="grid gap-2.5">
        <Eyebrow>scene 01 — the studio</Eyebrow>
        <Eyebrow>studio — issue 04</Eyebrow>
        <Eyebrow>00:01:24</Eyebrow>
      </div>
    ),
  },
  {
    title: "Beside a section heading",
    description: "`as=\"span\"` for a count that sits on the heading's baseline.",
    render: () => (
      <div className="flex w-full items-end justify-between gap-4">
        <h2 className="m-0 font-display text-quebi-display-s text-quebi-fg">selected work</h2>
        <Eyebrow as="span">04 entries</Eyebrow>
      </div>
    ),
  },
]
