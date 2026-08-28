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
