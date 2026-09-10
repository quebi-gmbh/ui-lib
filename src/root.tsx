import { I18nProvider } from "react-aria-components"
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import { Header } from "@/site/site-header"
import { Footer } from "@/site/site-footer"
import { BodyScrollbar } from "@/site/body-scrollbar"
import "./main.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // data-overlayscrollbars-initialize: hides the native scrollbar until
    // OverlayScrollbars initializes on the body, preventing a flash.
    <html
      lang="en"
      className="bg-quebi-bg dark"
      data-overlayscrollbars-initialize
      suppressHydrationWarning
    >
      <head>
        {/* No-flash theme init: runs before paint so the saved theme is applied
            before first render. quebi is dark-first, so dark is the default. */}
        <script
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
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-transparent-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-transparent-32x32.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicon-transparent-128x128.png" />
        <Meta />
        <Links />
      </head>
      <body data-overlayscrollbars-initialize>
        {children}
        <BodyScrollbar />
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
  return (
    <I18nProvider locale={SITE_LOCALE}>
      <div className="flex min-h-screen flex-col bg-quebi-bg text-quebi-fg">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}
