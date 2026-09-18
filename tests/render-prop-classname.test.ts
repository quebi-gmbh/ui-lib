/**
 * A render-prop `className` must never be handed to `cn()`.
 *
 * react-aria-components lets a caller pass `className` as a function of the
 * render state — `({ isHovered, isPressed, isSelected, … }) => string` — and
 * that is the documented way to style a component per state. Every quebi
 * component that forwards a react-aria props type inherits that surface.
 *
 * `cn` is clsx underneath, and **clsx drops a function silently**: it does not
 * call it, does not stringify it, does not warn. So `cn(BASE, className)` threw
 * the caller's classes away and left the base behind, with no error, no console
 * warning and no type error — the function is structurally assignable to clsx's
 * `ClassDictionary`, so `tsc` is happy. `SidebarItem` styles itself that way and
 * rendered as underlined prose with 104px icons (task #112); a render-prop
 * `className` on `Button`, `Switch` or `Input` left no trace in the DOM at all
 * (task #155, where 93 call sites across 60 files were carrying the shape).
 *
 * The fix, everywhere, is react-aria's own `composeRenderProps`:
 *
 * ```tsx
 * className={composeRenderProps(className, (resolved) => cn(BASE, resolved))}
 * ```
 *
 * It calls the function and merges what it returns, and passes a plain string
 * through unchanged — so a string caller is bit-for-bit unaffected.
 *
 * ## Why this is a type-aware scan and not a grep
 *
 * The bug is a *type* fact: it fires exactly when the value reaching `cn` can be
 * a function. A text search cannot tell `cn(BASE, className)` on a `<Button>`
 * (broken) from the same line on a `<div>` (fine), cannot see through
 * `popover?.className` or a renamed binding, and cannot know that a
 * tailwind-variants call — `someStyles({ className })` — merges its option
 * through tailwind-merge, where a function is dropped just the same. So the
 * rule below is stated over types, and TypeScript answers it:
 *
 *   **No value whose type admits a function may be used as a class-list value**
 *   — neither as an argument to `cn` / `clsx` / `twMerge` (or inside an array
 *   handed to one), nor as the `className` property of an options object passed
 *   to a tailwind-variants style function.
 *
 * That is one rule covering both spellings of the mistake, and it holds for
 * files that have nothing to do with react-aria: the only way to satisfy it is
 * to resolve the function first, which is what `composeRenderProps` does.
 *
 * A scan that cannot see types would pass vacuously, so two things are checked
 * before the sources are: a control file carrying the old shape must be
 * reported (the proof that this test fails on the code it replaced), and a
 * control file carrying the fixed shape must not be. The repo's own react-aria
 * call sites are counted as well — if the react-aria types stopped resolving,
 * every `className` would look like a plain string and that count would
 * collapse.
 *
 * `tests/components/render-prop-classname.test.tsx` is the other half: this file
 * proves the shape is absent from the sources, that one proves the shape that
 * replaced it actually delivers the caller's classes to the DOM.
 */
import { join } from "node:path"
import { describe, expect, test } from "bun:test"
import { Glob } from "bun"
import * as ts from "typescript"

const ROOT = join(import.meta.dir, "..")

/** The class-list merge helpers. Everything here goes through clsx. */
const MERGE_HELPERS = /^(cn|clsx|twMerge)$/

/** A virtual file is cheaper than a fixture project, and resolves `@/…` for free. */
const CONTROL_DIR = join(ROOT, "src", "components")
const BROKEN_CONTROL = join(CONTROL_DIR, "__control-render-prop-dropped.tsx")
const FIXED_CONTROL = join(CONTROL_DIR, "__control-render-prop-composed.tsx")

const CONTROLS: Record<string, string> = {
  [BROKEN_CONTROL]: `import { Button, type ButtonProps } from "react-aria-components"
import { cn } from "@/lib/utils"

export function ControlBroken({ className, ...props }: ButtonProps) {
  return <Button className={cn("px-2", className)} {...props} />
}
`,
  [FIXED_CONTROL]: `import { Button, type ButtonProps, composeRenderProps } from "react-aria-components"
import { cn } from "@/lib/utils"

export function ControlFixed({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={composeRenderProps(className, (resolved) => cn("px-2", resolved))}
      {...props}
    />
  )
}
`,
}

type Violation = { file: string; line: number; text: string }

function scan() {
  const sources = [...new Glob("{src,tests,scripts}/**/*.{ts,tsx}").scanSync(ROOT)].map((f) =>
    join(ROOT, f),
  )
  const options: ts.CompilerOptions = {
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    skipLibCheck: true,
    noEmit: true,
    baseUrl: ROOT,
    // The same alias the root tsconfig declares; without it every `@/…` import
    // resolves to nothing and the whole scan turns into `any`.
    paths: { "@/*": ["./src/*"] },
  }
  const host = ts.createCompilerHost(options, true)
  const readFile = host.readFile.bind(host)
  const fileExists = host.fileExists.bind(host)
  const getSourceFile = host.getSourceFile.bind(host)
  host.readFile = (name) => CONTROLS[name] ?? readFile(name)
  host.fileExists = (name) => name in CONTROLS || fileExists(name)
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) =>
    name in CONTROLS
      ? ts.createSourceFile(name, CONTROLS[name], languageVersion, true, ts.ScriptKind.TSX)
      : getSourceFile(name, languageVersion, onError, shouldCreate)

  const program = ts.createProgram([...sources, ...Object.keys(CONTROLS)], options, host)
  const checker = program.getTypeChecker()

  /** Can a value of this type be a function — i.e. will clsx drop it? */
  const admitsFunction = (type: ts.Type) =>
    (type.isUnion() ? type.types : [type]).some((part) => part.getCallSignatures().length > 0)

  const violations: Violation[] = []
  /** react-aria call sites whose `className` accepts a render prop at all. */
  let renderPropTargets = 0

  const record = (node: ts.Node, call: ts.CallExpression, sourceFile: ts.SourceFile) => {
    if (!admitsFunction(checker.getTypeAtLocation(node))) return
    const merge = call.getText().replace(/\s+/g, " ")
    violations.push({
      file: sourceFile.fileName.slice(ROOT.length + 1),
      line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      text: `${node.getText().replace(/\s+/g, " ")} in ${merge.length > 90 ? `${merge.slice(0, 90)}…` : merge}`,
    })
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile || !sourceFile.fileName.startsWith(`${ROOT}/`)) continue
    if (sourceFile.fileName.includes("node_modules")) continue

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText()
        for (const argument of node.arguments) {
          if (MERGE_HELPERS.test(callee)) {
            // `cn(["a", className])` is as legal a clsx call as `cn("a", className)`.
            if (ts.isArrayLiteralExpression(argument)) {
              for (const element of argument.elements) record(element, node, sourceFile)
            } else {
              record(argument, node, sourceFile)
            }
          } else if (ts.isObjectLiteralExpression(argument)) {
            // `someStyles({ className })` — tailwind-variants merges the option
            // through tailwind-merge, which drops a function exactly like clsx.
            for (const property of argument.properties) {
              if (ts.isPropertyAssignment(property) && property.name.getText() === "className") {
                record(property.initializer, node, sourceFile)
              } else if (
                ts.isShorthandPropertyAssignment(property) &&
                property.name.text === "className"
              ) {
                record(property.name, node, sourceFile)
              }
            }
          }
        }
      }

      if (ts.isJsxAttribute(node) && node.name.getText() === "className") {
        const initializer = node.initializer
        const expression =
          initializer && ts.isJsxExpression(initializer) ? initializer.expression : undefined
        const contextual = expression ? checker.getContextualType(expression) : undefined
        if (contextual && admitsFunction(contextual)) renderPropTargets++
      }

      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  return { violations, renderPropTargets }
}

const { violations, renderPropTargets } = scan()
const inControl = (name: string) => violations.filter((v) => v.file.endsWith(name))

describe("the scan can see what it is looking for", () => {
  test("the shape this test replaced is reported", () => {
    // `<Button className={cn("px-2", className)} />`, the library's old pattern.
    // If this stops failing, the check below has stopped checking anything.
    expect(inControl("__control-render-prop-dropped.tsx")).toHaveLength(1)
  })

  test("the shape that replaced it is not", () => {
    expect(inControl("__control-render-prop-composed.tsx")).toEqual([])
  })

  test("react-aria's render-prop classNames resolve as types", () => {
    // Every component in the library forwards one; a handful would mean the
    // react-aria types failed to resolve and the scan is reading `any`.
    expect(renderPropTargets).toBeGreaterThan(80)
  })
})

test("no value that could be a render-prop function is merged as a class list", () => {
  const found = violations.filter((v) => !v.file.includes("__control-render-prop-"))
  const report = found.map((v) => `${v.file}:${v.line}  ${v.text}`)

  // The fix is `composeRenderProps(className, (resolved) => cn(…, resolved))`
  // from react-aria-components — it resolves the function before the merge, and
  // passes a plain string through untouched. Where the element underneath takes
  // no render props (a `div`, a `Dialog`, the `Field` wrapper), the fix is to
  // narrow the component's own `className` to `string` instead, so a caller
  // cannot pass a function that has nowhere to go.
  expect(report).toEqual([])
})
