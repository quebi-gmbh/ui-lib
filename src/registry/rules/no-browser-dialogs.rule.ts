import type { RuleMeta } from "./types"

/**
 * Platform defaults, first of two — the dialog the runtime draws for you.
 *
 * The one rule here whose message cannot end in an import. There is no
 * `toast()` to reach for, only `useToast()` under a provider, and `confirm()`
 * is synchronous where every replacement is not; both fixes are a change of
 * shape. That is the whole reason this warns instead of failing, by the same
 * standard that makes `keep-files-readable` a warning.
 */
export const noBrowserDialogsRule: RuleMeta = {
  id: "no-browser-dialogs",
  title: "Never alert(), confirm() or prompt()",
  navTitle: "Browser dialogs",
  summary:
    "These three draw the browser's own dialog: unthemed, blocking, and outside React's tree. Show feedback with a Toast under a ToastProvider, and ask a question with a Modal whose own action does the work.",
  severity: "warn",
  category: "platform-defaults",
  failureMode:
    "An agent asked to confirm a delete or to tell the user something worked writes `confirm(...)` or `alert(...)`, because a global needs no import, no provider, no state and no second render path — it is the only feedback mechanism guaranteed to exist in every JavaScript runtime, so it is the one the shortest path finds. It works on the first click, on the machine that wrote it, which is exactly why nothing in review objects.",
  rationale: [
    "The dialog is not yours. `alert()` renders browser chrome: your theme does not reach it, your fonts do not reach it, and neither does your dark mode. It is the one surface in the product the design system cannot touch, which makes it the one surface that announces the app was assembled rather than designed. Toast is a component, so it inherits everything — the quebi surface, the status ramps, the radii, the motion.",
    "It blocks the main thread, and that is a behavioural difference, not an aesthetic one. While an `alert()` is open nothing renders, no timer fires, no fetch settles and no route transition completes; on iOS Safari the user can tick a box that suppresses every later dialog on the origin, at which point `confirm()` returns false forever and the code silently stops asking. A Toast is transient and non-blocking, and a Modal is a focus-trapped dialog inside the tree, where the rest of the app keeps running behind it.",
    "It cannot be tested and it cannot be prerendered. `alert` and `confirm` are not defined on the server, so the same call that works in the browser throws during a prerender; in happy-dom they are stubs that return undefined, so a test of the flow behind a `confirm()` either hangs on a decision nobody makes or takes a branch the user never would. A Toast is a rendered node with an aria-live region — `findByRole('status')` — and a Modal is a dialog with a button you can press.",
    "The honest part: neither replacement is an import you can drop in. `toast` is not exported; the queue is reached through `useToast()`, which throws unless a `<ToastProvider>` is mounted above it, so the first fix is to mount one at the root. `confirm()` is worse, because it is synchronous: the code after it assumes an answer. The library ships no `useConfirm()` and no `AlertDialog`, so replacing it means splitting the handler in two and letting a Modal's own action button call the second half. That is a refactor, which is why this rule warns and does not fail — and why it should be promoted to `error` the day a promise-based confirmation lands.",
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
      wrong: `<Button intent="danger" onPress={() => {
  if (confirm("Delete this project?")) deleteProject(id)
}}>
  Delete
</Button>`,
      right: `<ModalTrigger>
  <Button intent="danger">Delete</Button>
  <ModalContent role="alertdialog">
    <ModalHeader>
      <ModalTitle>Delete this project?</ModalTitle>
      <ModalDescription>This cannot be undone.</ModalDescription>
    </ModalHeader>
    <ModalFooter>
      <ModalClose>Cancel</ModalClose>
      <Button intent="danger" onPress={() => deleteProject(id)}>Delete</Button>
    </ModalFooter>
  </ModalContent>
</ModalTrigger>`,
      note: "This is the shape change the rule is really asking for. `confirm()` returns an answer to the line below it; a Modal has no line below it, so the second half of the handler moves onto the button that confirms. Everything else follows from that — the dialog is focus-trapped, dismissible with Escape, announced as an alertdialog, and rendered in the theme.",
    },
  ],
  exceptions: [
    {
      scope: "A blocking confirmation with no asynchronous equivalent in the library yet",
      reason:
        "The library ships no useConfirm() and no AlertDialog, so a destructive action guarded inside a handler that has to keep running has no drop-in replacement — the fix is to restructure the flow around a Modal, and that is not always the change in front of you. A confirm() with a biome-ignore whose reason names the flow is more honest than one that nobody has looked at; a bare suppression is not. Promote this rule to error, and drop this exception, when a promise-based confirmation lands.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Biome 2.1+ covers all three globals, with or without the `window.`
    // prefix, so there is nothing to write and nothing to maintain: no plugin,
    // no options, and no pattern that can rot.
    biome: { via: "rule", rule: "suspicious/noAlert" },
    message:
      "This draws the browser's own dialog: unthemed, blocking the main thread, undefined on the server, and untestable. For feedback, call toast.success(...) from useToast() in @/components/toast, under a <ToastProvider> mounted at the root. For a question, put the action on a <ModalContent role='alertdialog'> from @/components/modal and let its own button run the second half of the handler. See https://ui-lib.quebi.de/rules/no-browser-dialogs",
    grep: "\\b(?:window\\.)?(?:alert|confirm|prompt)\\(",
    note: "Biome prints its own text for this one — 'Unexpected alert' — because noAlert has no message option to carry the replacement, unlike the element ban. The message above is what this page and api/rules/no-browser-dialogs.json say, and it is the part worth reading; the lint run only tells you where. The check reads the call, so an indirection (`const ask = window.confirm`) is invisible to it, as is anything reached through a variable — the same blind spot every syntactic check here has. It also cannot see the case the rule most wants to catch in reverse: a Toast fired where a Modal was needed is a judgement call, not a pattern.",
  },
  tags: ["feedback", "dialogs", "toast", "modal", "agents"],
}
