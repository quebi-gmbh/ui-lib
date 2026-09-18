import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import type { OgScene } from "./types"

/** Three rows, so the divider rhythm is visible. */
export const descriptionListOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <div className="w-96">
      <DescriptionList>
        <DescriptionTerm>Name</DescriptionTerm>
        <DescriptionDetails>Aurelia Vance</DescriptionDetails>
        <DescriptionTerm>Email</DescriptionTerm>
        <DescriptionDetails>aurelia@quebi.de</DescriptionDetails>
        <DescriptionTerm>Role</DescriptionTerm>
        <DescriptionDetails>Platform Engineer</DescriptionDetails>
      </DescriptionList>
    </div>
  ),
}
