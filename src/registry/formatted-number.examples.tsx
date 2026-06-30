import {
  FormattedCurrency,
  FormattedNumber,
  FormattedPercentage,
} from "@/components/formatted-number"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-white tabular-nums">
    {children}
  </div>
)

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <span className="quebi-eyebrow text-quebi-fg-subtle">{label}</span>
    <span className="text-lg">{children}</span>
  </div>
)

export const formattedNumberExamples: ComponentExample[] = [
  {
    title: "Grouped number",
    description: "Locale-specific digit grouping. Compare en-US (comma) with de-DE (period).",
    render: () => (
      <Row>
        <Cell label="en-US">
          <FormattedNumber value={1234567.89} locale="en-US" />
        </Cell>
        <Cell label="de-DE">
          <FormattedNumber value={1234567.89} locale="de-DE" />
        </Cell>
      </Row>
    ),
  },
  {
    title: "Currency",
    description: "FormattedCurrency renders EUR with two decimals by default; override via currency.",
    render: () => (
      <Row>
        <Cell label="EUR · de-DE">
          <FormattedCurrency value={1499.5} locale="de-DE" />
        </Cell>
        <Cell label="USD · en-US">
          <FormattedCurrency value={1499.5} currency="USD" locale="en-US" />
        </Cell>
        <Cell label="GBP · en-GB">
          <FormattedCurrency value={1499.5} currency="GBP" locale="en-GB" />
        </Cell>
      </Row>
    ),
  },
  {
    title: "Percentage",
    render: () => (
      <Row>
        <Cell label="2 decimals">
          <FormattedPercentage value={0.1234} locale="en-US" />
        </Cell>
        <Cell label="0 decimals">
          <FormattedPercentage value={0.42} minimumFractionDigits={0} locale="en-US" />
        </Cell>
      </Row>
    ),
  },
  {
    title: "Custom options",
    description: "Pass any Intl.NumberFormat options directly.",
    render: () => (
      <Row>
        <Cell label="Compact">
          <FormattedNumber
            value={9_800_000}
            locale="en-US"
            options={{ notation: "compact" }}
          />
        </Cell>
        <Cell label="Unit">
          <FormattedNumber
            value={88}
            locale="en-US"
            options={{ style: "unit", unit: "kilometer-per-hour" }}
          />
        </Cell>
        <Cell label="Sign always">
          <FormattedNumber
            value={2.5}
            locale="en-US"
            options={{ signDisplay: "always", minimumFractionDigits: 1 }}
          />
        </Cell>
      </Row>
    ),
  },
  {
    title: "Children render prop",
    description: "Wrap the formatted string to apply quebi tokens such as the brand teal.",
    render: () => (
      <FormattedCurrency value={24990} locale="de-DE">
        {(formatted) => (
          <span className="text-2xl font-semibold text-quebi-brand tabular-nums">{formatted}</span>
        )}
      </FormattedCurrency>
    ),
  },
  {
    title: "Invalid value",
    description: "A non-numeric value falls back to an em dash placeholder.",
    render: () => (
      <span className="text-lg text-quebi-fg-muted">
        <FormattedNumber value="not-a-number" locale="en-US" />
      </span>
    ),
  },
]
