import { StatusDot } from "@/components/status-dot"
import type { OgScene } from "./types"

/**
 * All five tones with their words, including the hollow `unknown` ring — the
 * one that is a different shape rather than a fifth colour, which is the thing
 * worth seeing at thumbnail size.
 *
 * The live ring is deliberately not in the shot: the screenshot runs under
 * `prefers-reduced-motion`, where it is hidden, so photographing it would
 * publish an empty promise.
 */
export const statusDotOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex items-center gap-7">
      {[
        { tone: "online" as const, text: "Online" },
        { tone: "idle" as const, text: "Away" },
        { tone: "busy" as const, text: "Busy" },
        { tone: "offline" as const, text: "Offline" },
        { tone: "unknown" as const, text: "Unknown" },
      ].map(({ tone, text }) => (
        <StatusDot key={tone} tone={tone} size="lg">
          <span className="text-sm text-quebi-fg-muted">{text}</span>
        </StatusDot>
      ))}
    </div>
  ),
}
