import { Link } from "@/components/link"
import type { OgScene } from "./types"

/** A link in a sentence, because a link out of prose is just teal text. */
export const linkOgScene: OgScene = {
  scale: 2,
  render: () => (
    <p className="max-w-sm text-sm text-quebi-fg-muted">
      Every rule names its replacement and links to its page — start with{" "}
      <Link href="/rules">the fifteen rules</Link>.
    </p>
  ),
}
