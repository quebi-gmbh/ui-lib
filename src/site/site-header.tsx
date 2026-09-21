import { Link, NavLink } from "react-router"
import { NAV_PENDING } from "@/site/navigation-status"
import { ThemeToggle } from "@/site/theme-toggle"
import { Link as UiLink } from "@/components/link"
import { cn } from "@/lib/utils"

/** Same three states as the sidebars', in the header's flatter vocabulary. */
const navClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn(
    "transition-colors duration-200",
    isActive
      ? "text-quebi-brand-text"
      : isPending
        ? NAV_PENDING
        : "text-quebi-fg-muted hover:text-quebi-fg",
  )

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
          <NavLink to="/components" className={navClasses}>
            Components
          </NavLink>
          <NavLink to="/rules" className={navClasses}>
            Rules
          </NavLink>
          {/* Nav, not prose: no resting underline, matching the NavLinks beside it. */}
          <UiLink
            href="https://github.com/quebi-gmbh"
            target="_blank"
            rel="noreferrer"
            className="no-underline text-quebi-fg-muted transition-colors duration-200 hover:text-quebi-fg"
          >
            GitHub
          </UiLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
