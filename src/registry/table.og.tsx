import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/table"
import type { OgScene } from "./types"

const PLANS = [
  { id: "s", name: "Starter", data: "5 GB", monthly: "€9" },
  { id: "p", name: "Pro", data: "50 GB", monthly: "€29" },
  { id: "e", name: "Enterprise", data: "Unlimited", monthly: "€99" },
]

/** Four columns, three rows — a table small enough to read as a table. */
export const tableOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <div className="w-104">
      <Table aria-label="Plans">
        <TableHeader>
          <TableColumn isRowHeader>Plan</TableColumn>
          <TableColumn>Data</TableColumn>
          <TableColumn>Monthly</TableColumn>
        </TableHeader>
        <TableBody items={PLANS}>
          {(plan) => (
            <TableRow>
              <TableCell>{plan.name}</TableCell>
              <TableCell>{plan.data}</TableCell>
              <TableCell>{plan.monthly}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  ),
}
