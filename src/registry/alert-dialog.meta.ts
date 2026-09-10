import type { ComponentMeta } from "./types"

export const alertDialogMeta: ComponentMeta = {
  slug: "alert-dialog",
  name: "Alert Dialog",
  description:
    "The themed replacement for window.confirm(): a two-answer alertdialog surface, plus useConfirm() — a hook returning Promise<boolean>, so the line that asked the question still reads the answer.",
  category: "Overlays",
  tags: ["confirm", "alert", "dialog", "destructive", "promise", "overlay", "agents"],
}
