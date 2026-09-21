import { I18nProvider } from "react-aria-components"
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from "react-router"
import { Header } from "@/site/site-header"
import { Footer } from "@/site/site-footer"
import { NavigationStatus } from "@/site/navigation-status"
import "./main.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // The page scroller is the platform's, painted by `quebi-scrollbar` — the
    // same 6px edge-hugging pill `.os-theme-quebi` draws on the inner surfaces,
    // so the two still read as one system. Not `quebi-scrollbar-corners`: the
    // page has no rounded corner to follow, and a `clip-path` on `<html>` would
    // make it the containing block for every fixed descendant on the site.
    //
    // It used to be an OverlayScrollbars instance on `document.body`, and that
    // is what put every overlay that flips *above* its trigger off the bottom
    // of the page (tasks #180, #181): initialising there gives `<html>`
    // `position: relative`, and react-aria's `calculatePosition` special-cases
    // `HTML`/`BODY` by tag name — it measures the *visual viewport* even once
    // it has detected the container is positioned. The `bottom:` it emits is
    // therefore viewport-relative, the browser resolves it against the full
    // document box, and the overlay lands `documentHeight − viewportHeight`
    // too low. `top:`-anchored placements resolve against the same origin
    // either way, which is why only the flipped ones were ever reported.
    //
    // `scrollbar-gutter: stable` holds the bar's width whether or not the page
    // overflows, so content does not shift between a long page and a short one
    // — the one thing an overlay bar gave us for free. The body instance was
    // also the most expensive OverlayScrollbars on the site and the only one
    // every page paid for, which task #174 had already recommended removing.
    <html
      lang="en"
      className="quebi-scrollbar bg-quebi-bg dark [scrollbar-gutter:stable]"
      suppressHydrationWarning
    >
      <head>
        {/* No-flash theme init: runs before paint so the saved theme is applied
            before first render. quebi is dark-first, so dark is the default. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: the only way to run a script before first paint, and the payload is this string literal — no interpolation, so there is no input for an injection to arrive through.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('quebi-theme');" +
              "if(t!=='light'&&t!=='dark')t='dark';" +
              "var e=document.documentElement;e.classList.remove('light','dark');" +
              "e.classList.add(t);e.style.colorScheme=t;}catch(e){}})();",
          }}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* The one font first paint needs, discoverable by the preload scanner at
            the first byte of the document instead of after the root stylesheet has
            been downloaded and parsed. Only the latin subset: the latin-ext face is
            unicode-range gated and nothing in the site renders a codepoint in its
            range, so preloading it would force a download that otherwise never
            happens. `crossOrigin` is required even same-origin — fonts are fetched
            in CORS mode, and a preload without it is a second, separate fetch. */}
        <link
          rel="preload"
          href="/fonts/outfit-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-transparent-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-transparent-32x32.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon-transparent-128x128.png" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

/**
 * The locale every react-aria component formats against.
 *
 * Without an I18nProvider, `useLocale()` answers with the runtime default — the
 * SSR fallback while the pages are prerendered in Node, the browser's setting
 * once they hydrate — so FormattedNumber and every date control would produce
 * two different strings for the same value and the second one would replace the
 * first at hydration. Declaring it fixes both halves to one answer.
 *
 * It is de-DE because that is what the library's own formatters default to
 * (FormattedDate pins "de" and Europe/Berlin), so the gallery shows components
 * behaving the way they will in a quebi app. `<html lang="en">` above describes
 * the language of the prose, which is a different question from how a number is
 * grouped, and the two are allowed to disagree.
 */
const SITE_LOCALE = "de-DE"

export default function App() {
  // /og/<slug> is a screenshot canvas, not a page: it renders the 1200×630
  // share image and nothing else, so the chrome that frames every real route
  // would land inside the picture. It still sits under the I18nProvider — the
  // dates and numbers in a scene have to be formatted the way the gallery
  // formats them, or the share image shows a component the site does not.
  const isOgCanvas = useLocation().pathname.startsWith("/og/")

  if (isOgCanvas) {
    return (
      <I18nProvider locale={SITE_LOCALE}>
        <Outlet />
      </I18nProvider>
    )
  }

  return (
    <I18nProvider locale={SITE_LOCALE}>
      <div className="flex min-h-screen flex-col bg-quebi-bg text-quebi-fg">
        {/* The one global part of the site's pending state. What a navigation
            looks like is local — the clicked NavLink carries it — but "looks"
            is the operative word, and a live region is by nature one place for
            the whole document. */}
        <NavigationStatus />
        <Header />
        {/* <main> is deliberately full-width: it is the flow slot, not the
            shell. A route decides where its own background stops — the home
            hero bleeds its grid and glows to the viewport edge, which a
            max-width here would cut off mid-screen — and puts `quebi-shell` on
            the container that holds its *content*. That one utility (see
            quebi-theme.css) is where the app's width is decided; the header and
            footer use the same one, so all three line up. */}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}
