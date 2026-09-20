import { Skeleton } from "@/components/skeleton"
import type { OgScene } from "./types"

/** The loading state of a media row: avatar, headline, two lines of body. */
export const skeletonOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="flex w-80 items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  ),
}
