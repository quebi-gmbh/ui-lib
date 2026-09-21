import { Avatar } from "@/components/avatar"
import { TypingIndicator } from "@/components/typing-indicator"
import type { ComponentExample } from "./types"

export const typingIndicatorExamples: ComponentExample[] = [
  {
    title: "In a conversation",
    description:
      "Three dots in the bubble where the reply will appear. This is the one indicator in the family that means \"a reply is being composed\" rather than \"a process is running\" — there is no throughput to report and nothing to feed it, which is exactly why it is not a shape on Activity Pulse.",
    render: () => (
      <div className="flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-start justify-end gap-2">
          <div className="rounded-quebi-md bg-quebi-brand px-3 py-2 text-sm text-quebi-on-brand">
            Can you summarise the last deploy?
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Avatar initials="AI" size="sm" />
          <div className="rounded-quebi-md border border-quebi-line/10 bg-quebi-elevated px-3 py-2.5">
            <TypingIndicator label="Assistant is replying" className="text-quebi-fg-muted" />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Sizes and colour",
    description:
      "The dots are `bg-current`, so the indicator adopts whatever text token is on it. Keep it muted where it sits inside a bubble the reader is already looking at, and reserve the brand teal for the cases where the indicator is the only thing on the row.",
    render: () => (
      <div className="flex items-center gap-8">
        <TypingIndicator size="sm" className="text-quebi-fg-subtle" />
        <TypingIndicator size="md" className="text-quebi-fg-muted" />
        <TypingIndicator size="lg" className="text-quebi-brand-text" />
      </div>
    ),
  },
  {
    title: "Beside a name",
    description:
      "The dots are `aria-hidden` and `label` is announced once, politely — a 3Hz bounce has nothing to say to a screen reader. Where the name is already on the row, pass the fuller sentence as the label so the announcement is not just \"typing\".",
    render: () => (
      <div className="flex flex-col gap-2">
        {["Lena", "Samir", "Ada"].map((name) => (
          <div key={name} className="flex items-center gap-2 text-sm text-quebi-fg-muted">
            <span className="w-16 text-quebi-fg">{name}</span>
            <TypingIndicator label={`${name} is typing`} />
            <span className="text-xs text-quebi-fg-subtle">is typing…</span>
          </div>
        ))}
      </div>
    ),
  },
]
