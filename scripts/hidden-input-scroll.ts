/**
 * Clicking a toggle in a dialog scrolls nothing it should not (task #250).
 *
 * react-aria renders the real `<input>` of a Checkbox, Radio or Switch visually
 * hidden, with `position: absolute`, so it is laid out against its nearest
 * positioned ancestor. When that ancestor was the modal frame — `relative
 * overflow-hidden` — rather than the control, clicking the last checkbox in a
 * tall dialog focused an input the browser placed below the frame's fold, and
 * the browser scrolled the frame to reveal it: `overflow-hidden` hides the
 * scrollbar, not the scroll position. The whole surface slid up and left a
 * blank band, with no scrollbar to bring it back.
 *
 * `tests/components/hidden-input-containment.test.tsx` pins the cause in
 * happy-dom — every hidden input's nearest positioned ancestor is its own
 * control. This is the symptom, which only a browser can produce because it
 * takes layout: open the Modal page's "Scrolling body" example, scroll the
 * body to the end, tick the last checkbox, and require every box between the
 * body and the frame to still be at `scrollTop` 0. It runs at a desktop and a
 * phone viewport, because the modal is a centred panel on one and a bottom
 * sheet on the other. Only the desktop run reproduced the original bug when
 * the fix was reverted (the Dialog scrolled 8px); the phone run is there so the
 * sheet layout cannot start doing it unnoticed.
 *
 *   bun run check:focus-scroll                               # serve build/client
 *   bun run check:focus-scroll --base http://localhost:5173  # against `bun run dev`
 *
 * Like `screenshot-og.ts` it needs Chromium (`bunx playwright install
 * chromium`), which is why it runs in `bun run build` and not in `bun test`.
 */
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { serveDist } from "./serve-dist"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DIST = join(ROOT, "build/client")

const TRIGGER = "notification settings"
const LAST_CHECKBOX = "Product news"

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
]

function arg(name: string): string | undefined {
  const flag = `--${name}`
  const index = process.argv.indexOf(flag)
  if (index !== -1) return process.argv[index + 1]
  return process.argv.find((a) => a.startsWith(`${flag}=`))?.slice(flag.length + 1)
}

async function main() {
  const externalBase = arg("base")
  const server = externalBase ? undefined : serveDist(DIST)
  const base = externalBase ?? `http://localhost:${server?.port}`

  const browser = await chromium.launch()
  const failures: string[] = []

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    })
    const page = await context.newPage()
    try {
      await page.goto(`${base}/components/modal`, { waitUntil: "load" })
      // The page is prerendered, so the trigger is on screen before React has
      // hydrated it, and a press that early does nothing. Nothing on the page
      // announces hydration, so press until the dialog answers; a press that
      // landed too early has no effect for a retry to undo.
      const dialog = page.getByRole("dialog")
      for (let attempt = 0; ; attempt++) {
        await page.getByRole("button", { name: TRIGGER }).click()
        const opened = await dialog
          .waitFor({ state: "visible", timeout: 2_000 })
          .then(() => true)
          .catch(() => false)
        if (opened) break
        if (attempt === 10) throw new Error(`"${TRIGGER}" never opened the dialog`)
      }

      const body = dialog.locator("[data-slot=dialog-body]")
      // The precondition: if the body does not scroll, the last checkbox is not
      // below anything and the check below passes for the wrong reason.
      const scrollable = await body.evaluate((el) => el.scrollHeight > el.clientHeight)
      if (!scrollable) throw new Error("the example's body does not overflow, so it proves nothing")

      await body.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      const checkbox = dialog.getByRole("checkbox", { name: LAST_CHECKBOX })
      await dialog.getByText(LAST_CHECKBOX, { exact: true }).click()
      if (!(await checkbox.isChecked())) throw new Error(`"${LAST_CHECKBOX}" was not ticked`)

      // Every box from the body's parent up to and including the modal frame.
      // The body itself may scroll — that is its job.
      const moved = await body.evaluate((el) => {
        const frame = el.closest("[data-slot=modal-content]")
        if (!frame) return ["no [data-slot=modal-content] above the body"]
        const out: string[] = []
        for (let node = el.parentElement; node; node = node.parentElement) {
          if (node.scrollTop !== 0 || node.scrollLeft !== 0) {
            const slot = node.getAttribute("data-slot") ?? node.getAttribute("role") ?? node.tagName
            out.push(`${slot} scrolled to ${node.scrollLeft},${node.scrollTop}`)
          }
          if (node === frame) break
        }
        return out
      })
      if (moved.length > 0) throw new Error(moved.join("; "))
      console.log(`✓ ${viewport.name}: ticking the last checkbox left the frame where it was`)
    } catch (error) {
      const reason = (error as Error).message.split("\n")[0]
      failures.push(`${viewport.name}: ${reason}`)
      console.error(`✗ ${viewport.name} — ${reason}`)
    } finally {
      await context.close()
    }
  }

  await browser.close()
  server?.stop(true)

  if (failures.length > 0) {
    console.error(
      `\nA toggle in a dialog scrolled the frame around it:\n  ${failures.join("\n  ")}\n` +
        "See tests/components/hidden-input-containment.test.tsx for the cause it is checking.",
    )
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
