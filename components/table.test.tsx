import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "./table"

test("renders a basic table with isRowHeader", () => {
  render(
    <Table aria-label="Test table">
      <TableHeader>
        <TableColumn isRowHeader>Name</TableColumn>
        <TableColumn>Value</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Item</TableCell>
          <TableCell>123</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )
  expect(screen.getByText("Name")).toBeInTheDocument()
  expect(screen.getByText("Value")).toBeInTheDocument()
  expect(screen.getByText("Item")).toBeInTheDocument()
})

test("renders table with selectionMode without isRowHeader error", () => {
  render(
    <Table aria-label="Selection table" selectionMode="multiple">
      <TableHeader>
        <TableColumn isRowHeader>Name</TableColumn>
        <TableColumn>Status</TableColumn>
      </TableHeader>
      <TableBody>
        <TableRow id="1">
          <TableCell>Item 1</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  )
  expect(screen.getByText("Name")).toBeInTheDocument()
  expect(screen.getByText("Item 1")).toBeInTheDocument()
})
