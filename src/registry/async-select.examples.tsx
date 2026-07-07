import { useState } from "react"
import {
  AsyncSelect,
  type AsyncSelectLoadParams,
  type AsyncSelectOption,
} from "@/components/async-select"
import { Description, Label } from "@/components/field"
import type { ComponentExample } from "./types"

interface User extends AsyncSelectOption {
  id: string
  name: string
}

// A stand-in for a database of 200 users. In a real app this lives on the
// server and `load` hits an endpoint; here we filter + paginate in-memory
// behind an artificial delay to mimic network latency.
const ALL_USERS: User[] = Array.from({ length: 200 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `${["Ada", "Alan", "Grace", "Linus", "Margaret", "Dennis", "Barbara", "Ken"][i % 8]} ${
    ["Lovelace", "Turing", "Hopper", "Torvalds", "Hamilton", "Ritchie", "Liskov", "Thompson"][
      Math.floor(i / 8) % 8
    ]
  } #${i + 1}`,
}))

const PAGE_SIZE = 20

async function loadUsers({ search, cursor, signal }: AsyncSelectLoadParams) {
  // Simulate network latency; abort if a newer request supersedes this one.
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 400)
    signal.addEventListener("abort", () => {
      clearTimeout(t)
      reject(new DOMException("Aborted", "AbortError"))
    })
  })

  const q = search.trim().toLowerCase()
  const matches = q ? ALL_USERS.filter((u) => u.name.toLowerCase().includes(q)) : ALL_USERS

  const start = cursor ? Number(cursor) : 0
  const page = matches.slice(start, start + PAGE_SIZE)
  const nextStart = start + PAGE_SIZE

  return {
    items: page,
    cursor: nextStart < matches.length ? String(nextStart) : undefined,
  }
}

export const asyncSelectExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Focus the control to open the list; the first page loads from the source. Type to re-query live and scroll to load more.",
    render: () => (
      <div className="w-80">
        <AsyncSelect<User> aria-label="Owner" placeholder="Select an owner" load={loadUsers} />
      </div>
    ),
  },
  {
    title: "With label & description",
    description: "Pair the control with field primitives and seed an initial selection.",
    render: () => (
      <div className="w-80 space-y-1.5">
        <Label>Owner</Label>
        <AsyncSelect<User>
          aria-label="Owner"
          placeholder="Select an owner"
          load={loadUsers}
          defaultValue={ALL_USERS[0]}
        />
        <Description>Options are fetched on demand as you search.</Description>
      </div>
    ),
  },
  {
    title: "Controlled",
    description: "Drive selection from state; the live selection is shown below.",
    render: () => {
      function Demo() {
        const [selected, setSelected] = useState<User | null>(ALL_USERS[1])
        return (
          <div className="w-80 space-y-3">
            <AsyncSelect<User>
              aria-label="Owner"
              placeholder="Select an owner"
              load={loadUsers}
              value={selected}
              onChange={setSelected}
            />
            <p className="text-quebi-fg-muted text-sm">Selected: {selected?.name ?? "none"}</p>
          </div>
        )
      }
      return <Demo />
    },
  },
  {
    title: "Disabled",
    description: "The whole control can be disabled.",
    render: () => (
      <div className="w-80">
        <AsyncSelect<User>
          aria-label="Owner"
          placeholder="Select an owner"
          load={loadUsers}
          defaultValue={ALL_USERS[2]}
          isDisabled
        />
      </div>
    ),
  },
]
