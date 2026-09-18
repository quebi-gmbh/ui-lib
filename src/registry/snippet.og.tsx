import { Snippet } from "@/components/snippet"
import type { OgScene } from "./types"

/** The command and its copy button, which is the whole component. */
export const snippetOgScene: OgScene = {
  scale: 1.8,
  render: () => <Snippet text="bunx shadcn add ui-lib.quebi.de/r/button.json" />,
}
