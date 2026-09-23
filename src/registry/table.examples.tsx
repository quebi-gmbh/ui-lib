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
import { Card, CardContent, CardHeader } from "@/components/card"
import { Heading } from "@/components/heading"
import type { ComponentExample } from "./types"

/** The same four columns every example here draws. */
const PlanRows = () => (
  <>
    <TableHeader>
      <TableColumn isRowHeader>Plan</TableColumn>
      <TableColumn>Data</TableColumn>
      <TableColumn>Contract</TableColumn>
      {/* A price is end-aligned, so the digits line up by place value. */}
      <TableColumn className="text-end">Monthly</TableColumn>
    </TableHeader>
    <TableBody items={plans}>
      {(p) => (
        <TableRow>
          <TableCell>{p.name}</TableCell>
          <TableCell>{p.data}</TableCell>
          <TableCell>{p.contract}</TableCell>
          <TableCell className="text-end tabular-nums">{p.monthly}</TableCell>
        </TableRow>
      )}
    </TableBody>
  </>
)

const plans = [
  { id: 1, name: "Essentials 20", data: "20 GB 4G", contract: "24 months", monthly: "$19.00" },
  { id: 2, name: "Flex 50", data: "50 GB 5G", contract: "24 months", monthly: "$29.00" },
  { id: 3, name: "Unlimited Pro", data: "Unlimited 5G+", contract: "No contract", monthly: "$49.00" },
  { id: 4, name: "Family Share 100", data: "100 GB shared", contract: "24 months", monthly: "$69.00" },
]

export const tableExamples: ComponentExample[] = [
  {
    title: "Default",
    frame: "none",
    description: "A basic table with a row-header column.",
    render: () => (
      <Table aria-label="Plans">
        <TableHeader>
          <TableColumn isRowHeader>Plan</TableColumn>
          <TableColumn>Data</TableColumn>
          <TableColumn>Contract</TableColumn>
          <TableColumn className="text-end">Monthly</TableColumn>
        </TableHeader>
        <TableBody items={plans}>
          {(p) => (
            <TableRow>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.data}</TableCell>
              <TableCell>{p.contract}</TableCell>
              <TableCell className="text-end tabular-nums">{p.monthly}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    ),
  },
  {
    title: "Plain",
    frame: "none",
    description:
      "The plain variant drops the panel: a header rule and row dividers on whatever is behind the table. The right table for a page section — the heading above it already says where the section starts, and a border round the rows would say it twice.",
    render: () => (
      <section className="flex flex-col gap-4">
        <Heading level={3}>Plans</Heading>
        <Table aria-label="Plans" variant="plain">
          <PlanRows />
        </Table>
      </section>
    ),
  },
  {
    title: "Plain, bleeding to the edge",
    frame: "none",
    description:
      "Bleed takes the padding off the first and last columns, so Plan lines up with the heading and the end-aligned prices with the right edge of the text column. Read down the left edge of this example and there is one line, not two.",
    render: () => (
      <section className="flex flex-col gap-2">
        <Heading level={3}>Plans</Heading>
        <p className="text-sm text-quebi-fg-muted">Prices include VAT. Cancel monthly plans anytime.</p>
        <Table aria-label="Plans" variant="plain" bleed className="mt-2">
          <PlanRows />
        </Table>
      </section>
    ),
  },
  {
    title: "Plain, in a dashboard widget",
    frame: "none",
    description:
      "The one place a table does belong in a card: a widget with its own title, beside widgets that are not tables. The card is the surface, so the table is plain and bleeds — a surface table here would be a box inside a box, and its padding would put the first column one gutter to the right of the card's title.",
    render: () => (
      <Card className="max-w-xl">
        <CardHeader title="Top plans" description="By new contracts this month." />
        <CardContent>
          <Table aria-label="Top plans" variant="plain" bleed>
            <PlanRows />
          </Table>
        </CardContent>
      </Card>
    ),
  },
  {
    title: "Selectable",
    frame: "none",
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
              <TableColumn className="text-end">Monthly</TableColumn>
            </TableHeader>
            <TableBody items={plans}>
              {(p) => (
                <TableRow>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.data}</TableCell>
                  <TableCell>{p.contract}</TableCell>
                  <TableCell className="text-end tabular-nums">{p.monthly}</TableCell>
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
    frame: "none",
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
              <TableColumn id="monthly" allowsSorting className="text-end">
                Monthly
              </TableColumn>
            </TableHeader>
            <TableBody items={sorted}>
              {(p) => (
                <TableRow>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.data}</TableCell>
                  <TableCell>{p.contract}</TableCell>
                  <TableCell className="text-end tabular-nums">{p.monthly}</TableCell>
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
    frame: "none",
    description: "Zebra striping plus vertical grid lines for dense data.",
    render: () => (
      <Table aria-label="Plans" striped grid>
        <TableHeader>
          <TableColumn isRowHeader>Plan</TableColumn>
          <TableColumn>Data</TableColumn>
          <TableColumn>Contract</TableColumn>
          <TableColumn className="text-end">Monthly</TableColumn>
        </TableHeader>
        <TableBody items={plans}>
          {(p) => (
            <TableRow>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.data}</TableCell>
              <TableCell>{p.contract}</TableCell>
              <TableCell className="text-end tabular-nums">{p.monthly}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    ),
  },
  {
    title: "Empty",
    frame: "none",
    description: "The default empty state when there are no rows.",
    render: () => (
      <Table aria-label="Plans">
        <TableHeader>
          <TableColumn isRowHeader>Plan</TableColumn>
          <TableColumn>Data</TableColumn>
          <TableColumn>Contract</TableColumn>
          <TableColumn className="text-end">Monthly</TableColumn>
        </TableHeader>
        <TableBody items={[]}>{() => <TableRow />}</TableBody>
      </Table>
    ),
  },
]
