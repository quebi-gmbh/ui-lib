import type { AsyncSelectOption } from "@/components/async-select"
import { ConformAsyncSelect } from "@/components/conform-async-select"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

interface Owner extends AsyncSelectOption {
  id: string
  name: string
}

const OWNERS: Owner[] = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
]

/** An already-settled page: a still life cannot photograph latency. */
const loadOwners = async () => ({ items: OWNERS })

export const conformAsyncSelectOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ owner: string }> defaultValue={{ owner: "ada" }}>
      {(fields) => (
        <ConformAsyncSelect<Owner>
          field={fields.owner}
          label="Owner"
          description="Loaded from the server as you type."
          load={loadOwners}
          defaultSelected={OWNERS[0]}
        />
      )}
    </OgForm>
  ),
}
