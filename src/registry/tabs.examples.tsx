import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/tabs"
import type { ComponentExample } from "./types"

export const tabsExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A horizontal tab strip on a hairline, the selected tab in ink with a rule under it.",
    render: () => (
      <Tabs defaultSelectedKey="pricing" className="w-full max-w-md">
        <TabList aria-label="Plan editor sections">
          <Tab id="pricing">pricing</Tab>
          <Tab id="inclusions">inclusions</Tab>
          <Tab id="visibility">visibility</Tab>
          <Tab id="history">history</Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="pricing" className="mt-4">
            Pricing panel content.
          </TabPanel>
          <TabPanel id="inclusions" className="mt-4">
            Inclusions panel content.
          </TabPanel>
          <TabPanel id="visibility" className="mt-4">
            Visibility panel content.
          </TabPanel>
          <TabPanel id="history" className="mt-4">
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
          <Tab id="account">account</Tab>
          <Tab id="notifications">notifications</Tab>
          <Tab id="billing">billing</Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="account">
            Manage your account details.
          </TabPanel>
          <TabPanel id="notifications">
            Choose how you get notified.
          </TabPanel>
          <TabPanel id="billing">
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
          <Tab id="overview">overview</Tab>
          <Tab id="activity">activity</Tab>
          <Tab id="settings" isDisabled>
            settings
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="overview" className="mt-4">
            Overview panel content.
          </TabPanel>
          <TabPanel id="activity" className="mt-4">
            Activity panel content.
          </TabPanel>
          <TabPanel id="settings" className="mt-4">
            Settings panel content.
          </TabPanel>
        </TabPanels>
      </Tabs>
    ),
  },
]
