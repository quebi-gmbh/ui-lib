/**
 * Test harness for the rule selectors.
 *
 * Runs the *published* config — the same objects `renderEslintConfig` serialises
 * into `public/api/rules/eslint.config.js` — through ESLint's Linter, so a test
 * passing here means the file a consumer downloads behaves that way. Nothing is
 * re-implemented for the tests.
 */
import parser from "@typescript-eslint/parser"
import { Linter } from "eslint"
import { buildEslintConfig } from "../src/registry/rules/checks"
import { rulesRegistry } from "../src/registry/rules"

const linter = new Linter()

/** The published config, with the JSX parser a consumer has to supply. */
const config = [
  {
    files: ["**/*.{tsx,jsx}"],
    languageOptions: {
      parser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" as const },
    },
  },
  ...buildEslintConfig(rulesRegistry),
] as Linter.Config[]

/** Messages carry their rule's page URL; that is how a finding names itself. */
function ruleIdFrom(message: string): string {
  const match = message.match(/\/rules\/([a-z0-9-]+)/)
  return match ? match[1] : `<unattributed: ${message.slice(0, 60)}>`
}

/**
 * Lint a snippet as if it were a file at `filename`, and return the ids of the
 * rules that fired. The default path is ordinary app code, covered by every rule.
 */
export function rulesFiredOn(code: string, filename = "src/routes/example.tsx"): string[] {
  return linter.verify(code, config, filename).map((m) => ruleIdFrom(m.message ?? ""))
}

/** Did this rule fire on this snippet? */
export function fires(ruleId: string, code: string, filename?: string): boolean {
  return rulesFiredOn(code, filename).includes(ruleId)
}

/** How many findings did this rule produce? Used to check for double-reporting. */
export function fireCount(ruleId: string, code: string, filename?: string): number {
  return rulesFiredOn(code, filename).filter((id) => id === ruleId).length
}

/** Wrap a JSX fragment in a component so the parser sees a real module. */
export function component(body: string): string {
  return `export function Example(props: any) {\n  return (\n${body}\n  )\n}\n`
}
