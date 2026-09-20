import { Avatar } from "@/components/avatar"
import type { OgScene } from "./types"

/**
 * Initials rather than photographs. The gallery example loads a portrait from
 * Unsplash, and a share image that is only right when a CDN answers is not a
 * share image — the fallback is the half of this component that is ours anyway.
 */
export const avatarOgScene: OgScene = {
  scale: 2.5,
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar initials="AL" alt="Ada Lovelace" size="xl" />
      <Avatar initials="GH" alt="Grace Hopper" size="xl" />
      <Avatar initials="AT" alt="Alan Turing" size="xl" isSquare />
    </div>
  ),
}
