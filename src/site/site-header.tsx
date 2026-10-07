import { Link, NavLink } from "react-router"
import { NAV_PENDING } from "@/site/navigation-status"
import { ThemeToggle } from "@/site/theme-toggle"
import { Menu as MenuIcon } from "lucide-react"
import { Button } from "@/components/button"
import { Link as UiLink } from "@/components/link"
import { Logo } from "@/components/logo"
import { Sheet, SheetContent } from "@/components/sheet"
import { cn } from "@/lib/utils"

/**
 * The design's NavBar: lowercase Outfit links, the current page underlined at
 * the 5px offset, hover the same. Same three states as the sidebars'.
 */
const NAV_LINK =
  "font-display text-quebi-nav text-quebi-fg decoration-1 underline-offset-5 transition-[text-underline-offset] duration-150 hover:underline"

const navClasses = ({ isActive, isPending }: { isActive: boolean; isPending: boolean }) =>
  cn(NAV_LINK, isActive && "underline", isPending && NAV_PENDING)

const SECTIONS = [
  { to: "/components", label: "components" },
  { to: "/rules", label: "rules" },
  { to: "/theme", label: "theme" },
]

const GITHUB = "https://github.com/quebi-gmbh"

/**
 * Below `sm` the links do not fit beside the wordmark, so they move into a
 * sheet behind one "menu" button — the same links, set at title size with a
 * hairline between them, so the touch targets are rows rather than words.
 */
function MobileMenu() {
  return (
    <Sheet>
      <Button intent="ghost" size="sm" className="sm:hidden" aria-label="Open menu">
        <MenuIcon data-slot="icon" aria-hidden strokeWidth={1.5} />
        menu
      </Button>
      <SheetContent side="right" isFloat={false} aria-label="Main menu" className="w-4/5 max-w-80">
        {({ close }) => (
          <nav aria-label="Main" className="flex flex-col px-6 pt-14 pb-6">
            {SECTIONS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={close}
                className={({ isActive, isPending }) =>
                  cn(
                    "border-b border-quebi-hairline py-3 font-display text-quebi-title text-quebi-fg",
                    "decoration-1 underline-offset-5",
                    isActive && "underline",
                    isPending && NAV_PENDING,
                  )
                }
              >
                {label}
              </NavLink>
            ))}
            <UiLink
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="border-b border-quebi-hairline py-3 font-display text-quebi-title text-quebi-fg no-underline"
            >
              github
            </UiLink>
          </nav>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-quebi-hairline bg-quebi-bg/90 backdrop-blur">
      {/* The bar spans the viewport (sticky background + bottom hairline); its
          contents sit in the shell, so the logo lines up with the page under it. */}
      <div className="quebi-shell flex h-16 items-center justify-between gap-3">
        {/* Named by its contents: the logo's "quebi" and the "ui-lib" beside it. */}
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <Logo />
          <span className="quebi-eyebrow">ui-lib</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <nav aria-label="Main" className="hidden items-center gap-6 sm:flex">
            {SECTIONS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navClasses}>
                {label}
              </NavLink>
            ))}
            {/* Nav, not prose: no resting underline, matching the NavLinks beside it. */}
            <UiLink
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className={cn(NAV_LINK, "no-underline hover:underline")}
            >
              github
            </UiLink>
          </nav>
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
