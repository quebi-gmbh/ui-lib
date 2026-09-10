import type { RuleMeta } from "./types"

/**
 * Platform defaults, first of two — the dialog the runtime draws for you.
 *
 * This was the one rule here whose message could not end in an import, and it
 * warned for exactly that reason: `alert()` had `useToast()`, and `confirm()`
 * had nothing, because it is synchronous where every replacement was not.
 * `useConfirm()` closes that gap — it returns `Promise<boolean>`, so the line
 * that asked the question is still the line that reads the answer — and with
 * both halves nameable the rule fails rather than warns.
 */
export const noBrowserDialogsRule: RuleMeta = {
  id: "no-browser-dialogs",
  title: "Never alert(), confirm() or prompt()",
  navTitle: "Browser dialogs",
  summary:
    "These three draw the browser's own dialog: unthemed, blocking, and outside React's tree. Show feedback with a Toast under a ToastProvider, and ask a question with `await confirm(...)` from useConfirm() under a ConfirmProvider.",
  severity: "error",
  category: "platform-defaults",
  failureMode:
    "An agent asked to confirm a delete or to tell the user something worked writes `confirm(...)` or `alert(...)`, because a global needs no import, no provider, no state and no second render path — it is the only feedback mechanism guaranteed to exist in every JavaScript runtime, so it is the one the shortest path finds. It works on the first click, on the machine that wrote it, which is exactly why nothing in review objects.",
  rationale: [
    "The dialog is not yours. `alert()` renders browser chrome: your theme does not reach it, your fonts do not reach it, and neither does your dark mode. It is the one surface in the product the design system cannot touch, which makes it the one surface that announces the app was assembled rather than designed. Toast is a component, so it inherits everything — the quebi surface, the status ramps, the radii, the motion — and so is AlertDialog.",
    "It blocks the main thread, and that is a behavioural difference, not an aesthetic one. While an `alert()` is open nothing renders, no timer fires, no fetch settles and no route transition completes; on iOS Safari the user can tick a box that suppresses every later dialog on the origin, at which point `confirm()` returns false forever and the code silently stops asking. A Toast is transient and non-blocking, and an AlertDialog is a focus-trapped dialog inside the tree, where the rest of the app keeps running behind it.",
    "It cannot be tested and it cannot be prerendered. `alert` and `confirm` are not defined on the server, so the same call that works in the browser throws during a prerender; in happy-dom they are stubs that return undefined, so a test of the flow behind a `confirm()` either hangs on a decision nobody makes or takes a branch the user never would. A Toast is a rendered node with an aria-live region — `findByRole('status')` — and a confirmation is a dialog with a button you can press and a promise you can await.",
    "Both replacements now name themselves, which is why this rule fails rather than warns. `toast` is not exported; the queue is reached through `useToast()` under a `<ToastProvider>`. `confirm()` is reached through `useConfirm()` under a `<ConfirmProvider>` — and because it returns `Promise<boolean>`, the handler that asked the question keeps its shape and gains one `await`, rather than being split in two around a Modal's button. Each replacement is one import plus a provider mounted once at the root; the declarative shape, `<AlertDialog>` with `isOpen` and `onConfirm`, is still there for the cases that want it. Nothing left here is a refactor of the call site, so nothing left here is a judgement call.",
  ],
  // The one rule here that is not about JSX. `confirm()` in a `.ts` helper is
  // the same bug as `confirm()` in a component, and because a built-in Biome
  // rule is scoped by the config that switches it on rather than by a compiled
  // `$filename` guard, it really does fire there — so the record says so.
  appliesTo: ["app/**/*.{ts,tsx,js,jsx}", "src/**/*.{ts,tsx,js,jsx}"],
  examples: [
    {
      title: "Telling the user it worked",
      wrong: `async function onSave() {
  await save(values)
  alert("Saved")
}`,
      right: `import { useToast } from "@/components/toast"

const toast = useToast()

async function onSave() {
  await save(values)
  toast.success("Saved")
}`,
      note: "useToast() throws without a <ToastProvider> above it, so this is two edits, not one: mount the provider once at the root of the app and every later call is the one-liner it looks like.",
    },
    {
      title: "Asking before a destructive action",
      wrong: `function onDelete() {
  if (!confirm("Delete this project?")) return
  deleteProject(id)
}`,
      right: `import { useConfirm } from "@/components/alert-dialog"

const confirm = useConfirm()

async function onDelete() {
  if (!(await confirm("Delete this project?"))) return
  deleteProject(id)
}`,
      note: "The diff is the `await` and the import. That is the whole reason `useConfirm()` exists: `confirm()` answers the line below it, and so does a promise — where a Modal does not, which is why replacing one with the other used to mean splitting the handler in two. `<ConfirmProvider>` goes at the root next to `<ToastProvider>`; a dismissal (Escape, or Cancel) resolves `false`.",
    },
    {
      title: "When the dialog is a piece of the page, not a question in a handler",
      wrong: `<Button intent="danger" onPress={() => {
  if (confirm("Revoke this API key?")) revoke(key)
}}>
  Revoke
</Button>`,
      right: `<AlertDialog
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  onConfirm={() => revoke(key)}
  title="Revoke this API key?"
  description="Anything still using it will start failing immediately."
  confirmLabel="Revoke"
  intent="danger"
/>`,
      note: "The declarative half of the same component, for a confirmation whose open state something else already owns — a route, a selection, a menu item. `role=\"alertdialog\"` comes with it: focus-trapped, not dismissable by clicking the scrim, and announced as a dialog demanding an answer.",
    },
  ],
  // No exceptions, and that is the point of the work that promoted this rule to
  // `error`. It warned while `confirm()` had no asynchronous equivalent in the
  // library, because the fix was a refactor of the call site rather than an
  // import — the same standard that keeps `keep-files-readable` a warning.
  // `useConfirm()` removed the refactor, so the carve-out went with it.
  exceptions: [],
  enforcement: {
    kind: "lint",
    // Biome 2.1+ covers all three globals, with or without the `window.`
    // prefix, so there is nothing to write and nothing to maintain: no plugin,
    // no options, and no pattern that can rot.
    biome: { via: "rule", rule: "suspicious/noAlert" },
    message:
      "This draws the browser's own dialog: unthemed, blocking the main thread, undefined on the server, and untestable. For feedback, call toast.success(...) from useToast() in @/components/toast, under a <ToastProvider> mounted at the root. For a question, await confirm(...) from useConfirm() in @/components/alert-dialog, under a <ConfirmProvider> mounted at the root — it returns Promise<boolean>, so the branch below the question survives; where the open state is owned elsewhere, render <AlertDialog> directly. See https://ui-lib.quebi.de/rules/no-browser-dialogs",
    grep: "\\b(?:window\\.)?(?:alert|confirm|prompt)\\(",
    note: "Biome prints its own text for this one — 'Unexpected alert' — because noAlert has no message option to carry the replacement, unlike the element ban. The message above is what this page and api/rules/no-browser-dialogs.json say, and it is the part worth reading; the lint run only tells you where. The check reads the call, so an indirection (`const ask = window.confirm`) is invisible to it, as is anything reached through a variable — the same blind spot every syntactic check here has. It also cannot see the case the rule most wants to catch in reverse: a Toast fired where a confirmation was needed is a judgement call, not a pattern. And `prompt()` is the one global whose replacement is not a single call: a question that collects a value is a Modal with an Input and a submit, because the answer needs validating.",
  },
  tags: ["feedback", "dialogs", "toast", "modal", "confirm", "agents"],
}
