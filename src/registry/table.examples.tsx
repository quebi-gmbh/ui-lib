import { useState } from "react"
import type { Selection, SortDescriptor } from "react-aria-components"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/table"
import type { ComponentExample } from "./types"

const plans = [
  { id: 1, name: "Essentials 20", data: "20 GB 4G", contract: "24 months", monthly: "$19.00" },
  { id: 2, name: "Flex 50", data: "50 GB 5G", contract: "24 months", monthly: "$29.00" },
  { id: 3, name: "Unlimited Pro", data: "Unlimited 5G+", contract: "No contract", monthly: "$49.00" },
  { id: 4, name: "Family Share 100", data: "100 GB shared", contract: "24 months", monthly: "$69.00" },
]

export const tableExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A basic table with a row-header column.",
    render: () => (
      <Table aria-label="Plans">
        <TableHeader>
          <TableColumn isRowHeader>Plan</TableColumn>
          <TableColumn>Data</TableColumn>
          <TableColumn>Contract</TableColumn>
          <TableColumn>Monthly</TableColumn>
        </TableHeader>
        <TableBody items={plans}>
          {(p) => (
            <TableRow>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.data}</TableCell>
              <TableCell>{p.contract}</TableCell>
              <TableCell>{p.monthly}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    ),
  },
  {
    title: "Selectable",
    description: "Multiple selection adds a checkbox column in the header and each row.",
    render: () => {
      const Selectable = () => {
        const [selected, setSelected] = useState<Selection>(new Set([2]))
        return (
          <Table
            aria-label="Plans"
            selectionMode="multiple"
            selectedKeys={selected}
            onSelectionChange={setSelected}
          >
            <TableHeader>
              <TableColumn isRowHeader>Plan</TableColumn>
              <TableColumn>Data</TableColumn>
              <TableColumn>Contract</TableColumn>
              <TableColumn>Monthly</TableColumn>
            </TableHeader>
            <TableBody items={plans}>
              {(p) => (
                <TableRow>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.data}</TableCell>
                  <TableCell>{p.contract}</TableCell>
                  <TableCell>{p.monthly}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )
      }
      return <Selectable />
    },
  },
  {
    title: "Sortable",
    description: "Sortable columns show a chevron and reorder rows on click.",
    render: () => {
      const Sortable = () => {
        const [descriptor, setDescriptor] = useState<SortDescriptor>({
          column: "name",
          direction: "ascending",
        })
        const sorted = [...plans].sort((a, b) => {
          const col = descriptor.column as "name" | "data" | "contract" | "monthly"
          const cmp = a[col].localeCompare(b[col])
          return descriptor.direction === "descending" ? -cmp : cmp
        })
        return (
          <Table
            aria-label="Plans"
            sortDescriptor={descriptor}
            onSortChange={setDescriptor}
          >
            <TableHeader>
              <TableColumn id="name" isRowHeader allowsSorting>
                Plan
              </TableColumn>
              <TableColumn id="data" allowsSorting>
                Data
              </TableColumn>
              <TableColumn id="contract" allowsSorting>
                Contract
              </TableColumn>
              <TableColumn id="monthly" allowsSorting>
                Monthly
              </TableColumn>
            </TableHeader>
            <TableBody items={sorted}>
              {(p) => (
                <TableRow>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.data}</TableCell>
                  <TableCell>{p.contract}</TableCell>
                  <TableCell>{p.monthly}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )
      }
      return <Sortable />
    },
  },
  {
    title: "Striped & grid",
    description: "Zebra striping plus vertical grid lines for dense data.",
    render: () => (
      <Table aria-label="Plans" striped grid>
        <TableHeader>
          <TableColumn isRowHeader>Plan</TableColumn>
          <TableColumn>Data</TableColumn>
          <TableColumn>Contract</TableColumn>
          <TableColumn>Monthly</TableColumn>
        </TableHeader>
        <TableBody items={plans}>
          {(p) => (
            <TableRow>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.data}</TableCell>
              <TableCell>{p.contract}</TableCell>
              <TableCell>{p.monthly}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    ),
  },
  {
    title: "Empty",
    description: "The default empty state when there are no rows.",
    render: () => (
      <Table aria-label="Plans">
        <TableHeader>
          <TableColumn isRowHeader>Plan</TableColumn>
          <TableColumn>Data</TableColumn>
          <TableColumn>Contract</TableColumn>
          <TableColumn>Monthly</TableColumn>
        </TableHeader>
        <TableBody items={[]}>{() => <TableRow />}</TableBody>
      </Table>
    ),
  },
]
