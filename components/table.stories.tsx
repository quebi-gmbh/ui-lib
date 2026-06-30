import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"
import { Button } from "./button"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "./table"

/**
 * Verbatim port of the Tables & data section from cellestial-ds/showcase.html.
 *
 * Spec `.tbl`:
 *   - 14px base, surface bg, rounded-md wrapper, border ink-100
 *   - th: ink-50 bg, ink-500, 12px uppercase, 0.08em tracking, semibold
 *   - td: border-b ink-100, py 12 / px 14
 *   - tr:hover: bg ink-50
 *   - td.num: tabular-nums, font-mono
 */

const meta = {
  title: "Cellestial DS/Components/Tables",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

/* Inline badges matching the spec .badge variants. */
const Badge = ({
  variant = "neutral",
  children,
}: {
  variant?: "neutral" | "success" | "warning"
  children: ReactNode
}) => {
  const tone = {
    neutral: "bg-ink-100 text-ink-700",
    success: "bg-success-100 text-success-600",
    warning: "bg-warning-100 text-warning-600",
  }[variant]
  const dot = variant !== "neutral"
  return (
    <span
      className={`inline-flex items-center gap-[6px] text-[12px] font-semibold rounded-pill px-2 py-[3px] ${tone}`}
    >
      {dot ? (
        <span
          className={`w-[6px] h-[6px] rounded-full ${variant === "success" ? "bg-success-500" : "bg-warning-500"}`}
        />
      ) : null}
      {children}
    </span>
  )
}

const PlanName = ({ name, sku }: { name: string; sku: string }) => (
  <>
    <strong className="text-ink-900">{name}</strong>
    <div className="text-ink-500 text-[12px]">{sku}</div>
  </>
)

const rows = [
  {
    key: "ess",
    name: "Essentials 20",
    sku: "ESS-20-24",
    data: "20 GB 4G",
    contract: "24 months",
    monthly: "£ 19.00",
    upfront: "£   0.00",
    status: <Badge variant="success">Live</Badge>,
  },
  {
    key: "flx",
    name: "Flex 50",
    sku: "FLX-50-24",
    data: "50 GB 5G",
    contract: "24 months",
    monthly: "£ 29.00",
    upfront: "£   0.00",
    status: <Badge variant="success">Live</Badge>,
  },
  {
    key: "ult",
    name: "Unlimited Pro",
    sku: "ULT-∞-NC",
    data: "Unlimited 5G+",
    contract: "No contract",
    monthly: "£ 49.00",
    upfront: "£   0.00",
    status: <Badge variant="warning">Draft</Badge>,
  },
  {
    key: "fam",
    name: "Family Share 100",
    sku: "FAM-100-24",
    data: "100 GB shared",
    contract: "24 months",
    monthly: "£ 69.00",
    upfront: "£  29.00",
    status: <Badge>Archived</Badge>,
  },
]

export const Plans: Story = {
  render: () => (
    <Table aria-label="Plans">
      <TableHeader>
        <TableColumn isRowHeader>Plan</TableColumn>
        <TableColumn>Data</TableColumn>
        <TableColumn>Contract</TableColumn>
        <TableColumn className="text-end!">Monthly</TableColumn>
        <TableColumn className="text-end!">Upfront</TableColumn>
        <TableColumn>Status</TableColumn>
        <TableColumn> </TableColumn>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.key}>
            <TableCell>
              <PlanName name={r.name} sku={r.sku} />
            </TableCell>
            <TableCell>{r.data}</TableCell>
            <TableCell>{r.contract}</TableCell>
            <TableCell className="text-end font-mono tabular-nums">{r.monthly}</TableCell>
            <TableCell className="text-end font-mono tabular-nums">{r.upfront}</TableCell>
            <TableCell>{r.status}</TableCell>
            <TableCell>
              <Button intent="ghost" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
