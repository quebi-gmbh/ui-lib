/**
 * A counted facet keeps its domain.
 *
 * `tests/data-table-model.test.ts` covers `facetedOptions` on its own — this is
 * the seam above it: that DataTable hands the panel the domain read from the
 * *unfiltered* rows rather than the faceted map alone, so a choice another
 * column has zeroed is still on the list, and still removable when it is the
 * one applied.
 */
import { describe, expect, test } from "bun:test"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataTable } from "../../src/components/data-table"
import type { DataTableColumn } from "../../src/lib/data-table"

interface Kiosk {
  id: number
  reference: string
  status: string
  room: string
}

describe("DataTable facets", () => {
  /**
   * Two enum columns over rows where one choice of the first empties the
   * second — the shape the whole faceted-domain argument is about.
   */
  const KIOSKS = [
    { id: 1, reference: "K-2001", status: "live", room: "Atrium" },
    { id: 2, reference: "K-2002", status: "live", room: "Atrium" },
    { id: 3, reference: "K-2003", status: "draft", room: "Foyer" },
    { id: 4, reference: "K-2004", status: "offline", room: "Foyer" },
  ] satisfies Kiosk[]

  const facetedColumns: DataTableColumn<Kiosk>[] = [
    { id: "reference", header: "Reference", accessorKey: "reference" },
    { id: "status", header: "Status", accessorKey: "status", filterVariant: "enum" },
    { id: "room", header: "Room", accessorKey: "room", filterVariant: "enum" },
  ]

  test("a choice another filter has zeroed is still listed, disabled at 0", async () => {
    render(
      <DataTable<Kiosk>
        aria-label="Faceted kiosks"
        columns={facetedColumns}
        data={KIOSKS}
        getRowId={(kiosk) => String(kiosk.id)}
        enablePagination={false}
        columnFilters={[{ column: "room", value: ["Atrium"] }]}
        onColumnFiltersChange={() => undefined}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /Filter Status/ }))
    const values = await screen.findByRole("group", { name: "Status values" })

    // The domain is every status in the data, not the two Atrium happens to
    // leave. The order is the domain's own, so nothing moved.
    expect(
      within(values)
        .getAllByRole("checkbox")
        .map((box) => box.closest("label")?.textContent),
    ).toEqual(["draft0", "live2", "offline0"])

    // Seen, and seen to be unavailable: picking it could only empty the table.
    expect(within(values).getByRole("checkbox", { name: /draft/ })).toBeDisabled()
    expect(within(values).getByRole("checkbox", { name: /offline/ })).toBeDisabled()
    expect(within(values).getByRole("checkbox", { name: /live/ })).not.toBeDisabled()
  })

  test("the value already applied stays checkable even when it counts zero", async () => {
    render(
      <DataTable<Kiosk>
        aria-label="Faceted kiosks"
        columns={facetedColumns}
        data={KIOSKS}
        getRowId={(kiosk) => String(kiosk.id)}
        enablePagination={false}
        columnFilters={[
          { column: "room", value: ["Foyer"] },
          { column: "status", value: ["live"] },
        ]}
        onColumnFiltersChange={() => undefined}
      />,
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: /Filter Status/ }))
    const values = await screen.findByRole("group", { name: "Status values" })
    const live = within(values).getByRole("checkbox", { name: /live/ })
    // No Foyer kiosk is live, so the count is 0 — and disabling it here would
    // make the filter unremovable from the only panel that removes it.
    expect(live).not.toBeDisabled()
    expect((live as HTMLInputElement).checked).toBe(true)
  })
})
