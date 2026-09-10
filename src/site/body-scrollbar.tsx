import { useEffect } from "react"
import { useOverlayScrollbars } from "overlayscrollbars-react"

/**
 * Initializes quebi-themed overlay scrollbars on document.body (the page
 * scrollbar). Client-only effect so it doesn't run during prerender; the
 * `data-overlayscrollbars-initialize` attributes on <html>/<body> prevent a
 * flash of the native scrollbar before this runs.
 */
export function BodyScrollbar() {
  const [initialize] = useOverlayScrollbars({
    defer: true,
    options: {
      scrollbars: { theme: "os-theme-quebi", autoHide: "leave", autoHideDelay: 600 },
    },
  })

  useEffect(() => {
    initialize({ target: document.body, cancel: { body: false } })
  }, [initialize])

  return null
}
