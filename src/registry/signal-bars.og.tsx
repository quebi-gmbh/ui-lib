import { SignalBars } from "@/components/signal-bars"
import type { OgScene } from "./types"

/**
 * The four levels side by side with their text, which is the component's whole
 * argument in one picture: the level is in the height, the meaning is in the
 * words, and the colour is the third thing rather than the only thing.
 */
export const signalBarsOgScene: OgScene = {
  scale: 2,
  render: () => (
    <div className="flex items-center gap-8">
      {[
        { value: 4, text: "Excellent" },
        { value: 3, text: "Good" },
        { value: 2, text: "Degraded" },
        { value: 1, text: "Poor" },
      ].map(({ value, text }) => (
        <SignalBars key={text} value={value} tone="level" size="lg">
          <span className="text-sm text-quebi-fg-muted">{text}</span>
        </SignalBars>
      ))}
    </div>
  ),
}
