import { Button } from "@/components/button"
import { ButtonGroup } from "@/components/button-group"
import type { OgScene } from "./types"

/** The segmented control, with the seam between the buttons doing the talking. */
export const buttonGroupOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <ButtonGroup>
      <Button intent="outline">Day</Button>
      <Button intent="outline">Week</Button>
      <Button intent="outline">Month</Button>
    </ButtonGroup>
  ),
}
