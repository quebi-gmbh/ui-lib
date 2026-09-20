import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/tabs"
import type { OgScene } from "./types"

/** The strip and one panel — a tab list on its own could be a toggle group. */
export const tabsOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <Tabs defaultSelectedKey="pricing" className="w-96">
      <TabList aria-label="Plan editor sections">
        <Tab id="pricing">Pricing</Tab>
        <Tab id="inclusions">Inclusions</Tab>
        <Tab id="visibility">Visibility</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="pricing" className="mt-4 text-sm text-quebi-fg-muted">
          €9 per month, billed to the workspace.
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
}
