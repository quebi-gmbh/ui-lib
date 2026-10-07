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

/** The bar at the width a bar wants, with the current page underlined. */
export const navbarOgScene: OgScene = {
  scale: 1.4,
  render: () => (
    <NavbarProvider>
      <div className="w-144">
        <Navbar>
          <NavbarStart>
            <span className="font-display font-light text-quebi-fg text-xl">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>dashboard</NavbarItem>
            <NavbarItem>sessions</NavbarItem>
            <NavbarItem>pricing</NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
        </Navbar>
      </div>
    </NavbarProvider>
  ),
}
