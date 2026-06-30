import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  /** Pre-highlighted Shiki HTML (from the build-time API). */
  html: string
  /** Raw source, used for the copy button. */
  code: string
  className?: string
}

/**
 * Renders build-time Shiki HTML in a quebi-styled surface with a copy button.
 * No syntax highlighter ships to the browser — the HTML is pre-rendered.
 */
export function CodeBlock({ html, code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-quebi-md border border-cyan-500/10 bg-quebi-bg",
        className,
      )}
    >
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-quebi-sm border border-cyan-500/20 bg-quebi-bg/80 px-2.5 py-1.5 text-xs font-medium text-quebi-fg-muted backdrop-blur transition-colors duration-200 hover:border-quebi-brand hover:text-quebi-brand"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <div
        className="code-block max-h-[600px] overflow-auto p-5 text-sm leading-relaxed [&_pre]:bg-transparent! [&_pre]:outline-none"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted build-time Shiki output
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
