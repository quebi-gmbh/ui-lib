import type { Meta, StoryObj } from "@storybook/react-vite"
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "./tabs"

/**
 * Verbatim port of the Tabs example from cellestial-ds/showcase.html.
 *
 * Spec `.tabs`:
 *   - border-bottom ink-100, gap-2, flex
 *   - button: font-body 600 / 14px / ink-500, py-2.5 (10px), no horizontal padding, mr-4 between
 *   - is-active: text ink-900; 3px brand-500 underline at bottom:-1px, rounded 2px
 */

const meta = {
  title: "Cellestial DS/Components/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultSelectedKey="pricing">
      <TabList aria-label="Plan editor sections">
        <Tab id="pricing">Pricing</Tab>
        <Tab id="inclusions">Inclusions</Tab>
        <Tab id="visibility">Visibility</Tab>
        <Tab id="history">History</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="pricing" className="mt-4 text-ink-800">
          Pricing panel content.
        </TabPanel>
        <TabPanel id="inclusions" className="mt-4 text-ink-800">
          Inclusions panel content.
        </TabPanel>
        <TabPanel id="visibility" className="mt-4 text-ink-800">
          Visibility panel content.
        </TabPanel>
        <TabPanel id="history" className="mt-4 text-ink-800">
          History panel content.
        </TabPanel>
      </TabPanels>
      <p className="text-ink-500 text-[13px] mt-4">
        Used inside editors. Max 5 tabs — more and you need a sub-page or a sidebar.
      </p>
    </Tabs>
  ),
}
