import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Checkbox } from "@/components/checkbox"
import { DropZone } from "@/components/drop-zone"
import { Eyebrow } from "@/components/eyebrow"
import { Label } from "@/components/field"
import { FileTrigger } from "@/components/file-trigger"
import { Input } from "@/components/input"
import { Link } from "@/components/link"
import { Note } from "@/components/note"
import { Switch } from "@/components/switch"
import { Code } from "@/components/text"
import { TextField } from "@/components/text-field"
import { seo } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { applyCustomTheme, clearCustomTheme, hasCustomTheme } from "@/site/custom-theme"
import { canvasColor, type Extraction, extractTheme } from "@/site/theme-extract"
import {
  DARK_SELECTORS,
  generateCss,
  type ImportResult,
  importTheme,
  previewStyle,
  type ResolvedToken,
  type ThemeName,
  TOKENS,
} from "@/site/theme-import"

export function meta() {
  return seo({
    title: "Theme import",
    description:
      "Upload a design system's HTML file and turn its CSS custom properties into a quebi ui-lib theme: mapped, contrast-checked, previewed and downloadable. Runs in your browser; the file never leaves it.",
    path: "/theme",
  })
}

/** The section head the design repeats: a display-s heading, a mono number on the right. */
function SectionHead({ title, count }: { title: string; count: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-quebi-display-s text-quebi-fg">{title}</h2>
      <Eyebrow as="span">{count}</Eyebrow>
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, "0")

const KIND_LABEL = { color: "colour", font: "font stack", length: "length", shadow: "box-shadow" } as const

/** The contract: every token, the names that fill it, and what happens when none does. */
function Contract() {
  return (
    <div className="border-t border-quebi-rule">
      <div className="hidden grid-cols-[9rem_1fr_1fr_11rem] gap-4 border-b border-b-quebi-rule py-2 md:grid">
        <Eyebrow as="span">token</Eyebrow>
        <Eyebrow as="span">recognised names</Eyebrow>
        <Eyebrow as="span">paints</Eyebrow>
        <Eyebrow as="span">if missing</Eyebrow>
      </div>
      {TOKENS.map((spec) => (
        <div
          key={spec.key}
          className="grid grid-cols-1 gap-1 border-b border-quebi-hairline py-3 md:grid-cols-[9rem_1fr_1fr_11rem] md:gap-4"
        >
          <div>
            <p className="font-mono text-quebi-code text-quebi-fg">{spec.key}</p>
            <p className="text-quebi-caption text-quebi-fg-subtle">
              {KIND_LABEL[spec.kind]}
              {spec.perTheme ? " · per theme" : ""}
            </p>
          </div>
          <p className="font-mono text-quebi-caption text-quebi-fg-muted">
            {spec.names.map((n) => `--${n}`).join("  ")}
          </p>
          <p className="text-quebi-body-s text-quebi-fg-muted">{spec.role}</p>
          <p className="text-quebi-caption text-quebi-fg-subtle">
            {spec.required ? (
              <span className="font-medium text-quebi-fg">required</span>
            ) : spec.fallback ? (
              <>derived: {spec.fallback.note}</>
            ) : (
              "library default"
            )}
          </p>
        </div>
      ))}
    </div>
  )
}

function Swatch({ token }: { token?: ResolvedToken }) {
  if (!token?.value) return <span className="text-quebi-caption text-quebi-fg-subtle">default</span>
  if (token.spec.kind !== "color") {
    return <span className="font-mono text-quebi-caption break-all text-quebi-fg-muted">{token.value}</span>
  }
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-5 shrink-0 border border-quebi-hairline"
        style={{ backgroundColor: token.value }}
      />
      <span className="font-mono text-quebi-caption text-quebi-fg-muted">{token.value}</span>
    </span>
  )
}

function originText(token?: ResolvedToken) {
  if (!token) return ""
  switch (token.origin.kind) {
    case "found":
      return `--${token.origin.property}`
    case "derived":
      return `derived: ${token.origin.note}`
    case "unparsable":
      return `--${token.origin.property} unreadable`
    default:
      return "library default"
  }
}

/** What was found, theme by theme. */
function Mapping({ result }: { result: ImportResult }) {
  const themes = (["light", "dark"] as ThemeName[]).filter((t) => result.themes[t])
  return (
    <div className="border-t border-quebi-rule">
      {TOKENS.map((spec) => (
        <div
          key={spec.key}
          className="grid grid-cols-1 gap-2 border-b border-quebi-hairline py-3 md:grid-cols-[9rem_1fr_1fr] md:gap-4"
        >
          <p className="font-mono text-quebi-code text-quebi-fg">{spec.key}</p>
          {themes.map((theme) => {
            const token = result.themes[theme]?.[spec.key]
            return (
              <div key={theme} className="min-w-0">
                {themes.length > 1 && <Eyebrow as="span">{theme}</Eyebrow>}
                <Swatch token={token} />
                <p className="mt-1 font-mono text-quebi-caption text-quebi-fg-subtle">{originText(token)}</p>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function Checks({ result }: { result: ImportResult }) {
  const failing = result.checks.filter((c) => !c.pass)
  return (
    <div>
      <p className="mb-4 text-quebi-body text-quebi-fg-muted">
        {failing.length === 0
          ? `All ${result.checks.length} contrast checks pass.`
          : `${failing.length} of ${result.checks.length} contrast checks fail. The theme still applies; fix these in the source file.`}
      </p>
      <div className="border-t border-quebi-rule">
        {result.checks.map((c) => (
          <div
            key={`${c.theme}-${c.label}`}
            className="grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-3 gap-y-1 border-b border-quebi-hairline py-2 sm:grid-cols-[5rem_1fr_auto_auto] sm:gap-x-4"
          >
            <Eyebrow as="span">{c.theme}</Eyebrow>
            <span className="min-w-0 text-quebi-body-s text-quebi-fg-muted">{c.label}</span>
            <span className="col-start-2 font-mono text-quebi-caption text-quebi-fg sm:col-start-auto">
              {c.ratio.toFixed(2)}:1 / {c.min}
            </span>
            <Badge intent={c.pass ? "success" : "danger"} className="col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto">{c.pass ? "pass" : "fail"}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The library, painted with the imported theme only inside this box. */
function Preview({ result, theme }: { result: ImportResult; theme: ThemeName }) {
  return (
    <div
      style={previewStyle(result, theme) as React.CSSProperties}
      className="flex flex-col gap-5 border border-quebi-hairline bg-quebi-bg p-6 font-sans text-quebi-fg"
    >
      <Eyebrow>{theme === "light" ? "daylight" : "cinematic"} — preview</Eyebrow>
      <h3 className="font-display text-quebi-display-s">components for your app.</h3>
      <p className="text-quebi-body text-quebi-fg-muted">
        Running text in the body ink, with an <Link href="#preview">inline link</Link> and a caption
        below.
      </p>
      <TextField className="max-w-72">
        <Label>email</Label>
        <Input placeholder="you@company.com" />
      </TextField>
      <div className="flex flex-wrap items-center gap-3">
        <Button>send message</Button>
        <Button intent="outline">cancel</Button>
        <Button intent="secondary">preview</Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Checkbox defaultSelected>remember me</Checkbox>
        <Switch defaultSelected>notifications</Switch>
        <Badge>typescript</Badge>
        <Badge intent="danger">overdue</Badge>
      </div>
    </div>
  )
}

function download(css: string, name: string) {
  const url = URL.createObjectURL(new Blob([css], { type: "text/css" }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

interface Loaded {
  fileName: string
  extraction: Extraction
  result: ImportResult
  css: string
}

export default function ThemeImport() {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => setApplied(hasCustomTheme()), [])

  // The preview boxes need the file's fonts, which are global by nature.
  useEffect(() => {
    if (!loaded?.extraction.fontFaces.length) return
    const el = document.createElement("style")
    el.textContent = loaded.extraction.fontFaces.join("\n")
    document.head.append(el)
    return () => el.remove()
  }, [loaded])

  async function load(file: File) {
    setBusy(true)
    setError(null)
    try {
      if (!/\.html?$/i.test(file.name) && file.type !== "text/html") {
        throw new Error(`${file.name} is not an HTML file.`)
      }
      const extraction = await extractTheme(await file.text())
      const result = importTheme(extraction.source, canvasColor)
      const css = generateCss(result, extraction.fontFaces, file.name)
      setLoaded({ fileName: file.name, extraction, result, css })
    } catch (e) {
      setLoaded(null)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const found = useMemo(() => {
    const light = loaded?.result.themes.light
    return light ? Object.values(light).filter((t) => t.origin.kind === "found").length : 0
  }, [loaded])

  const ok = loaded && loaded.result.errors.length === 0

  return (
    <div className="quebi-shell pt-12 pb-6">
      <Eyebrow>tools — theme import</Eyebrow>
      <h1 className="mt-3 font-display text-quebi-display-l text-quebi-fg">bring your own design system.</h1>
      <p className="mt-5 max-w-[60ch] text-quebi-body text-quebi-fg-muted">
        Upload a design system as one HTML file. This page reads the CSS custom properties it declares,
        maps them onto the tokens ui-lib paints with, checks their contrast, and gives you a
        stylesheet to import after <Code>quebi-theme.css</Code>. Everything happens in your browser:
        the file is never uploaded anywhere, and its scripts never run.
      </p>

      <section className="mt-quebi-9">
        <SectionHead title="upload" count="01" />
        <DropZone
          className="max-h-none min-h-48 w-full flex-col gap-3"
          getDropOperation={(types) => (types.has("text/html") || types.has("Files") ? "copy" : "cancel")}
          onDrop={async (e) => {
            const item = e.items.find((i) => i.kind === "file")
            if (item && item.kind === "file") load(await item.getFile())
          }}
        >
          <span className="text-quebi-body text-quebi-fg-muted">
            {busy ? "reading…" : loaded ? loaded.fileName : "drop a design-system .html file here, or"}
          </span>
          <FileTrigger
            acceptedFileTypes={["text/html", ".html", ".htm"]}
            isPending={busy}
            onSelect={(files) => {
              const file = files?.[0]
              if (file) load(file)
            }}
          >
            choose a file
          </FileTrigger>
        </DropZone>
        {error && (
          <Note intent="danger" className="mt-4">
            {error}
          </Note>
        )}
      </section>

      {loaded && (
        <>
          <section className="mt-quebi-9" aria-live="polite">
            <SectionHead title="result" count={`${pad(found)} of ${pad(TOKENS.length)} found`} />
            {loaded.result.errors.length > 0 && (
              <Note intent="danger" className="mb-4">
                {loaded.result.errors.join(" ")}
              </Note>
            )}
            {[...loaded.result.notes, ...loaded.extraction.skipped.map((s) => `Ignored ${s}.`)].map(
              (note) => (
                <p key={note} className="mb-2 max-w-[80ch] text-quebi-body-s text-quebi-fg-muted">
                  {note}
                </p>
              ),
            )}
            {ok && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onPress={() => {
                    applyCustomTheme(loaded.css)
                    setApplied(true)
                  }}
                >
                  apply to this site
                </Button>
                <Button
                  intent="outline"
                  onPress={() => download(loaded.css, `${loaded.fileName.replace(/\.html?$/i, "")}.quebi-theme.css`)}
                >
                  download css
                </Button>
              </div>
            )}
          </section>

          {ok && (
            <>
              <section className="mt-quebi-9" id="preview">
                <SectionHead title="preview" count="02 themes" />
                <div className={cn("grid gap-6", loaded.result.themes.dark && "lg:grid-cols-2")}>
                  <Preview result={loaded.result} theme="light" />
                  {loaded.result.themes.dark && <Preview result={loaded.result} theme="dark" />}
                </div>
              </section>

              <section className="mt-quebi-9">
                <SectionHead title="mapping" count={`${pad(TOKENS.length)} tokens`} />
                <Mapping result={loaded.result} />
              </section>

              <section className="mt-quebi-9">
                <SectionHead title="contrast" count={`${pad(loaded.result.checks.length)} checks`} />
                <Checks result={loaded.result} />
              </section>
            </>
          )}
        </>
      )}

      {applied && (
        <Note className="mt-quebi-9" intent="info">
          An imported theme is applied to this site in this browser.{" "}
          <Button
            intent="ghost"
            size="xs"
            onPress={() => {
              clearCustomTheme()
              setApplied(false)
            }}
          >
            reset to quebi
          </Button>
        </Note>
      )}

      <section className="mt-quebi-10">
        <SectionHead title="what the file must define" count={`${pad(TOKENS.length)} tokens`} />
        <div className="mb-8 grid max-w-[80ch] gap-3 text-quebi-body text-quebi-fg-muted">
          <p>
            Tokens are read from <strong className="font-medium text-quebi-fg">CSS custom properties</strong>{" "}
            in the file's <Code>&lt;style&gt;</Code> blocks — or inline on <Code>&lt;html&gt;</Code> —
            as the browser resolves them on <Code>:root</Code>, so <Code>var()</Code> chains and any
            colour syntax work. External stylesheets are not fetched.
          </p>
          <p>
            A property fills a token when its name is one of the recognised names below, or ends in
            one: <Code>--bg-000</Code>, <Code>--ds-bg-000</Code> and <Code>--color-bg-000</Code> all fill{" "}
            <Code>bg</Code>. The first name in the list wins; an exact name beats a prefixed one.
          </p>
          <p>
            Only <Code>bg</Code> and <Code>fg</Code> are required. Every other colour falls back to a
            value derived from them, and the result lists which ones were derived.
          </p>
          <p>
            The dark theme is read with each of these switched on: {DARK_SELECTORS.map((s, i) => (
              <span key={s}>
                {i > 0 && ", "}
                <Code>{s}</Code>
              </span>
            ))}
            . If nothing changes, only Daylight is generated.
          </p>
          <p>
            <Code>@font-face</Code> rules with <Code>data:</Code> or absolute URLs are carried into the
            theme; relative ones are skipped. Fonts are then picked up through{" "}
            <Code>--font-display</Code>, <Code>--font-text</Code> and <Code>--font-mono</Code>.
          </p>
          <p>
            What a theme does not change is shape: buttons, inputs and cards stay square and ruled,
            whatever the file's radii say — <Code>radius-s</Code> rounds only menus, popovers and
            tooltips. The quebi logo is an image and keeps its own ink.
          </p>
        </div>
        <Contract />
      </section>
    </div>
  )
}
