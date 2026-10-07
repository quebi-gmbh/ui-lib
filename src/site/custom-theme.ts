/**
 * An imported theme, applied to the whole site.
 *
 * The generated stylesheet is appended to `<head>` as one `<style>` element,
 * after the app's own stylesheet, so its `:root, .light` / `.dark` blocks win
 * over quebi-theme.css by order alone. It is kept in localStorage and put back
 * after hydration on every page (see `root.tsx`) — never during, since the
 * prerendered `<head>` has to match what React renders.
 */
const STORAGE_KEY = "quebi-custom-theme"
const STYLE_ID = "quebi-custom-theme"

export function applyCustomTheme(css: string, persist = true) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement("style")
    el.id = STYLE_ID
    document.head.append(el)
  }
  el.textContent = css
  if (!persist) return
  try {
    localStorage.setItem(STORAGE_KEY, css)
  } catch {
    /* a large embedded font can exceed the quota; the theme still applies to this page */
  }
}

export function clearCustomTheme() {
  document.getElementById(STYLE_ID)?.remove()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage disabled */
  }
}

/**
 * Whether a theme is applied or saved. Asks storage too: a page's own effect
 * can run before root.tsx has restored the saved theme into the DOM.
 */
export function hasCustomTheme(): boolean {
  if (typeof document === "undefined") return false
  if (document.getElementById(STYLE_ID)) return true
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

/** Re-apply a theme saved by an earlier visit. Call once, after hydration. */
export function restoreCustomTheme() {
  try {
    const css = localStorage.getItem(STORAGE_KEY)
    if (css) applyCustomTheme(css, false)
  } catch {
    /* storage disabled */
  }
}
