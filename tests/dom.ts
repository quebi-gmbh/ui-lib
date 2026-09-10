/**
 * The DOM test environment, preloaded for every `bun test` file (see
 * `bunfig.toml`).
 *
 * `bun test` runs in Bun, which has no DOM. happy-dom's global registrator
 * installs one onto `globalThis` — `document`, `window`, `Element`, the event
 * classes — which is enough for React DOM to render into and for React Aria's
 * focus, press and overlay handling to behave like a browser's.
 *
 * Registration has to happen *before* React Testing Library is evaluated: RTL
 * and `@testing-library/dom` capture `document`/`window` at module scope, so a
 * static import here would bind them to the pre-registration globals. Hence the
 * dynamic imports below. Test files themselves import RTL statically without
 * worrying about it, because preload finishes before any of them load.
 */
import { afterEach, expect } from "bun:test"
import { GlobalRegistrator } from "@happy-dom/global-registrator"

GlobalRegistrator.register({ url: "https://ui-lib.quebi.de/" })

// React only allows `act()` — which RTL's `render` and `fireEvent` wrap every
// update in — when this flag says the environment is a test one.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const [{ cleanup }, matchers] = await Promise.all([
  import("@testing-library/react"),
  import("@testing-library/jest-dom/matchers"),
])

// jest-dom's matchers are written against jest's `expect.extend` contract, which
// Bun implements; the cast is only because its published type is jest's.
expect.extend(matchers as unknown as Parameters<typeof expect.extend>[0])

// Unmounts anything a test rendered and empties the body between tests. Without
// it every `screen.getBy*` query would see the leftovers of previous tests.
afterEach(cleanup)
