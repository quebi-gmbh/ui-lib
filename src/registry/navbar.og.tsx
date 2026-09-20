import {
  Navbar,
  NavbarGap,
  NavbarItem,
  NavbarProvider,
  NavbarSection,
  NavbarSpacer,
  NavbarStart,
} from "@/components/navbar"
import type { OgScene } from "./types"

/** The bar at the width a bar wants, with the teal current-page indicator. */
export const navbarOgScene: OgScene = {
  scale: 1.4,
  render: () => (
    <NavbarProvider>
      <div className="w-144">
        <Navbar>
          <NavbarStart>
            <span className="font-semibold text-quebi-fg">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>Dashboard</NavbarItem>
            <NavbarItem>Sessions</NavbarItem>
            <NavbarItem>Pricing</NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
        </Navbar>
      </div>
    </NavbarProvider>
  ),
}
