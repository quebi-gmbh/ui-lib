import { AsyncSelect, type AsyncSelectOption } from "@/components/async-select"
import { useFocusOnMount } from "./og-scene"
import type { OgScene } from "./types"

interface Owner extends AsyncSelectOption {
  id: string
  name: string
}

const OWNERS: Owner[] = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
  { id: "alan", name: "Alan Turing" },
  { id: "margaret", name: "Margaret Hamilton" },
]

/**
 * One page, already resolved. The gallery example fakes 400ms of latency to
 * show the spinner; a still cannot photograph latency, so the scene pays none —
 * and a promise that has already settled is also the only version of this that
 * produces the same picture twice.
 */
const loadOwners = async () => ({ items: OWNERS })

const OpenOwnerPicker = () => {
  const ref = useFocusOnMount<HTMLDivElement>()

  return (
    <div ref={ref} className="w-80">
      <AsyncSelect<Owner>
        aria-label="Owner"
        placeholder="Select an owner"
        load={loadOwners}
      />
    </div>
  )
}

export const asyncSelectOgScene: OgScene = {
  scale: 1.25,
  render: () => <OpenOwnerPicker />,
}
