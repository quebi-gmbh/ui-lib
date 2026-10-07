"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { SteadyWidth } from "@/lib/steady-width"
import { cn } from "@/lib/utils"
import { Button } from "react-aria-components"

export interface SnippetProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** The command / code to display and copy. */
  text: string
  /** Optional leading prompt symbol, e.g. "$" for a shell command. */
  symbol?: string
  /** Hide the copy button. */
  hideCopy?: boolean
}

/**
 * Snippet — quebi design system
 *
 * A single-line inline code surface (typically a shell command) with a
 * copy-to-clipboard button. An inset area — the raised ground at the control
 * radius, no border — with the command in mono and a quiet copy button at the end.
 */
export function Snippet({
  text,
  symbol = "$",
  hideCopy = false,
  className,
  ...props
}: SnippetProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 overflow-hidden rounded-(--q-radius-control) bg-quebi-raised py-2 ps-4 pe-2",
        className,
      )}
      {...props}
    >
      <pre className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto font-mono text-sm leading-relaxed text-quebi-fg [scrollbar-width:none]">
        {symbol ? (
          <span aria-hidden="true" className="shrink-0 select-none text-quebi-fg-subtle">
            {symbol}
          </span>
        ) : null}
        <code className="whitespace-pre">{text}</code>
      </pre>
      {hideCopy ? null : (
        <Button
          onPress={copy}
          aria-label={copied ? "Copied" : "Copy command"}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-(--q-radius-mark) px-2.5 py-1.5 text-xs font-medium text-quebi-fg-subtle outline-none transition-colors duration-150 hover:bg-quebi-pressed hover:text-quebi-fg focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-inset"
        >
          {copied ? (
            <Check className="size-3.5" strokeWidth={1.5} />
          ) : (
            <Copy className="size-3.5" strokeWidth={1.5} />
          )}
          {/* Both words are known, so the button is the width of the longer of
              them from the first frame. A control that grows on the press is a
              control that moves out from under the pointer that pressed it —
              and this one shrinks back two seconds later, unprompted. */}
          <SteadyWidth candidates={["copy", "copied"]}>{copied ? "copied" : "copy"}</SteadyWidth>
        </Button>
      )}
    </div>
  )
}
