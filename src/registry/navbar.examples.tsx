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
      "A top navigation bar with the mark at the start, primary links, and trailing actions. The current link is underlined; a hairline runs under the bar.",
    render: () => (
      <NavbarProvider>
        <Navbar>
          <NavbarStart>
            <span className="font-display font-light text-quebi-fg text-xl">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>dashboard</NavbarItem>
            <NavbarItem>sessions</NavbarItem>
            <NavbarItem>pricing</NavbarItem>
            <NavbarItem>settings</NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem>help</NavbarItem>
            <NavbarSeparator />
            <NavbarItem>sign out</NavbarItem>
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
          <span className="font-display font-light text-quebi-fg text-xl">quebi</span>
        </NavbarMobile>
        <Navbar>
          <NavbarStart>
            <span className="font-display font-light text-quebi-fg text-xl">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>home</NavbarItem>
            <NavbarItem>reports</NavbarItem>
            <NavbarItem>team</NavbarItem>
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
            <span className="font-display font-light text-quebi-fg text-xl">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>overview</NavbarItem>
            <NavbarItem>analytics</NavbarItem>
            <NavbarItem>billing</NavbarItem>
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
    title: "Plain",
    description:
      "No hairline under the bar — for a navbar that sits on a Stage, where the low title carries the rule.",
    render: () => (
      <NavbarProvider>
        <Navbar intent="plain">
          <NavbarStart>
            <span className="font-display font-light text-quebi-fg text-xl">quebi</span>
          </NavbarStart>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem isCurrent>work</NavbarItem>
            <NavbarItem>studio</NavbarItem>
            <NavbarItem>contact</NavbarItem>
          </NavbarSection>
        </Navbar>
      </NavbarProvider>
    ),
  },
  {
    title: "Float intent",
    description: "A navbar that detaches from the page edge and floats above it, like any other floating surface.",
    render: () => (
      <NavbarProvider>
        <Navbar intent="float">
          <NavbarStart>
            <span className="font-display font-light text-quebi-fg text-xl">quebi</span>
          </NavbarStart>
          <NavbarGap />
          <NavbarSection>
            <NavbarItem isCurrent>discover</NavbarItem>
            <NavbarItem>library</NavbarItem>
            <NavbarItem>account</NavbarItem>
          </NavbarSection>
        </Navbar>
      </NavbarProvider>
    ),
  },
]
