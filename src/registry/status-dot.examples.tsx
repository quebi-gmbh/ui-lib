import { Avatar } from "@/components/avatar"
import { Badge } from "@/components/badge"
import { StatusDot, type StatusDotTone } from "@/components/status-dot"
import type { ComponentExample } from "./types"

const TONES: { tone: StatusDotTone; text: string }[] = [
  { tone: "online", text: "Online" },
  { tone: "idle", text: "Away" },
  { tone: "busy", text: "In a meeting" },
  { tone: "offline", text: "Offline" },
  { tone: "unknown", text: "Never signed in" },
]

const ENVIRONMENTS = [
  { name: "production", tone: "online" as const, text: "Healthy" },
  { name: "staging", tone: "idle" as const, text: "Degraded" },
  { name: "preview-1842", tone: "offline" as const, text: "Stopped" },
]

export const statusDotExamples: ComponentExample[] = [
  {
    title: "The five tones",
    description:
      "Four claims and one admission. `unknown` is a hollow ring rather than a fifth fill, so the one tone that means \"we do not actually know\" is distinguishable without reading a colour — which is the same reason the text beside each dot is part of the component and not part of the example.",
    render: () => (
      <div className="flex flex-col gap-2">
        {TONES.map(({ tone, text }) => (
          <StatusDot key={tone} tone={tone}>
            <span className="text-sm text-quebi-fg-muted">{text}</span>
          </StatusDot>
        ))}
      </div>
    ),
  },
  {
    title: "On an avatar's corner",
    description:
      "The dot is a state carried on something else, so most of the time it is positioned onto a thing that is already there. With no children the tone's own word is still rendered `sr-only` — a screen reader hears \"Online\" beside the name, which is the whole state a sighted reader gets from the green.",
    render: () => (
      <div className="flex items-center gap-6">
        {(["online", "idle", "busy", "offline"] as const).map((tone) => (
          <div key={tone} className="relative">
            <Avatar initials="LS" size="lg" />
            <StatusDot
              tone={tone}
              size="lg"
              className="absolute right-0 bottom-0 rounded-full bg-quebi-bg p-0.5"
            />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Live, and only when it means it",
    description:
      "The expanding ring says \"this is live right now\", which is a different claim from \"this is online\". Something that always moves stops meaning anything, so keep it for a connection that is actively receiving. It is dropped under `prefers-reduced-motion`, where the dot stays.",
    render: () => (
      <div className="flex flex-col gap-3">
        <StatusDot tone="online" isLive>
          <span className="text-sm text-quebi-fg-muted">Streaming — 412 events/s</span>
        </StatusDot>
        <StatusDot tone="online">
          <span className="text-sm text-quebi-fg-muted">Connected, idle</span>
        </StatusDot>
      </div>
    ),
  },
  {
    title: "In a row, and next to a Badge",
    description:
      "A Badge is a labelled chip that stands on its own and brings its own chrome; a Status Dot is the mark you put next to a name that is already on the page. Use the dot in a dense list, and the Badge where the state needs to be its own object.",
    render: () => (
      <div className="flex w-full max-w-sm flex-col gap-2">
        {ENVIRONMENTS.map((environment) => (
          <div key={environment.name} className="flex items-center justify-between gap-4">
            <StatusDot tone={environment.tone}>
              <span className="font-mono text-sm text-quebi-fg">{environment.name}</span>
            </StatusDot>
            <Badge intent={environment.tone === "online" ? "success" : "neutral"}>
              {environment.text}
            </Badge>
          </div>
        ))}
      </div>
    ),
  },
]
