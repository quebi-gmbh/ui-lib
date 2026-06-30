import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import { Header } from "@/components/site-header"
import { Footer } from "@/components/site-footer"
import "./main.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-quebi-bg">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-quebi-bg text-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
