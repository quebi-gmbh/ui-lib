import type { AsyncMultipleSelectOption } from "@/components/async-multiple-select"
import { ConformAsyncMultipleSelect } from "@/components/conform-async-multiple-select"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

interface Owner extends AsyncMultipleSelectOption {
  id: string
  name: string
}

const OWNERS: Owner[] = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
]

const loadOwners = async () => ({ items: OWNERS })

export const conformAsyncMultipleSelectOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ owners: string[] }> defaultValue={{ owners: ["ada", "grace"] }}>
      {(fields) => (
        <ConformAsyncMultipleSelect<Owner>
          field={fields.owners}
          label="Owners"
          description="Chips are the submitted keys."
          load={loadOwners}
          defaultSelected={OWNERS}
        />
      )}
    </OgForm>
  ),
}
