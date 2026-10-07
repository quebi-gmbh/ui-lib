import { Home, Settings, Users } from "lucide-react"
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
 *
 * Three rows and no count badge. The badge is a 10px numeral, the smallest type
 * in the component and four pixels wide in an unfurl, and it was setting the
 * scale for everything else in the picture. The scale is set by the section
 * label instead: an 11px mono eyebrow, which 1.7 lifts just over the 18px floor.
 */
export const sidebarOgScene: OgScene = {
  scale: 1.7,
  render: () => (
    <Card className="h-52 w-144 overflow-hidden p-0">
      <SidebarProvider className="h-full">
        <Sidebar>
          <SidebarHeader>
            <span className="px-2 font-display font-light text-quebi-fg text-xl">quebi</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarSection label="overview">
              <SidebarItem isCurrent href="#dashboard">
                <Home data-slot="icon" aria-hidden="true" />
                <SidebarLabel>dashboard</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="#roster">
                <Users data-slot="icon" aria-hidden="true" />
                <SidebarLabel>roster</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="#settings">
                <Settings data-slot="icon" aria-hidden="true" />
                <SidebarLabel>settings</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <SidebarNav>
            <SidebarTrigger />
            <span className="text-quebi-body-s text-quebi-fg-muted">dashboard</span>
          </SidebarNav>
          <div className="p-6 text-sm text-quebi-fg-muted">Main content area.</div>
        </SidebarInset>
      </SidebarProvider>
    </Card>
  ),
}
