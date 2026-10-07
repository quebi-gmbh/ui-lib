import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/disclosure-group"
import type { OgScene } from "./types"

/** One section open, two closed — the accordion's whole argument in one frame. */
export const disclosureGroupOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <DisclosureGroup defaultExpandedKeys={["what"]} className="w-96">
      <Disclosure id="what">
        <DisclosureTrigger>what is quebi?</DisclosureTrigger>
        <DisclosurePanel>
          A copy-paste React component library styled with the quebi design system.
        </DisclosurePanel>
      </Disclosure>
      <Disclosure id="how">
        <DisclosureTrigger>how do I install a component?</DisclosureTrigger>
        <DisclosurePanel>Copy the source — each component is self-contained.</DisclosurePanel>
      </Disclosure>
      <Disclosure id="style">
        <DisclosureTrigger>can I restyle it?</DisclosureTrigger>
        <DisclosurePanel>Every value is a quebi token.</DisclosurePanel>
      </Disclosure>
    </DisclosureGroup>
  ),
}
