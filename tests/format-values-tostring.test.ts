/**
 * `format-values-through-the-library`, the `.toString()` arm (task #149).
 *
 * The other five shapes this rule matches name a formatter — `toLocaleString`,
 * `new Intl.…` — so matching them is a matter of spelling. `toString()` is on
 * every object in the language, and GritQL has no types, so the only thing that
 * can distinguish `CalendarDate#toString()` echoed under a picker from
 * `new URLSearchParams(q).toString()` in a helper is *where the call sits*.
 *
 * That makes the negatives the load-bearing half of this file: a widening
 * matched by position is one `until` clause away from reporting every
 * `key={id.toString()}` in the repo, and the only escape from a false positive
 * here is a `biome-ignore lint/plugin/format-values-through-the-library` at
 * every site it lands on.
 * Each `false` below is a shape the rule is deliberately blind to, with the
 * reason it is blind to it.
 *
 * Fixtures run through the real Biome CLI over the published artifacts; see
 * `tests/harness.ts`.
 */
import { describe, expect, test } from "bun:test"
import { component, fireCount, fires, ruleById } from "./harness"

const FORMAT = "format-values-through-the-library"

describe(`${FORMAT} — .toString() rendered into JSX`, () => {
  test("true positive: the shape task #121 was, in all four of its spellings", () => {
    // Real code from src/registry/{date-picker,date-field,date-range-picker,
    // time-field}.examples.tsx, which printed `2026-06-30` in a Description
    // sitting under a trigger whose segments spelled `30.6.2026`. Lint was
    // silent for the whole life of the rule.
    expect(
      fires(FORMAT, component(`    <Description>{props.value.toString()}</Description>`)),
    ).toBe(true)
    expect(
      fires(
        FORMAT,
        component(
          `    <Description>{props.value ? props.value.toString() : "No date selected"}</Description>`,
        ),
      ),
    ).toBe(true)
  })

  test("true positive: a template literal in the same slot, once per call", () => {
    const code = component(
      `    <Description>{\`\${props.start.toString()} → \${props.end.toString()}\`}</Description>`,
    )
    expect(fireCount(FORMAT, code)).toBe(2)
  })

  test("true positive: a JSX child nested inside a map over rows", () => {
    // The arrow between the outer `{rows.map(…)}` and this call is not what is
    // being tested — the call is a JSX expression child of its own, and that is
    // the nearest one, so the boundary above it never comes up.
    const code = component(`    <Table>
      {props.rows.map((row: any) => (
        <Cell key={row.id}>{row.date.toString()}</Cell>
      ))}
    </Table>`)
    expect(fires(FORMAT, code)).toBe(true)
  })

  test("no false positive: a JSX attribute is not rendered text", () => {
    // `key`, `id`, `data-*` and `aria-*` legitimately want a string, and the
    // library has nothing to offer them. Only what reaches the DOM as text is
    // this rule's business.
    expect(fires(FORMAT, component(`    <Row key={props.id.toString()} />`))).toBe(false)
    expect(
      fires(FORMAT, component(`    <Row aria-label={props.date.toString()} />`)),
    ).toBe(false)
  })

  test("no false positive: an attribute inside a child expression, which `within` alone would catch", () => {
    // The regression this narrowing exists for. `{items.map(…)}` is a
    // JsxExpressionChild, so every call anywhere beneath it has one as an
    // ancestor: `within JsxExpressionChild()` on its own reports both of these.
    const code = component(`    <List>
      {props.items.map((item: any) => (
        <Row key={item.id.toString()} aria-label={item.name.toString()} />
      ))}
    </List>`)
    expect(fireCount(FORMAT, code)).toBe(0)
  })

  test("no false positive: a render prop's attributes, and a handler's body", () => {
    expect(
      fires(FORMAT, component(`    <Foo>{({ x }: any) => <Bar data-x={x.toString()} />}</Foo>`)),
    ).toBe(false)
    expect(
      fires(
        FORMAT,
        component(
          `    <MonthView onDayClick={(day: any) => props.setNote(\`Day pressed: \${day.toString()}\`)} />`,
        ),
      ),
    ).toBe(false)
  })

  test("no false positive: a callback body inside a child expression is not rendered text either", () => {
    // A comparison in a filter predicate produces no output at all, and the
    // function boundary is what tells it apart from a value being rendered.
    // The cost is real and accepted: the redundant `.map(…).join()` on the
    // second line is a miss, documented on the record as one.
    expect(
      fires(
        FORMAT,
        component(
          `    <span>{props.items.filter((x: any) => x.id.toString() === props.q).length}</span>`,
        ),
      ),
    ).toBe(false)
    expect(
      fires(FORMAT, component(`    <span>{props.list.map((x: any) => x.toString()).join(", ")}</span>`)),
    ).toBe(false)
  })

  test("no false positive: `.toString()` outside JSX entirely", () => {
    // src/registry/server-table.examples.tsx builds a query string this way.
    const helper = `export function queryString(query: any) {
  return new URLSearchParams(query).toString() || "all=1"
}
`
    expect(fires(FORMAT, helper)).toBe(false)
    expect(fires(FORMAT, `export const id = props.date.toString()\n`)).toBe(false)
  })

  test("no false positive: a radix conversion, which takes an argument", () => {
    // The arm matches an empty argument list on purpose — the inverse of the
    // `$args` in the toLocale* arms, where an empty list is the point.
    expect(fires(FORMAT, component(`    <span>{props.n.toString(16)}</span>`))).toBe(false)
  })

  test("no false positive: methods that merely start the same way", () => {
    expect(fires(FORMAT, component(`    <span>{props.id.toUpperCase()}</span>`))).toBe(false)
    expect(fires(FORMAT, component(`    <span>{String(props.date)}</span>`))).toBe(false)
  })

  test("the format*/use* opt-out covers this arm too", () => {
    const code = `export function formatDay(d: any) {
  return <span>{d.toString()}</span>
}
`
    expect(fires(FORMAT, code)).toBe(false)
  })

  test("the library source is exempt, exactly as it is for the Intl arms", () => {
    const code = component(`    <span>{props.value.toString()}</span>`)
    expect(fires(FORMAT, code, "src/components/date-field.tsx")).toBe(false)
    expect(fires(FORMAT, code, "components/ui/date-field.tsx")).toBe(false)
  })

  test("the record says what the check does, and names the replacement", () => {
    // The message is what a consumer reads; a widened rule whose message still
    // only talks about locales would send them looking for the wrong fix.
    const rule = ruleById(FORMAT)
    expect(rule.enforcement.message).toContain("toString()")
    expect(rule.enforcement.message).toContain("FormattedDate")
    expect(rule.enforcement.message).toContain(`https://ui-lib.quebi.de/rules/${FORMAT}`)
    // A replacement the page can point at, not just prose in the message.
    expect(rule.replacements?.some((r) => r.element.includes("toString()"))).toBe(true)
    // ripgrep is the only check an agent in an unlinted repo has, so it has to
    // learn the shape as well — coarser than the plugin, by design.
    const grep = new RegExp(rule.enforcement.grep ?? "$^")
    expect(grep.test("<Description>{value.toString()}</Description>")).toBe(true)
    expect(grep.test("return new URLSearchParams(query).toString()")).toBe(false)
  })
})
