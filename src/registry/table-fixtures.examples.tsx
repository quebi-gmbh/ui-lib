/**
 * Shared demo data for the table-family galleries.
 *
 * Not a gallery entry of its own — it exports no `ComponentExample[]`. It lives
 * under the `*.examples.tsx` name because it is example code and is scoped as
 * such by the lint config, and because splitting the four example files without
 * it would mean four copies of the same three hundred orders.
 */
import { Badge } from "@/components/badge"
import { FormattedCurrency, FormattedNumber } from "@/components/formatted-number"

export interface Order {
  id: number
  reference: string
  customer: string
  country: string
  status: "Paid" | "Pending" | "Shipped" | "Cancelled" | "Refunded"
  channel: "Web" | "Retail" | "Partner"
  amount: number
  tax: number
  items: number
  date: string
  isPriority: boolean
  note: string
}

export const STATUSES = ["Paid", "Pending", "Shipped", "Cancelled", "Refunded"] as const
export const CHANNELS = ["Web", "Retail", "Partner"] as const
export const COUNTRIES = [
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Austria",
  "Belgium",
  "Poland",
  "Sweden",
  "Denmark",
]

const CUSTOMERS = Array.from(
  { length: 40 },
  (_, i) =>
    `${["Nova", "Apex", "Vertex", "Lumen", "Orbit", "Delta", "Pixel", "Quanta"][i % 8]} ${
      ["GmbH", "AG", "SE", "Ltd", "SARL", "BV"][i % 6]
    } ${i + 1}`,
)

/** Deterministic, so the prerendered HTML and the hydrated page agree. */
export function makeOrders(count: number): Order[] {
  return Array.from({ length: count }, (_, i) => {
    const amount = Math.round(((i * 37) % 900) + 50 + (i % 7) * 3.5)
    return {
      id: i + 1,
      reference: `ORD-${String(4000 + i)}`,
      customer: CUSTOMERS[i % CUSTOMERS.length],
      country: COUNTRIES[i % COUNTRIES.length],
      status: STATUSES[i % STATUSES.length],
      channel: CHANNELS[i % CHANNELS.length],
      amount,
      tax: Math.round(amount * 0.19 * 100) / 100,
      items: (i % 6) + 1,
      date: new Date(Date.UTC(2026, i % 12, ((i * 7) % 27) + 1)).toISOString().slice(0, 10),
      isPriority: i % 11 === 0,
      // A few rows have no note at all, which is what the empty-value
      // placeholder on that column exists to render.
      note: i % 5 === 0 ? "" : `Handled by desk ${(i % 4) + 1}`,
    }
  })
}

export const ORDERS = makeOrders(300)
export const SMALL_ORDERS = makeOrders(24)

const statusIntent = {
  Paid: "success",
  Pending: "warning",
  Shipped: "info",
  Cancelled: "neutral",
  Refunded: "danger",
} as const

export function StatusBadge({ status }: { status: Order["status"] }) {
  return <Badge intent={statusIntent[status]}>{status}</Badge>
}

export function Money({ value }: { value: number }) {
  return <FormattedCurrency value={value} />
}

export function Count({ value }: { value: number }) {
  return <FormattedNumber value={value} />
}

/** The one place a demo "server" and a demo client agree on a comparator. */
export function compareOrders(a: Order, b: Order, column: string, desc: boolean): number {
  const av = a[column as keyof Order]
  const bv = b[column as keyof Order]
  const cmp =
    typeof av === "number" && typeof bv === "number"
      ? av - bv
      : String(av).localeCompare(String(bv), "en")
  return desc ? -cmp : cmp
}
