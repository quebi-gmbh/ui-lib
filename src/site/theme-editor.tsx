/**
 * The parts of the /theme page that render a theme: the token editor, the
 * scoped preview, the contrast checks, and the contract table. All of them
 * take `ThemeValues` and nothing else, so an imported theme, one loaded from
 * a link and one typed by hand are the same thing by the time they get here.
 */
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Card, CardDescription, CardTitle } from "@/components/card"
import { Checkbox } from "@/components/checkbox"
import { Eyebrow } from "@/components/eyebrow"
import { Label } from "@/components/field"
import { Input } from "@/components/input"
import { Link } from "@/components/link"
import { Switch } from "@/components/switch"
import { TextField } from "@/components/text-field"
import { ToggleGroup, ToggleGroupItem } from "@/components/toggle-group"
import { cn } from "@/lib/utils"
import { canvasColor } from "@/site/theme-extract"
import {
  type Check,
  defaultOf,
  GROUP_LABEL,
  isSafeValue,
  type Origin,
  previewStyle,
  type ThemeName,
  type ThemeValues,
  TOKENS,
  type TokenSpec,
} from "@/site/theme-import"

const pad = (n: number) => String(n).padStart(2, "0")

const KIND_LABEL: Record<TokenSpec["kind"], string> = {
  color: "colour",
  font: "font stack",
  length: "length",
  shadow: "box-shadow",
  choice: "choice",
  image: "background-image",
}

const GROUPS = Object.keys(GROUP_LABEL) as TokenSpec["group"][]

function originText(origin?: Origin) {
  if (!origin) return ""
  switch (origin.kind) {
    case "found":
      return `--${origin.property}`
    case "probed":
      return origin.selector
    case "derived":
      return `derived: ${origin.note}`
    default:
      return "library default"
  }
}

/** Whether a typed value is usable for its token: a colour the browser reads, or safe CSS. */
function valid(spec: TokenSpec, value: string) {
  if (!isSafeValue(value)) return false
  if (spec.kind === "color") return /^var\(--q-[a-z-]+\)$/.test(value.trim()) || canvasColor(value) !== null
  if (spec.kind === "choice") return spec.choices?.includes(value) ?? false
  return value.trim().length > 0
}

function ValueInput({
  spec,
  theme,
  value,
  onChange,
}: {
  spec: TokenSpec
  theme: ThemeName
  value: string
  onChange: (value: string) => void
}) {
  if (spec.kind === "choice") {
    return (
      <ToggleGroup
        aria-label={`${spec.key} (${theme})`}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const next = [...keys][0]
          if (typeof next === "string") onChange(next)
        }}
      >
        {spec.choices?.map((c) => (
          <ToggleGroupItem key={c} id={c} size="xs">
            {c}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    )
  }
  const ok = valid(spec, value)
  return (
    <div className="flex min-w-0 items-center gap-2">
      {spec.kind === "color" && (
        <span
          aria-hidden="true"
          className="size-5 shrink-0 border border-quebi-hairline"
          style={{ background: ok && !value.startsWith("var(") ? value : undefined }}
        />
      )}
      <TextField
        aria-label={`${spec.key} (${theme === "light" ? "daylight" : "cinematic"})`}
        value={value}
        onChange={onChange}
        isInvalid={!ok}
        className="min-w-0 flex-1"
      >
        <Input size="xs" className="font-mono" placeholder={defaultOf(spec, theme)} spellCheck={false} />
      </TextField>
    </div>
  )
}

/** Every token, grouped, with an input per theme. */
export function Editor({
  values,
  origins,
  onChange,
}: {
  values: ThemeValues
  origins?: { light: Record<string, Origin>; dark?: Record<string, Origin> }
  onChange: (theme: ThemeName, key: string, value: string) => void
}) {
  const hasDark = values.dark !== undefined
  return (
    <div className="flex flex-col gap-quebi-8">
      {GROUPS.map((group) => {
        const specs = TOKENS.filter((t) => t.group === group)
        return (
          <div key={group}>
            <Eyebrow className="mb-2">{GROUP_LABEL[group]}</Eyebrow>
            <div className="border-t border-quebi-rule">
              {specs.map((spec) => (
                <div
                  key={spec.key}
                  className={cn(
                    "grid grid-cols-1 items-center gap-2 border-b border-quebi-hairline py-2.5",
                    "md:grid-cols-[12rem_1fr_1fr] md:gap-4",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-quebi-code text-quebi-fg">{spec.key}</p>
                    <p className="text-quebi-caption text-quebi-fg-subtle">{spec.role}</p>
                    {origins && (
                      <p className="truncate font-mono text-quebi-caption text-quebi-fg-subtle">
                        {originText(origins.light[spec.key])}
                      </p>
                    )}
                  </div>
                  <ValueInput
                    spec={spec}
                    theme="light"
                    value={values.light[spec.key] ?? ""}
                    onChange={(v) => onChange("light", spec.key, v)}
                  />
                  {spec.perTheme && hasDark ? (
                    <ValueInput
                      spec={spec}
                      theme="dark"
                      value={values.dark?.[spec.key] ?? ""}
                      onChange={(v) => onChange("dark", spec.key, v)}
                    />
                  ) : (
                    <span className="hidden text-quebi-caption text-quebi-fg-subtle md:block">
                      {spec.perTheme ? "" : "both themes"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** The library, painted with the theme only inside this box. */
export function Preview({ values, theme }: { values: ThemeValues; theme: ThemeName }) {
  return (
    <div
      style={previewStyle(values, theme) as React.CSSProperties}
      className="flex flex-col gap-5 border border-quebi-hairline bg-quebi-bg bg-(image:--q-page-image) bg-size-(--q-page-image-size) p-6 font-sans text-quebi-fg"
    >
      <Eyebrow>{theme === "light" ? "daylight" : "cinematic"} — preview</Eyebrow>
      <h3 className="font-display text-quebi-display-s">components for your app.</h3>
      <Card>
        <CardTitle>quarterly report</CardTitle>
        <CardDescription className="mt-2">
          Running text in the body ink, with an <Link href="#preview">inline link</Link>.
        </CardDescription>
      </Card>
      <TextField className="max-w-72">
        <Label>email</Label>
        <Input placeholder="you@company.com" />
      </TextField>
      <div className="flex flex-wrap items-center gap-3">
        <Button>send message</Button>
        <Button intent="outline">cancel</Button>
        <Button intent="ghost">skip</Button>
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

export function Checks({ checks }: { checks: Check[] }) {
  const failing = checks.filter((c) => !c.pass)
  return (
    <div>
      <p className="mb-4 text-quebi-body text-quebi-fg-muted">
        {failing.length === 0
          ? `All ${checks.length} contrast checks pass.`
          : `${failing.length} of ${checks.length} contrast checks fail. The theme still applies.`}
      </p>
      <div className="border-t border-quebi-rule">
        {checks.map((c) => (
          <div
            key={`${c.theme}-${c.label}`}
            className="grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-3 gap-y-1 border-b border-quebi-hairline py-2 sm:grid-cols-[5rem_1fr_auto_auto] sm:gap-x-4"
          >
            <Eyebrow as="span">{c.theme}</Eyebrow>
            <span className="min-w-0 text-quebi-body-s text-quebi-fg-muted">{c.label}</span>
            <span className="col-start-2 font-mono text-quebi-caption text-quebi-fg sm:col-start-auto">
              {c.ratio.toFixed(2)}:1 / {c.min}
            </span>
            <Badge
              intent={c.pass ? "success" : "danger"}
              className="col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto"
            >
              {c.pass ? "pass" : "fail"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The contract: every token, how it is found, and what happens when it is not. */
export function Contract() {
  return (
    <div className="border-t border-quebi-rule">
      <div className="hidden grid-cols-[10rem_1fr_1fr_10rem] gap-4 border-b border-b-quebi-rule py-2 md:grid">
        <Eyebrow as="span">token</Eyebrow>
        <Eyebrow as="span">found by</Eyebrow>
        <Eyebrow as="span">paints</Eyebrow>
        <Eyebrow as="span">if missing</Eyebrow>
      </div>
      {TOKENS.map((spec) => (
        <div
          key={spec.key}
          className="grid grid-cols-1 gap-1 border-b border-quebi-hairline py-3 md:grid-cols-[10rem_1fr_1fr_10rem] md:gap-4"
        >
          <div>
            <p className="font-mono text-quebi-code text-quebi-fg">{spec.key}</p>
            <p className="text-quebi-caption text-quebi-fg-subtle">
              {KIND_LABEL[spec.kind]}
              {spec.perTheme ? " · per theme" : ""}
            </p>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-quebi-caption break-words text-quebi-fg-muted">
              {spec.names.map((n) => `--${n}`).join("  ")}
            </p>
            {spec.probe && <p className="mt-1 text-quebi-caption text-quebi-fg-subtle">or: {spec.probe}</p>}
          </div>
          <p className="text-quebi-body-s text-quebi-fg-muted">{spec.role}</p>
          <p className="text-quebi-caption text-quebi-fg-subtle">
            {spec.required ? (
              <span className="font-medium text-quebi-fg">required</span>
            ) : spec.fallback ? (
              <>derived: {spec.fallback.note}</>
            ) : (
              <>
                default <span className="font-mono">{defaultOf(spec, "light")}</span>
              </>
            )}
          </p>
        </div>
      ))}
      <p className="mt-3 text-quebi-caption text-quebi-fg-subtle">{pad(TOKENS.length)} tokens.</p>
    </div>
  )
}
