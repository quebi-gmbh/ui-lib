import { FormattedStorage } from "@/components/formatted-storage"
import type { OgScene } from "./types"

/** Both sides of the 1024 GB threshold, where the unit changes. */
export const formattedStorageOgScene: OgScene = {
  scale: 2.4,
  render: () => (
    <div className="flex items-baseline gap-8 text-quebi-fg tabular-nums">
      <FormattedStorage value={256} />
      <FormattedStorage value={512} />
      <FormattedStorage value={2048} />
    </div>
  ),
}
