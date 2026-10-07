import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/button"
import { DropZone } from "@/components/drop-zone"
import { Eyebrow } from "@/components/eyebrow"
import { FileTrigger } from "@/components/file-trigger"
import { Note } from "@/components/note"
import { Switch } from "@/components/switch"
import { Code } from "@/components/text"
import { seo } from "@/lib/seo"
import { cn } from "@/lib/utils"
import { applyCustomTheme, clearCustomTheme, hasCustomTheme } from "@/site/custom-theme"
import { Checks, Contract, Editor, Preview } from "@/site/theme-editor"
import { canvasColor, extractTheme } from "@/site/theme-extract"
import {
  checks as runChecks,
  DARK_SELECTORS,
  decodeTheme,
  defaultValues,
  encodeTheme,
  generateCss,
  type ImportResult,
  importTheme,
  type ThemeName,
  type ThemeValues,
  TOKENS,
} from "@/site/theme-import"

export function meta() {
  return seo({
    title: "Theme import and editor",
    description:
      "Upload a design system's HTML file, or start from quebi, and edit every token of a ui-lib theme by hand: colours, type and shape, contrast-checked and previewed live, shareable as a link, downloadable as CSS.",
    path: "/theme",
  })
}

/** The section head the design repeats: a display-s heading, a mono number on the right. */
function SectionHead({ title, count, id }: { title: string; count: string; id?: string }) {
  return (
    <div id={id} className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-quebi-display-s text-quebi-fg">{title}</h2>
      <Eyebrow as="span">{count}</Eyebrow>
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

interface Session {
  name: string
  values: ThemeValues
  /** From an upload; a link or a blank start has none. */
  imported?: ImportResult
  fontFaces: string[]
  notes: string[]
}

const HASH_KEY = "t="

export default function ThemePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState(false)
  const [copied, setCopied] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  // A shared link: the theme travels in the fragment, so it never reaches a server.
  useEffect(() => {
    setApplied(hasCustomTheme())
    const hash = window.location.hash.slice(1)
    if (!hash.startsWith(HASH_KEY)) return
    decodeTheme(hash.slice(HASH_KEY.length))
      .then((values) =>
        setSession({
          name: "shared theme",
          values,
          fontFaces: [],
          notes: ["Loaded from a link. Embedded fonts do not travel in a link; their family names do."],
        }),
      )
      .catch((e) => setError(`This theme link could not be read: ${e instanceof Error ? e.message : String(e)}`))
  }, [])

  // Keep the link current as the theme is edited.
  useEffect(() => {
    if (!session) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const encoded = await encodeTheme(session.values)
      if (cancelled) return
      const url = `${window.location.origin}${window.location.pathname}#${HASH_KEY}${encoded}`
      window.history.replaceState(null, "", url)
      setLink(url)
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [session])

  // The preview boxes need the file's fonts, which are global by nature.
  useEffect(() => {
    if (!session?.fontFaces.length) return
    const el = document.createElement("style")
    el.textContent = session.fontFaces.join("\n")
    document.head.append(el)
    return () => el.remove()
  }, [session?.fontFaces])

  async function load(file: File) {
    setBusy(true)
    setError(null)
    try {
      if (!/\.html?$/i.test(file.name) && file.type !== "text/html") {
        throw new Error(`${file.name} is not an HTML file.`)
      }
      const extraction = await extractTheme(await file.text())
      const imported = importTheme(extraction.source, extraction.probes, canvasColor)
      if (imported.errors.length) throw new Error(imported.errors.join(" "))
      setSession({
        name: file.name.replace(/\.html?$/i, ""),
        values: imported.values,
        imported,
        fontFaces: extraction.fontFaces,
        notes: [...imported.notes, ...extraction.skipped.map((s) => `Ignored ${s}.`)],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function edit(theme: ThemeName, key: string, value: string) {
    setSession((s) => {
      if (!s) return s
      const values = { ...s.values, [theme]: { ...(s.values[theme] ?? {}), [key]: value } }
      return { ...s, values }
    })
  }

  function toggleDark(on: boolean) {
    setSession((s) => {
      if (!s) return s
      const values: ThemeValues = { light: s.values.light }
      if (on) values.dark = s.imported?.values.dark ?? defaultValues().dark
      return { ...s, values }
    })
  }

  const checkList = useMemo(() => (session ? runChecks(session.values, canvasColor) : []), [session])
  const css = useMemo(
    () => (session ? generateCss(session.values, session.fontFaces, session.name) : ""),
    [session],
  )

  return (
    <div className="quebi-shell pt-12 pb-6">
      <Eyebrow>tools — theme import and editor</Eyebrow>
      <h1 className="mt-3 font-display text-quebi-display-l text-quebi-fg">bring your own design system.</h1>
      <p className="mt-5 max-w-[60ch] text-quebi-body text-quebi-fg-muted">
        Upload a design system as one HTML file, or start from quebi's own theme. Every token is then
        yours to edit — colours, type and shape — with a live preview, contrast checks, a link to share
        and a stylesheet to import after <Code>quebi-theme.css</Code>. It all runs in your browser: the
        file is never uploaded and its scripts never run.
      </p>

      <section className="mt-quebi-9">
        <SectionHead title="source" count="01" />
        <DropZone
          className="max-h-none min-h-48 w-full flex-col gap-3"
          getDropOperation={(types) => (types.has("text/html") || types.has("Files") ? "copy" : "cancel")}
          onDrop={async (e) => {
            const item = e.items.find((i) => i.kind === "file")
            if (item && item.kind === "file") load(await item.getFile())
          }}
        >
          <span className="text-quebi-body text-quebi-fg-muted">
            {busy ? "reading…" : "drop a design-system .html file here, or"}
          </span>
          <div className="flex flex-wrap justify-center gap-3">
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
            <Button
              intent="ghost"
              size="sm"
              onPress={() => {
                setError(null)
                setSession({ name: "custom", values: defaultValues(), fontFaces: [], notes: [] })
              }}
            >
              start from quebi
            </Button>
          </div>
        </DropZone>
        {error && (
          <Note intent="danger" className="mt-4">
            {error}
          </Note>
        )}
      </section>

      {session && (
        <>
          <section className="mt-quebi-9" aria-live="polite">
            <SectionHead
              title={session.name}
              count={`${checkList.filter((c) => !c.pass).length} failing checks`}
            />
            {session.notes.map((note) => (
              <p key={note} className="mb-2 max-w-[80ch] text-quebi-body-s text-quebi-fg-muted">
                {note}
              </p>
            ))}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                onPress={() => {
                  applyCustomTheme(css)
                  setApplied(true)
                }}
              >
                apply to this site
              </Button>
              <Button intent="outline" onPress={() => download(css, `${session.name}.quebi-theme.css`)}>
                download css
              </Button>
              <Button
                intent="outline"
                isDisabled={!link}
                onPress={async () => {
                  if (!link) return
                  await navigator.clipboard.writeText(link)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? "link copied" : "copy share link"}
              </Button>
              {applied && (
                <Button
                  intent="ghost"
                  onPress={() => {
                    clearCustomTheme()
                    setApplied(false)
                  }}
                >
                  reset site to quebi
                </Button>
              )}
            </div>
            {link && (
              <p className="mt-3 max-w-full truncate font-mono text-quebi-caption text-quebi-fg-subtle">
                {link.length} characters · {link}
              </p>
            )}
          </section>

          <section className="mt-quebi-9" id="preview">
            <SectionHead title="preview" count={session.values.dark ? "02 themes" : "01 theme"} />
            <div className={cn("grid gap-6", session.values.dark && "lg:grid-cols-2")}>
              <Preview values={session.values} theme="light" />
              {session.values.dark && <Preview values={session.values} theme="dark" />}
            </div>
          </section>

          <section className="mt-quebi-9">
            <SectionHead title="editor" count={`${String(TOKENS.length).padStart(2, "0")} tokens`} />
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-[60ch] text-quebi-body-s text-quebi-fg-muted">
                Any CSS value works: colours in any syntax, lengths, font stacks, shadows. The preview,
                the checks and the link follow every keystroke; a value the page cannot use is marked
                and left out of the CSS.
              </p>
              <Switch isSelected={session.values.dark !== undefined} onChange={toggleDark}>
                dark theme
              </Switch>
            </div>
            <div className="mb-2 hidden grid-cols-[12rem_1fr_1fr] gap-4 md:grid">
              <span />
              <Eyebrow as="span">daylight</Eyebrow>
              <Eyebrow as="span">{session.values.dark ? "cinematic" : ""}</Eyebrow>
            </div>
            <Editor values={session.values} origins={session.imported?.origins} onChange={edit} />
          </section>

          <section className="mt-quebi-9">
            <SectionHead title="contrast" count={`${String(checkList.length).padStart(2, "0")} checks`} />
            <Checks checks={checkList} />
          </section>
        </>
      )}

      {applied && !session && (
        <Note className="mt-quebi-9" intent="info">
          A custom theme is applied to this site in this browser.{" "}
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
        <SectionHead title="what the file must define" count="02" />
        <div className="mb-8 grid max-w-[80ch] gap-3 text-quebi-body text-quebi-fg-muted">
          <p>
            Each token is filled in this order.{" "}
            <strong className="font-medium text-quebi-fg">By name:</strong> a CSS custom property in the
            file's <Code>&lt;style&gt;</Code> blocks (or inline on <Code>&lt;html&gt;</Code>), resolved by
            the browser on <Code>:root</Code>, whose name is one of the names below or ends in one —{" "}
            <Code>--bg-000</Code>, <Code>--ds-bg-000</Code> and <Code>--color-bg-000</Code> all fill{" "}
            <Code>bg</Code>. An exact name beats a prefixed one.
          </p>
          <p>
            <strong className="font-medium text-quebi-fg">By component:</strong> the first class rule
            that looks like a page (<Code>.x-page</Code>), a button (<Code>.x-btn</Code>,{" "}
            <Code>.x-button</Code>, <Code>.x-btn-solid</Code>), an input (<Code>.x-input</Code>,{" "}
            <Code>.x-field input</Code>), a box (<Code>.x-box</Code>, <Code>.x-card</Code>,{" "}
            <Code>.x-panel</Code>) or a checkbox (<Code>.x-check input</Code>) is rendered in a sandbox
            and its computed radius, border, shadow, font and background are read back. That is where
            shape comes from, and it wins over a name — <Code>--bg-000</Code> is the page in one system
            and the card in the next — unless the property is named exactly after the token, like{" "}
            <Code>--radius-control</Code>.
          </p>
          <p>
            <strong className="font-medium text-quebi-fg">Otherwise:</strong> only <Code>bg</Code> and{" "}
            <Code>fg</Code> are required. A missing colour is derived from them; anything else keeps
            quebi's value. The editor shows where each value came from.
          </p>
          <p>
            The dark theme is read with each of these switched on:{" "}
            {DARK_SELECTORS.map((s, i) => (
              <span key={s}>
                {i > 0 && ", "}
                <Code>{s}</Code>
              </span>
            ))}
            . <Code>@font-face</Code> rules with <Code>data:</Code> or absolute URLs come along with an
            upload; a share link carries only font names. Values that could break out of a declaration —{" "}
            <Code>;</Code>, braces, <Code>url()</Code> — are never written.
          </p>
        </div>
        <Contract />
      </section>
    </div>
  )
}
