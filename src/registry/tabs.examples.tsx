import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/tabs"
import type { ComponentExample } from "./types"

export const tabsExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A horizontal tab strip with the active tab in brand teal.",
    render: () => (
      <Tabs defaultSelectedKey="pricing" className="w-full max-w-md">
        <TabList aria-label="Plan editor sections">
          <Tab id="pricing">Pricing</Tab>
          <Tab id="inclusions">Inclusions</Tab>
          <Tab id="visibility">Visibility</Tab>
          <Tab id="history">History</Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="pricing" className="mt-4 text-quebi-fg-muted">
            Pricing panel content.
          </TabPanel>
          <TabPanel id="inclusions" className="mt-4 text-quebi-fg-muted">
            Inclusions panel content.
          </TabPanel>
          <TabPanel id="visibility" className="mt-4 text-quebi-fg-muted">
            Visibility panel content.
          </TabPanel>
          <TabPanel id="history" className="mt-4 text-quebi-fg-muted">
            History panel content.
          </TabPanel>
        </TabPanels>
      </Tabs>
    ),
  },
  {
    title: "Vertical",
    description: "Tabs stacked along a left rail for navigation-style layouts.",
    render: () => (
      <Tabs orientation="vertical" defaultSelectedKey="account" className="w-full max-w-lg">
        <TabList aria-label="Settings sections">
          <Tab id="account">Account</Tab>
          <Tab id="notifications">Notifications</Tab>
          <Tab id="billing">Billing</Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="account" className="text-quebi-fg-muted">
            Manage your account details.
          </TabPanel>
          <TabPanel id="notifications" className="text-quebi-fg-muted">
            Choose how you get notified.
          </TabPanel>
          <TabPanel id="billing" className="text-quebi-fg-muted">
            Update your billing information.
          </TabPanel>
        </TabPanels>
      </Tabs>
    ),
  },
  {
    title: "Disabled tab",
    description: "Individual tabs can be disabled.",
    render: () => (
      <Tabs defaultSelectedKey="overview" className="w-full max-w-md">
        <TabList aria-label="Project sections">
          <Tab id="overview">Overview</Tab>
          <Tab id="activity">Activity</Tab>
          <Tab id="settings" isDisabled>
            Settings
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="overview" className="mt-4 text-quebi-fg-muted">
            Overview panel content.
          </TabPanel>
          <TabPanel id="activity" className="mt-4 text-quebi-fg-muted">
            Activity panel content.
          </TabPanel>
          <TabPanel id="settings" className="mt-4 text-quebi-fg-muted">
            Settings panel content.
          </TabPanel>
        </TabPanels>
      </Tabs>
    ),
  },
]
