import {
  Sidebar,
  SidebarContent,
  SidebarDisclosure,
  SidebarDisclosureGroup,
  SidebarDisclosurePanel,
  SidebarDisclosureTrigger,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/sidebar"
import type { ComponentExample } from "./types"

const HomeIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
)

const UsersIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const ChartIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 3v18h18M7 16l4-4 3 3 5-6" />
  </svg>
)

const SettingsIcon = () => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="h-[28rem] w-full overflow-hidden rounded-quebi-md border border-cyan-500/10">
    {children}
  </div>
)

export const sidebarExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A standard sidebar with a header, sections, an active item, and a footer.",
    render: () => (
      <Shell>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <span className="px-2 font-semibold text-white">quebi</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarSection label="Overview">
                <SidebarItem isCurrent href="#dashboard">
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#roster" badge={12}>
                  <UsersIcon />
                  <SidebarLabel>Roster</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#reports">
                  <ChartIcon />
                  <SidebarLabel>Reports</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
              <SidebarSeparator />
              <SidebarSection label="System">
                <SidebarItem href="#settings">
                  <SettingsIcon />
                  <SidebarLabel>Settings</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarContent>
            <SidebarFooter>
              <span className="text-sm text-quebi-fg-muted">v1.0.0</span>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <SidebarNav isSticky>
              <SidebarTrigger />
              <span className="text-sm text-quebi-fg-muted">Dashboard</span>
            </SidebarNav>
            <div className="p-6 text-quebi-fg-muted">Main content area.</div>
          </SidebarInset>
        </SidebarProvider>
      </Shell>
    ),
  },
  {
    title: "Collapsible to dock",
    description: "Use the trigger (or Cmd/Ctrl+B) to collapse into an icon-only dock rail.",
    render: () => (
      <Shell>
        <SidebarProvider defaultOpen={false}>
          <Sidebar collapsible="dock">
            <SidebarHeader>
              <span className="font-semibold text-white">q</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarSection label="Overview">
                <SidebarItem isCurrent href="#dashboard" tooltip="Dashboard">
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#roster" tooltip="Roster" badge={3}>
                  <UsersIcon />
                  <SidebarLabel>Roster</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#settings" tooltip="Settings">
                  <SettingsIcon />
                  <SidebarLabel>Settings</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <SidebarNav isSticky>
              <SidebarTrigger />
              <span className="text-sm text-quebi-fg-muted">Collapse me</span>
            </SidebarNav>
            <div className="p-6 text-quebi-fg-muted">Toggle the rail with the button.</div>
          </SidebarInset>
        </SidebarProvider>
      </Shell>
    ),
  },
  {
    title: "Disclosure groups",
    description: "Nest collapsible groups of items with SidebarDisclosure.",
    render: () => (
      <Shell>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <span className="px-2 font-semibold text-white">quebi</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarSection>
                <SidebarDisclosureGroup defaultExpandedKeys={["team"]}>
                  <SidebarDisclosure id="team">
                    <SidebarDisclosureTrigger>
                      <UsersIcon />
                      <SidebarLabel>Team</SidebarLabel>
                    </SidebarDisclosureTrigger>
                    <SidebarDisclosurePanel>
                      <SidebarItem href="#members">
                        <SidebarLabel>Members</SidebarLabel>
                      </SidebarItem>
                      <SidebarItem isCurrent href="#invites">
                        <SidebarLabel>Invites</SidebarLabel>
                      </SidebarItem>
                    </SidebarDisclosurePanel>
                  </SidebarDisclosure>
                  <SidebarDisclosure id="reports">
                    <SidebarDisclosureTrigger>
                      <ChartIcon />
                      <SidebarLabel>Reports</SidebarLabel>
                    </SidebarDisclosureTrigger>
                    <SidebarDisclosurePanel>
                      <SidebarItem href="#weekly">
                        <SidebarLabel>Weekly</SidebarLabel>
                      </SidebarItem>
                      <SidebarItem href="#monthly">
                        <SidebarLabel>Monthly</SidebarLabel>
                      </SidebarItem>
                    </SidebarDisclosurePanel>
                  </SidebarDisclosure>
                </SidebarDisclosureGroup>
              </SidebarSection>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <SidebarNav isSticky>
              <SidebarTrigger />
              <span className="text-sm text-quebi-fg-muted">Team</span>
            </SidebarNav>
            <div className="p-6 text-quebi-fg-muted">Expand the groups in the sidebar.</div>
          </SidebarInset>
        </SidebarProvider>
      </Shell>
    ),
  },
  {
    title: "Float intent",
    description: 'Set intent="float" for a detached, rounded surface with a quebi glow.',
    render: () => (
      <Shell>
        <SidebarProvider>
          <Sidebar intent="float">
            <SidebarHeader>
              <span className="px-2 font-semibold text-white">quebi</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarSection label="Overview">
                <SidebarItem isCurrent href="#dashboard">
                  <HomeIcon />
                  <SidebarLabel>Dashboard</SidebarLabel>
                </SidebarItem>
                <SidebarItem href="#reports">
                  <ChartIcon />
                  <SidebarLabel>Reports</SidebarLabel>
                </SidebarItem>
              </SidebarSection>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <SidebarNav isSticky>
              <SidebarTrigger />
              <span className="text-sm text-quebi-fg-muted">Floating</span>
            </SidebarNav>
            <div className="p-6 text-quebi-fg-muted">A floating sidebar surface.</div>
          </SidebarInset>
        </SidebarProvider>
      </Shell>
    ),
  },
]
