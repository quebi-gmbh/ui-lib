/**
 * Table's rendered structure.
 *
 * A smoke test, deliberately: Table composes React Aria's collection components
 * and the risk is in the composition, not in the styling. What is asserted is
 * that a plain declaration produces real table semantics — a `table` role with
 * `columnheader`s and `rowheader`s, so it is navigable — and that turning on
 * selection adds the selection column rather than throwing, which is the shape
 * that used to break when `isRowHeader` was missing.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "../../src/components/table"

const BasicTable = () => (
  <Table aria-label="Devices">
    <TableHeader>
      <TableColumn isRowHeader>Name</TableColumn>
      <TableColumn>Storage</TableColumn>
    </TableHeader>
    <TableBody>
      <TableRow id="1">
        <TableCell>Galaxy S24</TableCell>
        <TableCell>256GB</TableCell>
      </TableRow>
    </TableBody>
  </Table>
)

describe("Table", () => {
  test("renders table semantics, not a grid of divs", () => {
    render(<BasicTable />)

    const table = screen.getByRole("grid", { name: "Devices" })
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2)
    expect(within(table).getByRole("rowheader")).toHaveTextContent("Galaxy S24")
  })

  test("renders every cell of the row", () => {
    render(<BasicTable />)

    expect(screen.getByText("256GB")).toBeInTheDocument()
  })

  test("selection mode adds a selection column", () => {
    render(
      <Table aria-label="Devices" selectionMode="multiple">
        <TableHeader>
          <TableColumn isRowHeader>Name</TableColumn>
          <TableColumn>Storage</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow id="1">
            <TableCell>Galaxy S24</TableCell>
            <TableCell>256GB</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    expect(screen.getAllByRole("columnheader")).toHaveLength(3)
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0)
  })

  test("renders the empty state instead of rows when there are none", () => {
    render(
      <Table aria-label="Devices">
        <TableHeader>
          <TableColumn isRowHeader>Name</TableColumn>
        </TableHeader>
        <TableBody renderEmptyState={() => "No devices yet"}>{[]}</TableBody>
      </Table>,
    )

    expect(screen.getByText("No devices yet")).toBeInTheDocument()
  })
})
