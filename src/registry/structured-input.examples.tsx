import { useState } from "react"
import {
  bic,
  cardExpiry,
  cardNumber,
  dateDMY,
  digits,
  formatValue,
  iban,
  isValidStructured,
  licenseKey,
  macAddress,
  routingNumber,
  type StructuredFormat,
  StructuredInput,
  sortCode,
  ssn,
  time24,
} from "@/components/structured-input"
import type { ComponentExample } from "./types"

/** A caption above a field, and the field. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-quebi-fg-muted">{label}</span>
      {children}
    </div>
  )
}

export const structuredInputExamples: ComponentExample[] = [
  {
    title: "IBAN",
    description:
      "A German IBAN: DE is fixed, the check digits and the eighteen-digit BBAN follow in the groups of four it is printed in. Paste one with its spaces and they are stripped; change a digit and the mod-97 check turns the field red.",
    render: () => {
      const IbanExample = () => {
        const [value, setValue] = useState("DE89370400440532013000")
        const format = iban("DE")
        return (
          <div className="flex flex-col items-start gap-3">
            <StructuredInput
              format={format}
              size="sm"
              value={value}
              onChange={setValue}
              aria-label="IBAN"
            />
            <p className="text-sm text-quebi-fg-muted">
              {isValidStructured(format, value)
                ? `Valid: ${formatValue(format, value)}`
                : "Enter a German IBAN"}
            </p>
          </div>
        )
      }
      return <IbanExample />
    },
  },
  {
    title: "IBAN by country",
    description:
      "The country decides the length and the shape of what follows the check digits — letters for the bank code in GB and NL, letters and digits in CH.",
    render: () => (
      <div className="flex flex-col gap-4">
        {(["AT", "CH", "GB", "NL"] as const).map((country) => (
          <Row key={country} label={country}>
            <StructuredInput format={iban(country)} size="sm" aria-label={`IBAN (${country})`} />
          </Row>
        ))}
      </div>
    ),
  },
  {
    title: "BIC",
    description:
      "Bank, country, location, and an optional three-character branch. Eight characters are a complete BIC; the branch makes it eleven. Letters are upper-cased as you type.",
    render: () => <StructuredInput format={bic} defaultValue="DEUTDEFF" aria-label="BIC" />,
  },
  {
    title: "Nine digits",
    description:
      "digits(9) — three groups of three, for any nine-digit reference. digits(length, groupSize) makes the rest.",
    render: () => (
      <div className="flex flex-col gap-4">
        <Row label="digits(9)">
          <StructuredInput format={digits(9)} aria-label="Reference number" />
        </Row>
        <Row label="digits(9, 9)">
          <StructuredInput format={digits(9, 9)} aria-label="Reference number, ungrouped" />
        </Row>
      </div>
    ),
  },
  {
    title: "Nine digits with a check",
    description:
      "A US routing number and a Social Security number are both nine digits and neither is just nine digits: the first carries a 3-7-1 checksum, the second has ranges that are never issued.",
    render: () => (
      <div className="flex flex-col gap-4">
        <Row label="Routing number">
          <StructuredInput
            format={routingNumber}
            defaultValue="021000021"
            aria-label="Routing number"
          />
        </Row>
        <Row label="Social Security number">
          <StructuredInput format={ssn} aria-label="Social Security number" />
        </Row>
      </div>
    ),
  },
  {
    title: "Payment card",
    description:
      "A sixteen-digit number checked with Luhn, and an expiry whose placeholder says which slots are the month.",
    render: () => (
      <div className="flex flex-col gap-4">
        <Row label="Card number">
          <StructuredInput format={cardNumber} size="sm" aria-label="Card number" />
        </Row>
        <Row label="Expiry">
          <StructuredInput format={cardExpiry} size="sm" aria-label="Expiry date" />
        </Row>
      </div>
    ),
  },
  {
    title: "More formats",
    description:
      "A UK sort code, a MAC address (hex), a licence key (letters or digits), a day-first date and a 24-hour time — the last two checked against the calendar and the clock.",
    render: () => (
      <div className="flex flex-col gap-4">
        {(
          [
            ["Sort code", sortCode],
            ["MAC address", macAddress],
            ["Licence key", licenseKey],
            ["Date", dateDMY],
            ["Time", time24],
          ] as const
        ).map(([label, format]) => (
          <Row key={label} label={label}>
            <StructuredInput format={format} size="xs" aria-label={label} />
          </Row>
        ))}
      </div>
    ),
  },
  {
    title: "Your own format",
    description:
      "A format is data: one token string per group — 9 a digit, A a letter, * either, H hex, anything else that literal character. This is a vehicle registration of the shape AB12 CDE.",
    render: () => {
      const plate: StructuredFormat = {
        groups: ["AA99", "AAA"],
        separator: "gap",
        placeholder: "AB12CDE",
      }
      return <StructuredInput format={plate} aria-label="Registration number" />
    },
  },
  {
    title: "Invalid and disabled",
    description:
      "A complete value that fails its check is invalid by itself; isInvalid forces it either way.",
    render: () => (
      <div className="flex flex-col gap-4">
        <Row label="Bad checksum">
          <StructuredInput
            format={routingNumber}
            defaultValue="021000022"
            aria-label="Routing number"
          />
        </Row>
        <Row label="Disabled">
          <StructuredInput format={bic} defaultValue="DEUTDEFF500" disabled aria-label="BIC" />
        </Row>
      </div>
    ),
  },
]
