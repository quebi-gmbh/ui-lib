import { useState } from "react"
import {
  TableColumnChooser,
  TableDensityToggle,
  TableSearch,
  TableToolbar,
} from "@/components/table-controls"
import type { DataTableDensity } from "@/lib/data-table"
import type { OgScene } from "./types"

const COLUMNS = [
  { id: "reference", label: "Reference", isVisible: true, canHide: false },
  { id: "customer", label: "Customer", isVisible: true, canHide: true },
  { id: "status", label: "Status", isVisible: true, canHide: true },
  { id: "amount", label: "Amount", isVisible: true, canHide: true },
]

/**
 * The bar above every table in the family, with nothing underneath it — which
 * is exactly how this component ships. Search carries a value, because an empty
 * field and a disabled one look the same at this size.
 */
const Toolbar = () => {
  const [search, setSearch] = useState("Vertex")
  const [density, setDensity] = useState<DataTableDensity>("normal")

  return (
    <div className="w-176">
      <TableToolbar
        actions={
          <>
            <TableDensityToggle value={density} onChange={setDensity} />
            <TableColumnChooser columns={COLUMNS} onChange={() => {}} onReset={() => {}} />
          </>
        }
      >
        <TableSearch value={search} onChange={setSearch} placeholder="Search all columns…" />
      </TableToolbar>
    </div>
  )
}

export const tableControlsOgScene: OgScene = {
  scale: 1.5,
  render: () => <Toolbar />,
}
