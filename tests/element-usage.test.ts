/**
 * Element-usage rules: does each selector fire on what the rule forbids, stay
 * quiet on what it allows, and — where it cannot see something — miss it in a
 * way we have written down?
 *
 * Each rule gets four kinds of case:
 *   true positive   violating code, must fire
 *   true negative   the same intent done right, must not fire
 *   false positive  a near-miss that looks like a violation but is not
 *   false negative  a known blind spot, asserted so it stays visible
 *
 * The false-negative tests assert the *miss*. If a selector is sharpened later,
 * they fail — which is the point: they are a list of what these checks cannot
 * do, and the list should only ever shrink deliberately.
 */
import { describe, expect, test } from "bun:test"
import { rulesRegistry } from "../src/registry/rules"
import { component, fireCount, fires } from "./harness"

const RULE = "no-raw-interactive-elements"

describe(RULE, () => {
  test.each([
    ["button", `<button onClick={props.onClick}>Save</button>`],
    ["a", `<a href="/pricing">Pricing</a>`],
    ["input", `<input type="email" name="email" />`],
    ["select", `<select name="plan"><option>Free</option></select>`],
    ["textarea", `<textarea name="bio" />`],
    ["label", `<label htmlFor="email">Email</label>`],
    ["form", `<form action="/signup">{props.children}</form>`],
    ["dialog", `<dialog open>{props.children}</dialog>`],
    ["table", `<table><tbody>{props.rows}</tbody></table>`],
  ])("true positive: <%s> is reported", (_element, jsx) => {
    expect(fires(RULE, component(`    ${jsx}`))).toBe(true)
  })

  test("true positive: an unstyled element is reported too — styling is not the axis", () => {
    expect(fires(RULE, component(`    <button>Close</button>`))).toBe(true)
  })

  test.each([
    ["Button", `<Button onPress={props.onPress}>Save</Button>`],
    ["Link", `<Link href="/pricing">Pricing</Link>`],
    ["TextField", `<TextField><Label>Email</Label><Input /></TextField>`],
    ["Modal", `<Modal><Dialog>{props.children}</Dialog></Modal>`],
  ])("true negative: <%s> is allowed", (_component, jsx) => {
    expect(fires(RULE, component(`    ${jsx}`))).toBe(false)
  })

  test.each([
    ["layout elements", `<div className="flex gap-3"><span>ok</span></div>`],
    ["other semantics", `<section><h2>Heading</h2><p>Body</p></section>`],
    ["lists", `<ul><li>One</li></ul>`],
  ])("true negative: %s are untouched", (_case, jsx) => {
    expect(fires(RULE, component(`    ${jsx}`))).toBe(false)
  })

  test("no false positive: a component whose name merely contains a banned word", () => {
    const code = component(`    <TableToolbar><InputGroup /><ButtonGroup /></TableToolbar>`)
    expect(fires(RULE, code)).toBe(false)
  })

  test("no false positive: the element name appearing in a string or a prop", () => {
    const code = component(`    <Note title="Use <button> only inside the library">{props.children}</Note>`)
    expect(fires(RULE, code)).toBe(false)
  })

  test("known blind spot: an element rendered through a variable is missed", () => {
    // <El /> where El = "button". The selector reads the JSX name, which here is
    // an identifier, not the intrinsic it resolves to at runtime.
    const code = `const El = "button" as const\n${component(`    <El onClick={props.onClick}>Save</El>`)}`
    expect(fires(RULE, code)).toBe(false)
  })

  test("known blind spot: React.createElement is missed", () => {
    const code = `import { createElement } from "react"\nexport const Save = () => createElement("button", null, "Save")\n`
    expect(fires(RULE, code)).toBe(false)
  })

  test("each violation is reported once, not once per enclosing element", () => {
    const code = component(`    <div className="flex"><span><button>Save</button></span></div>`)
    expect(fireCount(RULE, code)).toBe(1)
  })
})

const APPEARANCE = "no-appearance-classes-on-layout-elements"

describe(APPEARANCE, () => {
  test("true positive: a div rebuilding a Card surface", () => {
    const code = component(
      `    <div className="rounded-quebi-md border border-quebi-line/10 bg-quebi-surface/[0.02] p-6">{props.children}</div>`,
    )
    expect(fires(APPEARANCE, code)).toBe(true)
  })

  test("true positive: the same class list assembled in a cn() call", () => {
    const code = component(
      `    <div className={cn("rounded-quebi-md border border-quebi-line/10 p-6", props.className)}>{props.children}</div>`,
    )
    expect(fires(APPEARANCE, code)).toBe(true)
  })

  test("true negative: layout and spacing only", () => {
    const code = component(`    <div className="flex items-center gap-3 p-4">{props.children}</div>`)
    expect(fires(APPEARANCE, code)).toBe(false)
  })

  test("true negative: a Card is used instead of rebuilt", () => {
    const code = component(`    <Card interactive><CardTitle>{props.title}</CardTitle></Card>`)
    expect(fires(APPEARANCE, code)).toBe(false)
  })

  test("no false positive: page chrome carrying a background but no surface", () => {
    // The deliberate narrowing. Flagging every appearance class made this fire on
    // a page header, and a check that cries wolf gets switched off.
    const code = component(`    <header className="sticky top-0 bg-quebi-bg">{props.children}</header>`)
    expect(fires(APPEARANCE, code)).toBe(false)
  })

  test("no false positive: a radius with no border is not a surface", () => {
    const code = component(`    <div className="h-8 w-8 rounded-full">{props.children}</div>`)
    expect(fires(APPEARANCE, code)).toBe(false)
  })

  test("known blind spot: a class list built with a template literal is missed", () => {
    const code = component(
      // biome-ignore lint/suspicious/noTemplateCurlyInString: the string is the fixture's source text, not a template literal that lost its backticks — the interpolation is the whole point of the case.
      "    <div className={`rounded-quebi-md ${props.tone} border border-quebi-line/10`}>{props.children}</div>",
    )
    expect(fires(APPEARANCE, code)).toBe(false)
  })

  test("known blind spot: the wider policy (bg/shadow/text sizing) is review-only", () => {
    // Documented in the rule: only the radius+border signature is linted.
    const code = component(`    <div className="bg-quebi-surface p-4 text-lg font-semibold">{props.children}</div>`)
    expect(fires(APPEARANCE, code)).toBe(false)
  })
})

const TOKENS = "no-hardcoded-design-values"

describe(TOKENS, () => {
  test.each([
    ["an arbitrary hex", `<div className="bg-[#0ea5e9]">{props.children}</div>`],
    ["a raw palette scale", `<p className="text-gray-500">{props.children}</p>`],
    ["an arbitrary size", `<div className="min-h-[120px]">{props.children}</div>`],
  ])("true positive: %s is reported", (_case, jsx) => {
    expect(fires(TOKENS, component(`    ${jsx}`))).toBe(true)
  })

  test("true negative: quebi tokens", () => {
    const code = component(
      `    <div className="rounded-quebi-md bg-quebi-bg p-4 text-base text-quebi-fg-muted">{props.children}</div>`,
    )
    expect(fires(TOKENS, code)).toBe(false)
  })

  test("no false positive: an arbitrary *opacity* on a token is not a hardcoded value", () => {
    // bg-quebi-surface/[0.02] is a token with a modifier. The selector requires a
    // unit or a hex inside the brackets, which is what keeps this quiet.
    const code = component(`    <div className="bg-quebi-surface/[0.02] p-4">{props.children}</div>`)
    expect(fires(TOKENS, code)).toBe(false)
  })

  test("no false positive: a hex in ordinary prose or data", () => {
    const code = `export const commit = "#0ea5e9 is the old brand colour"\n`
    expect(fires(TOKENS, code)).toBe(false)
  })

  test("known blind spot: a hex in a style prop is missed", () => {
    // The rule forbids it; the selector only reads class strings. Documented in
    // the rule's own violating list and its enforcement note.
    const code = component(`    <div style={{ color: "#0ea5e9" }}>{props.children}</div>`)
    expect(fires(TOKENS, code)).toBe(false)
  })

  test("known blind spot: stylesheets are out of reach", () => {
    // A JSX selector cannot see .css at all — the rule says to pair it with a
    // CSS-side check.
    expect(fires(TOKENS, `.badge { background: #0ea5e9; }`, "src/app.css")).toBe(false)
  })
})

const PRIMITIVES = "import-components-not-primitives"

describe(PRIMITIVES, () => {
  test("true positive: a primitive imported straight into app code", () => {
    expect(fires(PRIMITIVES, `import { Button } from "react-aria-components"\n`)).toBe(true)
  })

  test("true positive: any of the ~114 primitives the library wraps", () => {
    for (const name of ["TextField", "ListBox", "Modal", "ColorSwatch"]) {
      expect(fires(PRIMITIVES, `import { ${name} } from "react-aria-components"\n`)).toBe(true)
    }
  })

  test("true positive: renaming it does not hide it", () => {
    expect(
      fires(PRIMITIVES, `import { Button as AriaButton } from "react-aria-components"\n`),
    ).toBe(true)
  })

  test("true negative: the quebi component", () => {
    expect(fires(PRIMITIVES, `import { Button } from "@/components/button"\n`)).toBe(false)
  })

  test("no false positive: type-only imports are erased, so they stay allowed", () => {
    // The reason this rule is a deny-list: an allow-list flags this, and it
    // appears all over legitimate app code.
    expect(
      fires(PRIMITIVES, `import type { DateValue, Selection } from "react-aria-components"\n`),
    ).toBe(false)
  })

  test("no false positive: helpers the library does not wrap", () => {
    expect(
      fires(PRIMITIVES, `import { parseColor, useLocale } from "react-aria-components"\n`),
    ).toBe(false)
  })

  test("the library itself may import primitives — that is what it is for", () => {
    const code = `import { Button } from "react-aria-components"\n`
    expect(fires(PRIMITIVES, code, "components/ui/button.tsx")).toBe(false)
    expect(fires(PRIMITIVES, code, "src/components/button.tsx")).toBe(false)
  })

  test("known blind spot: a re-export chain reaching react-aria by another name", () => {
    // The check reads import sources; it cannot follow `export * from` through a
    // local module that re-exports the primitive.
    const code = `import { Button } from "@/lib/re-exports"\n`
    expect(fires(PRIMITIVES, code)).toBe(false)
  })
})

const LENGTH = "keep-files-readable"

const lines = (n: number) =>
  Array.from({ length: n }, (_, i) => `export const value${i} = ${i}`).join("\n")

describe(LENGTH, () => {
  test("true positive: a file past the limit", () => {
    expect(fires(LENGTH, lines(520))).toBe(true)
  })

  test("true negative: a file under it", () => {
    expect(fires(LENGTH, lines(480))).toBe(false)
  })

  test("the boundary is where the rule says it is", () => {
    expect(fires(LENGTH, lines(500))).toBe(false)
    expect(fires(LENGTH, lines(501))).toBe(true)
  })

  test("it warns rather than fails — the number is a prompt, not a law", () => {
    const rule = rulesRegistry.find((r) => r.id === LENGTH)
    expect(rule?.severity).toBe("warn")
  })

  test("vendored library source is exempt: you cannot split what you did not write", () => {
    expect(fires(LENGTH, lines(900), "components/ui/sidebar.tsx")).toBe(false)
  })

  test("known blind spot: it counts lines, not responsibilities", () => {
    // 480 lines of imports and comments passes; a 200-line file doing four jobs
    // passes too. The rule is a proxy, and this is the shape of its error.
    const commentary = Array.from({ length: 480 }, (_, i) => `// note ${i}`).join("\n")
    expect(fires(LENGTH, commentary)).toBe(false)
  })
})

const FORMAT = "format-values-through-the-library"

describe(FORMAT, () => {
  test("true positive: a bare toLocaleString(), the shape with no locale at all", () => {
    expect(fires(FORMAT, component(`    <span>{props.value.toLocaleString()}</span>`))).toBe(true)
  })

  test("true positive: the date and time variants", () => {
    expect(fires(FORMAT, component(`    <span>{props.date.toLocaleDateString()}</span>`))).toBe(true)
    expect(fires(FORMAT, component(`    <span>{props.date.toLocaleTimeString("de")}</span>`))).toBe(
      true,
    )
  })

  test("true positive: an Intl formatter constructed inline", () => {
    const code = `const nf = new Intl.NumberFormat("de-DE")\n`
    expect(fires(FORMAT, code)).toBe(true)
    expect(fires(FORMAT, `const df = new Intl.DateTimeFormat()\n`)).toBe(true)
    expect(fires(FORMAT, `const rtf = new Intl.RelativeTimeFormat("de")\n`)).toBe(true)
  })

  test("true negative: the library formatters", () => {
    expect(fires(FORMAT, component(`    <FormattedNumber value={props.value} />`))).toBe(false)
    const helper = `import { formatNumber } from "@/components/formatted-number"\nexport const label = formatNumber(props.value, "de-DE")\n`
    expect(fires(FORMAT, helper)).toBe(false)
  })

  test("true negative: a project formatter of your own is allowed to call Intl", () => {
    // The opt-out written into the pattern: a function declaration named
    // format* or use* is where a project is expected to put this.
    const code = `export function formatScore(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value)
}
`
    expect(fires(FORMAT, code)).toBe(false)
  })

  test("no false positive: a case conversion that merely starts the same way", () => {
    expect(fires(FORMAT, `const id = String(props.id).toLocaleLowerCase()\n`)).toBe(false)
  })

  test("the library source is exempt — it is where the formatters live", () => {
    const code = component(`    <time>{new Intl.DateTimeFormat(props.locale).format(props.d)}</time>`)
    expect(fires(FORMAT, code, "src/components/formatted-date.tsx")).toBe(false)
    expect(fires(FORMAT, code, "components/ui/formatted-date.tsx")).toBe(false)
  })

  test("known false positive: asking the platform which time zone it resolved", () => {
    // Documented as an exception on the record: there is no library equivalent,
    // so this one is a suppression with a reason rather than a rewrite. Only the
    // `new` spelling is a construction, and only that one is matched — the bare
    // call, which is how the idiom is usually written, slips through.
    expect(fires(FORMAT, `const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone\n`)).toBe(
      true,
    )
    expect(fires(FORMAT, `const zone = Intl.DateTimeFormat().resolvedOptions().timeZone\n`)).toBe(
      false,
    )
  })
})

const NESTED = "no-nested-card"

describe(NESTED, () => {
  test("true positive: a Card written in a Card's content", () => {
    const code = component(
      `    <Card>\n      <CardHeader title="Settings" />\n      <CardContent>\n        <Card><CardHeader title="General" /></Card>\n      </CardContent>\n    </Card>`,
    )
    expect(fires(NESTED, code)).toBe(true)
  })

  test("true positive: a self-closing Card, directly inside", () => {
    expect(fires(NESTED, component(`    <Card><Card /></Card>`))).toBe(true)
  })

  test("true positive: a Card per item, mapped inside a Card", () => {
    const code = component(
      `    <Card>\n      <div className="flex flex-col gap-3">\n        {props.members.map((m: any) => <Card key={m.id}>{m.name}</Card>)}\n      </div>\n    </Card>`,
    )
    expect(fires(NESTED, code)).toBe(true)
  })

  test("each inner Card is reported once, and the outer one never", () => {
    // The report lands on the card that has to change. Two inner cards are two
    // findings; the outer card, which `within` also sees as "inside a Card"
    // because it counts the node itself, is not a third.
    const code = component(`    <Card>\n      <Card>One</Card>\n      <Card>Two</Card>\n    </Card>`)
    expect(fireCount(NESTED, code)).toBe(2)
  })

  test("three levels deep is two findings", () => {
    const code = component(`    <Card>\n      <Card>\n        <Card>Deepest</Card>\n      </Card>\n    </Card>`)
    expect(fireCount(NESTED, code)).toBe(2)
  })

  test("true negative: sections — a Heading and a Separator inside one Card", () => {
    const code = component(
      `    <Card>\n      <CardContent>\n        <Heading level={4}>General</Heading>\n        <Separator />\n        <Heading level={4}>Danger zone</Heading>\n      </CardContent>\n    </Card>`,
    )
    expect(fires(NESTED, code)).toBe(false)
  })

  test("true negative: cards side by side in a grid", () => {
    const code = component(`    <div className="grid grid-cols-3 gap-3">\n      <Card>One</Card>\n      <Card>Two</Card>\n    </div>`)
    expect(fires(NESTED, code)).toBe(false)
  })

  test("no false positive: the Card parts are not Cards", () => {
    const code = component(
      `    <Card>\n      <CardHeader title="Plan" />\n      <CardContent>Body</CardContent>\n      <CardFooter><CardAction /></CardFooter>\n    </Card>`,
    )
    expect(fires(NESTED, code)).toBe(false)
  })

  test("no false positive: a component whose name merely starts with Card", () => {
    const code = component(`    <Card>\n      <CardList items={props.items} />\n      <Cardinality value={3} />\n    </Card>`)
    expect(fires(NESTED, code)).toBe(false)
  })

  test("known blind spot: a Card rendered by a child component", () => {
    // Lexical on purpose. This is also the shape of the site's own gallery — a
    // framed Card around each example, some of which are Cards — and the reason
    // the gallery is not reported: frame and specimen are two components.
    const code = `function Member(props: any) {\n  return <Card>{props.name}</Card>\n}\n${component(
      `    <Card>{props.members.map((m: any) => <Member key={m.id} name={m.name} />)}</Card>`,
    )}`
    expect(fires(NESTED, code)).toBe(false)
  })

  test("known blind spot: a Card passed in a prop", () => {
    // It is inside the outer element but not inside its children, which is the
    // clause that also stops a lone Card from matching itself.
    expect(fires(NESTED, component(`    <Card footer={<Card />}>Body</Card>`))).toBe(false)
  })

  test("true positive: the published rule does not carry this repo's scope for the Card page", () => {
    // The anti-example in card.examples.tsx is excused by a `localScopes` entry,
    // which is this repo's config and not the rule's. A consumer's copy of that
    // file is reported like any other.
    const code = component(`    <Card><Card /></Card>`)
    expect(fires(NESTED, code, "src/registry/card.examples.tsx")).toBe(true)
  })
})
