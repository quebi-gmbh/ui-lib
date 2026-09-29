import { bic, iban, StructuredInput } from "@/components/structured-input"
import type { OgScene } from "./types"

/**
 * A complete IBAN above a half-typed BIC: the groups of four are what make it
 * read as a bank field and not a row of boxes, and the empty slots of the BIC
 * say the slots are typed into. Belgian rather than German because sixteen
 * slots fit the stage at a scale where the digits clear the 18px floor and
 * twenty-two do not.
 */
export const structuredInputOgScene: OgScene = {
  scale: 1.4,
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <StructuredInput
        format={iban("BE")}
        value="BE68539007547034"
        onChange={() => {}}
        aria-label="IBAN"
      />
      <StructuredInput format={bic} value="DEUTDE" onChange={() => {}} aria-label="BIC" />
    </div>
  ),
}
