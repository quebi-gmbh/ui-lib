import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import { Button } from "@/components/button"
import { Card } from "@/components/card"
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
 *
 * The surface is a Card, not a hand-built rounded+bordered div: this is site
 * code, so the same rule that would catch the div in a consumer's app catches
 * it here. `p-0` moves the padding onto the scroll container so the scrollbar
 * runs the full height of the block, and `bg-quebi-bg` is the code surface —
 * a shade darker than a Card's default fill, so highlighted source reads as
 * code rather than as prose.
 */
export function CodeBlock({ html, code, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={cn("group relative overflow-hidden bg-quebi-bg p-0", className)}>
      <Button
        intent="outline"
        size="xs"
        onPress={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        // Position and the backdrop that keeps the label legible over code are
        // this control's context, not its appearance — intent/size own the rest.
        className="absolute top-3 right-3 z-10 bg-quebi-bg/80 backdrop-blur"
      >
        {copied ? <Check data-slot="icon" /> : <Copy data-slot="icon" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <OverlayScrollbarsComponent
        defer
        options={{ scrollbars: { theme: "os-theme-quebi", autoHide: "leave", autoHideDelay: 600 } }}
        className="code-block max-h-150 p-5 text-sm leading-relaxed [&_pre]:bg-transparent! [&_pre]:outline-none"
      >
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: `html` is Shiki output produced at build time by scripts/generate-api.ts from source in this repo — there is no path by which user input reaches it. */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </OverlayScrollbarsComponent>
    </Card>
  )
}
