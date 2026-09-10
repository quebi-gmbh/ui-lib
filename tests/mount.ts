/**
 * Mounting a React tree by hand, for the tests that assert a hand-off rather
 * than a rendered result.
 *
 * The Conform binding tests mount through `createRoot` instead of React Testing
 * Library because what they assert is the hand-off between Conform and
 * react-aria, which reads better as explicit mount / act steps than as a
 * `render()` whose timing is implicit.
 *
 * Mounting by hand means unmounting by hand: RTL's automatic cleanup (see
 * `tests/dom.ts`) only knows about containers *it* created, and the DOM is one
 * global shared by every file in the run. Left in place, a fixture stays in
 * `document.body` for whatever file happens to run next, where a
 * `document.querySelector("form")` finds the wrong form and a `user.tab()` walks
 * into the wrong inputs.
 *
 * `unmountAll` is exported rather than registered here on purpose. An
 * `afterEach` called in this module's body would run once, when the first
 * importer loads it, and every later file would silently share that
 * registration — so each test file calls `afterEach(unmountAll)` itself, one
 * visible line that says the file cleans up after itself.
 */
import { act } from "react"
import { createRoot } from "react-dom/client"

const mounted: Array<{ container: HTMLElement; unmount: () => void }> = []

/** Render `element` into a fresh container in `document.body`, and return it. */
export async function mount(element: React.ReactElement) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(element)
  })
  mounted.push({ container, unmount: () => root.unmount() })
  return container
}

/** Tear down everything `mount` put in the document. Call from an `afterEach`. */
export function unmountAll() {
  for (const { container, unmount } of mounted.splice(0)) {
    act(() => {
      unmount()
    })
    container.remove()
  }
}

/** The form inside a mounted container — the one FormData is built from. */
export const formOf = (container: HTMLElement) =>
  container.querySelector("form") as HTMLFormElement

/** Click the element carrying `data-testid`, inside act(). */
export const click = async (container: HTMLElement, testId: string) => {
  await act(async () => {
    container.querySelector<HTMLElement>(`[data-testid="${testId}"]`)?.click()
  })
}
