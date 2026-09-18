import { AlertDialog } from "@/components/alert-dialog"
import type { OgScene } from "./types"

/**
 * The two-answer question, held open. `AlertDialog` is controlled by design —
 * it cannot open itself — so a still life is exactly the shape it already has:
 * `isOpen` with nothing listening for the answer.
 */
export const alertDialogOgScene: OgScene = {
  render: () => (
    <AlertDialog
      isOpen
      title="Delete this plan?"
      description="Kiosks using it fall back to the default price list. This cannot be undone."
      confirmLabel="Delete plan"
      intent="danger"
    />
  ),
}
