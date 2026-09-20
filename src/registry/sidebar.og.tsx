import { BarChart3, Home, Settings, Users } from "lucide-react"
import { Card } from "@/components/card"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarTrigger,
} from "@/components/sidebar"
import type { OgScene } from "./types"

/**
 * The rail and the inset it pushes, in a box the size of a small window —
 * a sidebar photographed on its own is a list, and the point is the split.
 */
export const sidebarOgScene: OgScene = {
  scale: 1.2,
  render: () => (
    <Card className="h-80 w-160 overflow-hidden p-0">
      <SidebarProvider className="h-full">
        <Sidebar>
          <SidebarHeader>
            <span className="px-2 font-semibold text-quebi-fg">quebi</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection label="Overview">
              <SidebarItem isCurrent href="#dashboard">
                <Home data-slot="icon" aria-hidden="true" />
                <SidebarLabel>Dashboard</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="#roster" badge={12}>
                <Users data-slot="icon" aria-hidden="true" />
                <SidebarLabel>Roster</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="#reports">
                <BarChart3 data-slot="icon" aria-hidden="true" />
                <SidebarLabel>Reports</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="#settings">
                <Settings data-slot="icon" aria-hidden="true" />
                <SidebarLabel>Settings</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarNav>
            <SidebarTrigger />
            <span className="text-sm text-quebi-fg-muted">Dashboard</span>
          </SidebarNav>
          <div className="p-6 text-sm text-quebi-fg-muted">Main content area.</div>
        </SidebarInset>
      </SidebarProvider>
    </Card>
  ),
}
