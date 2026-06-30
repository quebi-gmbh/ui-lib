"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

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
 * copy-to-clipboard button. Dark code surface, cyan hairline border, and the
 * quebi copy-button styling shared with CodeBlock.
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
        "group flex w-full items-center gap-3 overflow-hidden rounded-quebi-md border border-cyan-500/10 bg-quebi-bg px-4 py-2.5",
        className,
      )}
      {...props}
    >
      <pre className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto font-mono text-sm leading-relaxed text-white [scrollbar-width:none]">
        {symbol ? (
          <span aria-hidden="true" className="shrink-0 select-none text-quebi-brand">
            {symbol}
          </span>
        ) : null}
        <code className="whitespace-pre">{text}</code>
      </pre>
      {hideCopy ? null : (
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy command"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-quebi-sm border border-cyan-500/20 bg-quebi-bg/80 px-2.5 py-1.5 text-xs font-medium text-quebi-fg-muted backdrop-blur transition-colors duration-200 hover:border-quebi-brand hover:text-quebi-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  )
}
