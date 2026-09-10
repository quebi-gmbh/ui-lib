import { Link, NavLink } from "react-router"
import { ThemeToggle } from "@/site/theme-toggle"
import { Link as UiLink } from "@/components/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-quebi-line/10 bg-quebi-bg/80 backdrop-blur">
      {/* The bar spans the viewport (sticky background + bottom hairline); its
          contents sit in the shell, so the logo lines up with the page under it. */}
      <div className="quebi-shell flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-quebi-fg" aria-label="quebi ui-lib home">
          <img src="/quebi-logo.svg" alt="quebi" className="h-5 w-auto" />
          <span className="text-sm font-medium text-quebi-fg-muted">ui-lib</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <NavLink
            to="/components"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-quebi-brand" : "text-quebi-fg-muted hover:text-quebi-fg"
              }`
            }
          >
            Components
          </NavLink>
          <NavLink
            to="/rules"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-quebi-brand" : "text-quebi-fg-muted hover:text-quebi-fg"
              }`
            }
          >
            Rules
          </NavLink>
          <UiLink
            href="https://github.com/quebi-gmbh"
            target="_blank"
            rel="noreferrer"
            className="text-quebi-fg-muted transition-colors duration-200 hover:text-quebi-fg"
          >
            GitHub
          </UiLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
