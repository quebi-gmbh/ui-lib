import { Outlet, Link, NavLink } from "react-router-dom"

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/10 bg-quebi-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-white" aria-label="quebi ui-lib home">
          <img src="/quebi-logo.svg" alt="quebi" className="h-5 w-auto" />
          <span className="text-sm font-medium text-quebi-fg-muted">ui-lib</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <NavLink
            to="/components"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-quebi-brand" : "text-quebi-fg-muted hover:text-white"
              }`
            }
          >
            Components
          </NavLink>
          <a
            href="https://github.com/quebi-gmbh"
            target="_blank"
            rel="noreferrer"
            className="text-quebi-fg-muted transition-colors duration-200 hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="z-10 border-t border-cyan-500/10 py-8">
      <nav className="flex flex-row flex-wrap justify-center gap-4 text-sm text-quebi-fg-subtle sm:gap-6">
        <Link to="/components" className="hover:text-white">
          Components
        </Link>
        <span aria-hidden>·</span>
        <a href="https://quebi.de/en/imprint" className="hover:text-white">
          Imprint
        </a>
        <span aria-hidden>·</span>
        <a href="https://quebi.de/en/privacy" className="hover:text-white">
          Privacy
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://github.com/quebi-gmbh"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white"
        >
          GitHub
        </a>
      </nav>
      <p className="mt-4 text-center text-xs text-quebi-fg-subtle">
        © {new Date().getFullYear()} quebi GmbH · From Germany
      </p>
    </footer>
  )
}

export default function Layout() {
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
