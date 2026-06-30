import { useState } from "react"
import { Outlet } from "react-router"
import { Menu, X } from "lucide-react"
import { ComponentSidebar } from "@/components/component-sidebar"

export default function ComponentsLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="mb-4 inline-flex items-center gap-2 rounded-quebi-sm border border-cyan-500/20 px-3 py-2 text-sm text-quebi-fg-muted transition-colors duration-200 hover:border-quebi-brand hover:text-quebi-brand lg:hidden"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Components
        </button>

        <aside
          className={`${mobileOpen ? "block" : "hidden"} mb-8 lg:mb-0 lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]`}
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
