import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@/components/tabs"
import type { OgScene } from "./types"

/** The strip and one panel — a tab list on its own could be a toggle group. */
export const tabsOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <Tabs defaultSelectedKey="pricing" className="w-96">
      <TabList aria-label="Plan editor sections">
        <Tab id="pricing">pricing</Tab>
        <Tab id="inclusions">inclusions</Tab>
        <Tab id="visibility">visibility</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="pricing" className="mt-4">
          €9 per month, billed to the workspace.
        </TabPanel>
      </TabPanels>
    </Tabs>
  ),
}
