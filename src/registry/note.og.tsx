import { Note } from "@/components/note"
import type { OgScene } from "./types"

/** Two intents, one line each — the colour range without the wall of prose. */
export const noteOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <div className="flex max-w-md flex-col gap-3">
      <Note intent="success">Changes autosaved · 14:02.</Note>
      <Note intent="warning">Two devices in this bundle are out of stock.</Note>
    </div>
  ),
}
