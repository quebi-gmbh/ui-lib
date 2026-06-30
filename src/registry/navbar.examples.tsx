import {
  Navbar,
  NavbarGap,
  NavbarItem,
  NavbarLabel,
  NavbarMobile,
  NavbarProvider,
  NavbarSection,
  NavbarSeparator,
  NavbarSpacer,
  NavbarStart,
  NavbarTrigger,
} from "@/components/navbar"
import type { ComponentExample } from "./types"

export const navbarExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "A top navigation bar with a brand mark, primary links, and trailing actions. The active link shows the brand-teal indicator.",
    render: () => (
      <NavbarProvider>
        <Navbar>
          <NavbarStart>
            <span className="font-semibold text-white">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>Dashboard</NavbarItem>
            <NavbarItem>Sessions</NavbarItem>
            <NavbarItem>Pricing</NavbarItem>
            <NavbarItem>Settings</NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem>Help</NavbarItem>
            <NavbarSeparator />
            <NavbarItem>Sign out</NavbarItem>
          </NavbarSection>
        </Navbar>
      </NavbarProvider>
    ),
  },
  {
    title: "With mobile trigger",
    description:
      "Pair NavbarMobile + NavbarTrigger to expose the menu toggle. Below the md breakpoint the Navbar collapses into a Sheet drawer.",
    render: () => (
      <NavbarProvider>
        <NavbarMobile>
          <NavbarTrigger />
          <span className="font-semibold text-white">quebi</span>
        </NavbarMobile>
        <Navbar>
          <NavbarStart>
            <span className="font-semibold text-white">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>Home</NavbarItem>
            <NavbarItem>Reports</NavbarItem>
            <NavbarItem>Team</NavbarItem>
          </NavbarSection>
        </Navbar>
      </NavbarProvider>
    ),
  },
  {
    title: "Sticky",
    description: "A sticky top navbar that stays pinned as the page scrolls.",
    render: () => (
      <NavbarProvider>
        <Navbar isSticky placement="top">
          <NavbarStart>
            <span className="font-semibold text-white">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>Overview</NavbarItem>
            <NavbarItem>Analytics</NavbarItem>
            <NavbarItem>Billing</NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarLabel className="text-quebi-fg-muted">ms@quebi.de</NavbarLabel>
          </NavbarSection>
        </Navbar>
      </NavbarProvider>
    ),
  },
  {
    title: "Float intent",
    description: "A floating, rounded navbar surface that detaches from the page edge.",
    render: () => (
      <NavbarProvider>
        <Navbar intent="float">
          <NavbarStart>
            <span className="font-semibold text-white">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>Discover</NavbarItem>
            <NavbarItem>Library</NavbarItem>
            <NavbarItem>Account</NavbarItem>
          </NavbarSection>
        </Navbar>
      </NavbarProvider>
    ),
  },
]
