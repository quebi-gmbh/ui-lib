import { Button } from "@/components/button"
import { Heading } from "@/components/heading"
import { Panel } from "@/components/panel"
import { Text } from "@/components/text"
import type { OgScene } from "./types"

/**
 * One brand band with a heading and its ask. The muted tone is a few percent of
 * tint and would photograph as nothing at thumbnail size; the mint one reads as
 * "a band across the page" without needing an edge to say so.
 */
export const panelOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <Panel tone="brand" className="flex w-150 items-center justify-between gap-6">
      <div>
        <Heading level={3}>Move to Pro</Heading>
        <Text className="mt-1">Unlimited projects and SSO.</Text>
      </div>
      <Button intent="primary">Upgrade</Button>
    </Panel>
  ),
}
