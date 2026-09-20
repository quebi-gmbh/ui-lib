import { Separator } from "@/components/separator"
import type { OgScene } from "./types"

/** A hairline doing its one job: two blocks of text, one rule between them. */
export const separatorOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="w-80">
      <p className="text-sm font-medium text-quebi-fg">Account</p>
      <Separator className="my-3" />
      <p className="text-sm text-quebi-fg-muted">Manage your settings and preferences.</p>
    </div>
  ),
}
