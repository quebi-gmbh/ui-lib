import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import { Header } from "@/components/site-header"
import { Footer } from "@/components/site-footer"
import { BodyScrollbar } from "@/components/body-scrollbar"
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

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-quebi-bg text-quebi-fg">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
