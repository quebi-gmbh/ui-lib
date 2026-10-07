import { Logo } from "@/components/logo"
import type { OgScene } from "./types"

/** The two drawings at the sizes a page would use them, larger: the logo is the whole subject. */
export const logoOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <div className="flex items-center gap-16">
      <Logo height={64} />
      <Logo variant="mark" height={96} />
    </div>
  ),
}
