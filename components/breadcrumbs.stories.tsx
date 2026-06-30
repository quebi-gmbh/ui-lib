import type { Meta, StoryObj } from "@storybook/react-vite"
import { Breadcrumbs, BreadcrumbsItem } from "./breadcrumbs"

const meta = {
  title: "Cellestial DS/Components/Breadcrumbs",
  component: Breadcrumbs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Breadcrumbs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbsItem href="/">Catalog</BreadcrumbsItem>
      <BreadcrumbsItem href="/devices">Devices</BreadcrumbsItem>
      <BreadcrumbsItem>iPhone 15 Pro Max</BreadcrumbsItem>
    </Breadcrumbs>
  ),
}

export const Slash: Story = {
  render: () => (
    <Breadcrumbs separator="slash">
      <BreadcrumbsItem href="/">Plans</BreadcrumbsItem>
      <BreadcrumbsItem href="/plans/flex-50">Flex 50</BreadcrumbsItem>
      <BreadcrumbsItem>Pricing</BreadcrumbsItem>
    </Breadcrumbs>
  ),
}
