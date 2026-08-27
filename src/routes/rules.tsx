import { useState } from "react"
import { Outlet } from "react-router"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/button"
import { RuleSidebar } from "@/components/rule-sidebar"
import { cn } from "@/lib/utils"

/**
 * Layout for the rules section: sidebar + content, mirroring the components
 * gallery. The toggle is a Button rather than a styled <button>, which is the
 * rule this section opens with.
 */
export default function RulesLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        <Button
          intent="outline"
          size="sm"
          onPress={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          className="mb-4 lg:hidden"
        >
          {mobileOpen ? (
            <X data-slot="icon" aria-hidden />
          ) : (
            <Menu data-slot="icon" aria-hidden />
          )}
          Rules
        </Button>

        <aside
          className={cn(
            mobileOpen ? "block" : "hidden",
            "mb-8 lg:mb-0 lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]",
          )}
        >
          <RuleSidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
