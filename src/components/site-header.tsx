import { Link, NavLink } from "react-router"

export function Header() {
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
