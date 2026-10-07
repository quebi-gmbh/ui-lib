import { Link, NavLink } from "react-router"
import { NAV_PENDING } from "@/site/navigation-status"
import { ThemeToggle } from "@/site/theme-toggle"
import { Link as UiLink } from "@/components/link"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

/**
 * The design's NavBar: lowercase Outfit links, the current page underlined at
 * the 5px offset, hover the same. Same three states as the sidebars'.
 */
const NAV_LINK =
  "font-display text-quebi-nav text-quebi-fg decoration-1 underline-offset-5 transition-[text-underline-offset] duration-150 hover:underline"

const navClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn(NAV_LINK, isActive && "underline", isPending && NAV_PENDING)

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-quebi-hairline bg-quebi-bg/90 backdrop-blur">
      {/* The bar spans the viewport (sticky background + bottom hairline); its
          contents sit in the shell, so the logo lines up with the page under it. */}
      <div className="quebi-shell flex h-16 items-center justify-between gap-4">
        {/* Named by its contents: the logo's "quebi" and the "ui-lib" beside it. */}
        <Link to="/" className="flex items-center gap-3">
          <Logo />
          <span className="quebi-eyebrow">ui-lib</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-4 sm:gap-6">
          <NavLink to="/components" className={navClasses}>
            components
          </NavLink>
          <NavLink to="/rules" className={navClasses}>
            rules
          </NavLink>
          {/* Nav, not prose: no resting underline, matching the NavLinks beside it. */}
          <UiLink
            href="https://github.com/quebi-gmbh"
            target="_blank"
            rel="noreferrer"
            className={cn(NAV_LINK, "no-underline hover:underline")}
          >
            github
          </UiLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
