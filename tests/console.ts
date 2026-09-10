/**
 * Console capture, for asserting that a component is wired the way react-aria
 * expects.
 *
 * React Aria reports misuse through `console.warn`/`console.error` and then
 * carries on: a `PressResponder` with no pressable child, a dialog with no
 * accessible name, a modal whose state is claimed by two owners. None of that
 * fails a render, so a component can be composed wrongly and still satisfy
 * every behavioural assertion in a suite — the only symptom is noise in the
 * consumer's console, which no test sees.
 *
 * `captureConsole()` makes those messages assertable. Call it before rendering,
 * `restore()` in a `finally` (a failing assertion must not leave the console
 * swapped out for the rest of the file), then assert on `messages`.
 */

export interface CapturedConsole {
  /** Everything `console.warn`/`console.error` received, oldest first. */
  messages: string[]
  /** Put the real console methods back. Safe to call twice. */
  restore: () => void
}

export function captureConsole(): CapturedConsole {
  const messages: string[] = []
  const original = { warn: console.warn, error: console.error }
  const record = (...args: unknown[]) => {
    messages.push(args.map((arg) => String(arg)).join(" "))
  }
  console.warn = record
  console.error = record
  return {
    messages,
    restore: () => {
      console.warn = original.warn
      console.error = original.error
    },
  }
}
