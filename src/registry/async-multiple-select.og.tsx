import {
  AsyncMultipleSelect,
  type AsyncMultipleSelectOption,
} from "@/components/async-multiple-select"
import { useFocusOnMount } from "./og-scene"
import type { OgScene } from "./types"

interface Owner extends AsyncMultipleSelectOption {
  id: string
  name: string
}

const OWNERS: Owner[] = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
  { id: "alan", name: "Alan Turing" },
]

/** The same already-settled page as the single-value scene, with two chips in. */
const loadOwners = async () => ({ items: OWNERS })

const OpenOwnerPicker = () => {
  const ref = useFocusOnMount<HTMLDivElement>()

  return (
    <div ref={ref} className="w-80">
      <AsyncMultipleSelect<Owner>
        aria-label="Owners"
        placeholder="Select owners"
        defaultValue={[OWNERS[0] as Owner]}
        load={loadOwners}
      />
    </div>
  )
}

export const asyncMultipleSelectOgScene: OgScene = {
  scale: 1.5,
  align: "top",
  render: () => <OpenOwnerPicker />,
}
