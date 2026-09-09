import { useState } from "react"
import { Outlet } from "react-router"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/button"
import { ComponentSidebar } from "@/components/component-sidebar"
import { cn } from "@/lib/utils"

export default function ComponentsLayout() {
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
          {mobileOpen ? <X data-slot="icon" aria-hidden /> : <Menu data-slot="icon" aria-hidden />}
          Components
        </Button>

        <aside
          className={cn(
            mobileOpen ? "block" : "hidden",
            "mb-8 lg:mb-0 lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]",
          )}
        >
          <ComponentSidebar onNavigate={() => setMobileOpen(false)} />
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
