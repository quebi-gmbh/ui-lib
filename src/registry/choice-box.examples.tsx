import { useState } from "react"
import type { Selection } from "react-aria-components"
import {
  ChoiceBox,
  ChoiceBoxDescription,
  ChoiceBoxItem,
  ChoiceBoxLabel,
} from "@/components/choice-box"
import type { ComponentExample } from "./types"

export const choiceBoxExamples: ComponentExample[] = [
  {
    title: "Single selection",
    description: "A stacked group where one card can be selected.",
    render: () => (
      <ChoiceBox aria-label="Plan" defaultSelectedKeys={["pro"]} className="w-full max-w-sm">
        <ChoiceBoxItem id="starter" label="Starter" description="For solo projects and prototypes." />
        <ChoiceBoxItem id="pro" label="Pro" description="For growing teams that ship often." />
        <ChoiceBoxItem
          id="enterprise"
          label="Enterprise"
          description="Advanced controls and support."
        />
      </ChoiceBox>
    ),
  },
  {
    title: "Multiple selection",
    description: "Selection mode multiple renders a checkbox per card.",
    render: () => (
      <ChoiceBox
        aria-label="Add-ons"
        selectionMode="multiple"
        defaultSelectedKeys={["analytics"]}
        className="w-full max-w-sm"
      >
        <ChoiceBoxItem id="analytics" label="Analytics" description="Usage dashboards and reports." />
        <ChoiceBoxItem id="backups" label="Backups" description="Daily off-site snapshots." />
        <ChoiceBoxItem id="sso" label="SSO" description="SAML and SCIM provisioning." />
      </ChoiceBox>
    ),
  },
  {
    title: "Columns",
    description: "Lay cards out in a responsive grid.",
    render: () => (
      <ChoiceBox aria-label="Theme" columns={3} gap={4} defaultSelectedKeys={["dark"]}>
        <ChoiceBoxItem id="light" label="Light" />
        <ChoiceBoxItem id="dark" label="Dark" />
        <ChoiceBoxItem id="system" label="System" />
      </ChoiceBox>
    ),
  },
  {
    title: "Custom content",
    description: "Compose labels and descriptions with JSX children.",
    render: () => (
      <ChoiceBox aria-label="Billing" columns={2} gap={4} defaultSelectedKeys={["yearly"]}>
        <ChoiceBoxItem id="monthly" textValue="Monthly">
          <ChoiceBoxLabel>Monthly</ChoiceBoxLabel>
          <ChoiceBoxDescription>$12 / month, billed monthly.</ChoiceBoxDescription>
        </ChoiceBoxItem>
        <ChoiceBoxItem id="yearly" textValue="Yearly">
          <ChoiceBoxLabel>Yearly</ChoiceBoxLabel>
          <ChoiceBoxDescription>$120 / year, save 17%.</ChoiceBoxDescription>
        </ChoiceBoxItem>
      </ChoiceBox>
    ),
  },
  {
    title: "Disabled & readonly",
    description: "Disable individual cards, or make the whole group read-only.",
    render: () => (
      <ChoiceBox
        aria-label="Region"
        isReadOnly
        defaultSelectedKeys={["eu"]}
        disabledKeys={["us"]}
        className="w-full max-w-sm"
      >
        <ChoiceBoxItem id="eu" label="Europe" description="Frankfurt (eu-central-1)." />
        <ChoiceBoxItem id="us" label="United States" description="Currently unavailable." />
      </ChoiceBox>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [selected, setSelected] = useState<Selection>(new Set(["balanced"]))
        return (
          <ChoiceBox
            aria-label="Mode"
            selectedKeys={selected}
            onSelectionChange={setSelected}
            className="w-full max-w-sm"
          >
            <ChoiceBoxItem id="eco" label="Eco" description="Lower cost, slower." />
            <ChoiceBoxItem id="balanced" label="Balanced" description="A sensible default." />
            <ChoiceBoxItem id="turbo" label="Turbo" description="Fastest, higher cost." />
          </ChoiceBox>
        )
      }
      return <ControlledExample />
    },
  },
]
