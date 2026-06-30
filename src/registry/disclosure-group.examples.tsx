import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/disclosure-group"
import type { ComponentExample } from "./types"

export const disclosureGroupExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A single expandable section open at a time.",
    render: () => (
      <DisclosureGroup defaultExpandedKeys={["what"]} className="w-full max-w-md">
        <Disclosure id="what">
          <DisclosureTrigger>What is quebi?</DisclosureTrigger>
          <DisclosurePanel>
            A copy-paste React component library styled with the quebi design system, built on
            react-aria-components for an accessible baseline.
          </DisclosurePanel>
        </Disclosure>
        <Disclosure id="how">
          <DisclosureTrigger>How do I install a component?</DisclosureTrigger>
          <DisclosurePanel>
            Use the shadcn registry, or copy the source straight into your project — each component
            is self-contained.
          </DisclosurePanel>
        </Disclosure>
        <Disclosure id="style">
          <DisclosureTrigger>Can I restyle it?</DisclosureTrigger>
          <DisclosurePanel>
            Yes. The components own their markup, so you can adjust tokens and classes however you
            like.
          </DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>
    ),
  },
  {
    title: "Multiple expanded",
    description: "Allow several sections to stay open at once.",
    render: () => (
      <DisclosureGroup
        allowsMultipleExpanded
        defaultExpandedKeys={["a", "b"]}
        className="w-full max-w-md"
      >
        <Disclosure id="a">
          <DisclosureTrigger>Shipping</DisclosureTrigger>
          <DisclosurePanel>Orders ship within two business days.</DisclosurePanel>
        </Disclosure>
        <Disclosure id="b">
          <DisclosureTrigger>Returns</DisclosureTrigger>
          <DisclosurePanel>Return any item within 30 days for a full refund.</DisclosurePanel>
        </Disclosure>
        <Disclosure id="c">
          <DisclosureTrigger>Warranty</DisclosureTrigger>
          <DisclosurePanel>All products carry a one-year limited warranty.</DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>
    ),
  },
  {
    title: "Disabled item",
    description: "Individual sections can be disabled.",
    render: () => (
      <DisclosureGroup className="w-full max-w-md">
        <Disclosure id="open">
          <DisclosureTrigger>Available section</DisclosureTrigger>
          <DisclosurePanel>This section expands normally.</DisclosurePanel>
        </Disclosure>
        <Disclosure id="locked" isDisabled>
          <DisclosureTrigger>Locked section</DisclosureTrigger>
          <DisclosurePanel>You should not be able to reach this.</DisclosurePanel>
        </Disclosure>
      </DisclosureGroup>
    ),
  },
]
