/**
 * Teaches TypeScript about the jest-dom matchers that `tests/dom.ts` adds to
 * `bun:test`'s `expect`. The package ships this augmentation for jest and
 * vitest but does not export the Bun variant from its `exports` map, so it is
 * restated here.
 */
import type { expect } from "bun:test"
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"

declare module "bun:test" {
  interface Matchers<T = unknown>
    extends TestingLibraryMatchers<ReturnType<typeof expect.stringContaining>, T> {}
}
