import { FileTrigger } from "@/components/file-trigger"
import type { OgScene } from "./types"

/** The button that opens the native picker, in both intents it ships with. */
export const fileTriggerOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex items-center gap-4">
      <FileTrigger />
      <FileTrigger intent="primary">Upload invoice</FileTrigger>
    </div>
  ),
}
