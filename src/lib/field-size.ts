"use client"

/**
 * How much room a field has been given, for the places that cannot pass a prop.
 *
 * `Input`, `NumberInput`, `SelectTrigger` and `DateInput` all publish the same
 * three-step scale — `xs` is 30px, `sm` 38px, `md` 42px and the default — and a
 * form picks one by naming it. A table cell cannot: the control in an editable
 * cell is built by the *consumer's* `editor` callback, which is handed Conform
 * metadata and nothing else, so `size="sm"` in a cell would have to be written
 * out by every caller on every editor for the table to stop changing height
 * when one opens. That is not a default, it is a convention nobody can enforce
 * — and `src/registry/*.examples.tsx` is copied verbatim, so the omission would
 * propagate.
 *
 * So the cell states the size once, around the editor, and the controls under
 * it read it. An explicit prop still wins: the context is the default, never
 * the rule.
 *
 * It lives in `@/lib` rather than beside any one control because the provider
 * (`table-shell`) and the consumers (four field primitives) may not import each
 * other — `table-shell` and `table-controls` are siblings by design, and a
 * control gaining `Input` as a registry dependency for a shared constant is the
 * trade `select.tsx` already refuses. A `@/lib/*` module is shipped beside
 * whatever imports it, so all five get the same context object and none of them
 * gains a component dependency.
 *
 * Nothing here may import another `@/lib/*` module: `generate-api.ts` emits lib
 * modules with `registryDependencies: []`, so a sibling import would land in a
 * consumer's project dangling.
 */
import { createContext, use } from "react"

/** The field size scale. `md` is every control's default and is unchanged. */
export type FieldSize = "xs" | "sm" | "md"

export interface FieldSizing {
  size: FieldSize
  /**
   * Whether a `NumberField` should draw its +/- pair. It travels with the size
   * because it answers the same question: the steppers cost ~74px of fixed
   * width, and an input that is `w-full min-w-0` gives up its own width before
   * they give up theirs — so a control small enough to need this context is a
   * control with no room for them. The keyboard still steps with ↑ and ↓.
   */
  hideStepper: boolean
}

export const FieldSizeContext = createContext<FieldSizing | null>(null)

/**
 * The sizing a control should use: its own props first, then whatever the
 * surrounding surface asked for, then the library default.
 */
export function useFieldSizing(own: Partial<FieldSizing> = {}): FieldSizing {
  const inherited = use(FieldSizeContext)
  return {
    size: own.size ?? inherited?.size ?? "md",
    hideStepper: own.hideStepper ?? inherited?.hideStepper ?? false,
  }
}
