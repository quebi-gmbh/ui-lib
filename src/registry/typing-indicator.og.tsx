import { Avatar } from "@/components/avatar"
import { Card } from "@/components/card"
import { TypingIndicator } from "@/components/typing-indicator"
import type { OgScene } from "./types"

/**
 * The bubble where the reply will appear. The dots are mid-bounce in life and
 * at rest in the photograph: `scripts/screenshot-og.ts` runs the page under
 * `prefers-reduced-motion` with animations disabled, which is exactly the state
 * the component promises to degrade to — three dots that still say "something
 * is coming".
 */
export const typingIndicatorOgScene: OgScene = {
  scale: 2.2,
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initials="AI" size="lg" />
      <Card className="p-4">
        <TypingIndicator size="lg" className="text-quebi-fg-muted" />
      </Card>
    </div>
  ),
}
