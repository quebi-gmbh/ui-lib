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

/**
 * Collapsing the selection to where it already is, which in happy-dom is an
 * infinite loop.
 *
 * Every react-aria date/time segment collapses the selection onto itself when
 * it takes focus ("or Chrome won't fire input events"), and listens for
 * `selectionchange` to collapse it again if anything moves it — the guard that
 * keeps an Android composition from rewriting the segment's DOM. A browser
 * fires `selectionchange` only when the selection actually moves, so that
 * settles in one round. happy-dom's `collapse` builds a fresh `Range` every
 * call and compares by identity, so it always fires: segment collapses, event,
 * segment collapses, event, until the stack runs out — and the overflow lands
 * as a `RangeError` storm from happy-dom's own error dispatch rather than as a
 * failure anyone can read.
 *
 * Making the no-op a no-op is the whole fix. Nothing in the suite asserts on
 * the selection; what it buys is the ability to focus a segment at all, which
 * is what testing a TimeField, DateField or DatePicker by keyboard needs.
 */
{
  const selection = window.getSelection()
  const prototype = selection && (Object.getPrototypeOf(selection) as Selection)
  const collapse = prototype?.collapse
  if (prototype && collapse) {
    prototype.collapse = function (node: Node | null, offset = 0) {
      if (this.anchorNode === node && this.anchorOffset === offset) return
      collapse.call(this, node, offset)
    }
  }
}

/**
 * `new Option(...)`, which happy-dom does not install as a global (it has
 * `HTMLOptionElement`, but not the legacy constructor that is an alias for it).
 *
 * Conform reaches for it whenever it has to write a value into a `<select>` it
 * did not render — `updateField` adds the missing `<option>` with
 * `element.options.add(new Option(...))`. Every conform-* variant backed by a
 * hidden select (ChoiceBox) hits that path on the first selection, and without
 * this it is a ReferenceError in tests and works fine in a browser.
 */
if (!("Option" in globalThis)) {
  Object.defineProperty(globalThis, "Option", {
    configurable: true,
    writable: true,
    value: function Option(
      text?: string,
      value?: string,
      defaultSelected?: boolean,
      selected?: boolean,
    ) {
      const option = document.createElement("option")
      if (text !== undefined) option.text = text
      if (value !== undefined) option.value = value
      if (defaultSelected !== undefined) option.defaultSelected = defaultSelected
      if (selected !== undefined) option.selected = selected
      return option
    },
  })
}
