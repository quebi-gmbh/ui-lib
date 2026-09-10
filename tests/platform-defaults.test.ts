/**
 * Platform-defaults rules. Same four kinds of case as the element-usage suite:
 * true positive, true negative, false positive, and the blind spot asserted as
 * a miss so it stays visible.
 *
 * These two are the P2 pair from the rule audit, and both warn rather than
 * fail — which changes nothing here. The harness reports what fired, not how
 * loudly; the severity is checked in tests/config.test.ts.
 */
import { describe, expect, test } from "bun:test"
import { component, fireCount, fires } from "./harness"

const DIALOGS = "no-browser-dialogs"

describe(DIALOGS, () => {
  test.each([
    ["alert", `export const save = () => { alert("Saved") }\n`],
    ["confirm", `export const del = () => { if (confirm("Delete?")) remove() }\n`],
    ["prompt", `export const rename = () => { const name = prompt("New name?"); return name }\n`],
  ])("true positive: %s() is reported", (_global, code) => {
    expect(fires(DIALOGS, code)).toBe(true)
  })

  test("true positive: the window-qualified call too", () => {
    expect(fires(DIALOGS, `export const save = () => { window.alert("Saved") }\n`)).toBe(true)
  })

  test("true negative: a toast", () => {
    const code = `import { useToast } from "@/components/toast"\nexport const useSave = () => { const toast = useToast(); return () => toast.success("Saved") }\n`
    expect(fires(DIALOGS, code)).toBe(false)
  })

  test("true negative: a Modal asking the same question", () => {
    // The shape change the rule is really asking for: confirm() answers the
    // line below it, a Modal has no line below it, so the rest of the handler
    // moves onto the button that confirms.
    const code = component(
      `    <ModalContent role="alertdialog"><Button intent="danger" onPress={props.onDelete}>Delete</Button></ModalContent>`,
    )
    expect(fires(DIALOGS, code)).toBe(false)
  })

  test("no false positive: a method or a prop that happens to be called alert", () => {
    const code = `export const send = (api: any) => { api.alert({ level: 1 }); return { confirm: true } }\n`
    expect(fires(DIALOGS, code)).toBe(false)
  })

  test("no false positive: the word in a string or a component name", () => {
    const code = component(`    <AlertBanner title="Use confirm() only outside React">{props.children}</AlertBanner>`)
    expect(fires(DIALOGS, code)).toBe(false)
  })

  test("known blind spot: the call reached through a variable is missed", () => {
    // The check reads the callee where it is written. Aliased, it is an
    // ordinary call to an ordinary identifier, and nothing distinguishes it
    // from any other function in the file.
    const code = `const ask = window.confirm\nexport const del = () => { if (ask("Delete?")) remove() }\n`
    expect(fires(DIALOGS, code)).toBe(false)
  })

  test("it reaches a .ts helper, which is what its wider appliesTo is for", () => {
    // The only rule here that is not about JSX. A built-in is scoped by the
    // config that switches it on rather than by a compiled $filename guard, so
    // it really does fire outside a component — and the record's appliesTo says
    // `{ts,tsx,js,jsx}` rather than inheriting the JSX rules' globs, so the page
    // and the lint run agree about where it applies.
    const code = `export const del = () => { if (confirm("Delete?")) remove() }\n`
    expect(fires(DIALOGS, code, "src/lib/projects.ts")).toBe(true)
  })

  test("each call is reported once", () => {
    expect(fireCount(DIALOGS, `export const save = () => { alert("Saved") }\n`)).toBe(1)
  })
})

const SORTING = "no-client-sorting-on-a-server-driven-table"

/** A component that renders an AsyncTable, with `body` in front of the return. */
function table(body: string, jsx = "<AsyncTable aria-label=\"Orders\" columns={columns} rows={sorted} getRowId={(o: any) => o.id} />") {
  return `export function Orders(props: any) {\n${body}\n  return (\n    ${jsx}\n  )\n}\n`
}

describe(SORTING, () => {
  test("true positive: the rows sorted in the component that renders the table", () => {
    const code = table(`  const sorted = [...props.rows].sort(compare(props.sort))`)
    expect(fires(SORTING, code)).toBe(true)
  })

  test("true positive: the same sort inside a useMemo callback", () => {
    // The conjunction has to reach past the callback the sort sits in and find
    // the component two levels out, or the common shape is invisible.
    const code = table(
      `  const sorted = useMemo(() => [...props.rows].sort(compare(props.sort)), [props.rows, props.sort])`,
    )
    expect(fires(SORTING, code)).toBe(true)
  })

  test("true positive: an arrow component, and toSorted", () => {
    const code = `const Orders = (props: any) => {\n  const sorted = [...props.rows].toSorted(byName)\n  return <AsyncTable aria-label="Orders" columns={columns} rows={sorted} getRowId={(o: any) => o.id} />\n}\nexport default Orders\n`
    expect(fires(SORTING, code)).toBe(true)
  })

  test("true positive: sorted inline in the rows prop, whatever the array is called", () => {
    // The second arm of the receiver guard: position instead of name.
    const code = table(
      "",
      `<AsyncTable aria-label="Orders" columns={columns} rows={[...props.items].sort(byName)} getRowId={(o: any) => o.id} />`,
    )
    expect(fires(SORTING, code)).toBe(true)
  })

  test("true negative: the sort is re-queried, and the rows arrive sorted", () => {
    const code = table(
      "",
      `<AsyncTable aria-label="Orders" columns={columns} rows={props.rows} sort={props.sort} onSortChange={props.onSortChange} getRowId={(o: any) => o.id} />`,
    )
    expect(fires(SORTING, code)).toBe(false)
  })

  test("true negative: a plain Table sorting its own rows — that is what it is for", () => {
    const code = `export function Team(props: any) {\n  const sorted = [...props.rows].sort(byName)\n  return <Table aria-label="Team" sortDescriptor={props.sort}>{sorted.map((m: any) => m.id)}</Table>\n}\n`
    expect(fires(SORTING, code)).toBe(false)
  })

  test("no false positive: reordering the columns is not sorting the data", () => {
    // The reason the receiver guard exists at all.
    const code = table(`  const columns = [...props.columns].sort((a: any, b: any) => a.order - b.order)\n  const sorted = props.rows`)
    expect(fires(SORTING, code)).toBe(false)
  })

  test("no false positive: sorting the distinct values a filter popover shows", () => {
    const code = table(`  const options = [...props.values].sort()\n  const sorted = props.rows`)
    expect(fires(SORTING, code)).toBe(false)
  })

  test("known blind spot: the sort lifted into a sibling function escapes the scope", () => {
    // The conjunction is what makes the check specific, and it is also its
    // limit: `within` cannot leave the enclosing function, so this finds the
    // copy-paste case and not the architectural one.
    const code = `function sortRows(items: any[]) { return [...items].sort(byName) }\n${table(
      `  const sorted = sortRows(props.rows)`,
    )}`
    expect(fires(SORTING, code)).toBe(false)
  })

  test("known blind spot: a rows array under another name, assigned to a local", () => {
    // `data` is not `rows`, and the sort is not inside the rows={...} prop, so
    // neither arm of the receiver guard sees it.
    const code = table(`  const sorted = [...props.data].sort(compare(props.sort))`)
    expect(fires(SORTING, code)).toBe(false)
  })

  test("each violation is reported once", () => {
    const code = table(`  const sorted = [...props.rows].sort(compare(props.sort))`)
    expect(fireCount(SORTING, code)).toBe(1)
  })
})
