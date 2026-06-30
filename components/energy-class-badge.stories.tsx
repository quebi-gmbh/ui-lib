import type { Meta, StoryObj } from "@storybook/react-vite"
import { EnergyClassBadge } from "./energy-class-badge"

const meta = {
  title: "Cellestial DS/Components/EnergyClassBadge",
  component: EnergyClassBadge,
  parameters: { layout: "centered" },
  argTypes: {
    energyClass: { control: "text" },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof EnergyClassBadge>

export default meta
type Story = StoryObj<typeof meta>

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">{children}</div>
)

export const Scale: Story = {
  args: { energyClass: "A" },
  render: () => (
    <Row>
      {["A", "B", "C", "D", "E", "F", "G"].map((cls) => (
        <EnergyClassBadge key={cls} energyClass={cls} />
      ))}
    </Row>
  ),
}

export const Sizes: Story = {
  args: { energyClass: "A" },
  render: () => (
    <Row>
      <EnergyClassBadge energyClass="A" size="sm" />
      <EnergyClassBadge energyClass="A" size="md" />
      <EnergyClassBadge energyClass="A" size="lg" />
    </Row>
  ),
}

export const UnknownFallback: Story = {
  args: { energyClass: "A+" },
  render: () => (
    <Row>
      <EnergyClassBadge energyClass="A+" />
      <EnergyClassBadge energyClass="?" />
    </Row>
  ),
}

export const Playground: Story = {
  args: { energyClass: "A", size: "md" },
}
