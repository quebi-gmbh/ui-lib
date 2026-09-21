import { FormattedNumber } from "@/components/formatted-number"
import { Sparkline } from "@/components/sparkline"
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/table"
import type { ComponentExample } from "./types"

const SIGNUPS = [12, 18, 14, 22, 26, 21, 30, 34, 29, 41, 38, 47]
const LATENCY = [180, 172, 190, 205, 240, 320, 280, 210, 195, 186, 178, 181]

const REGIONS = [
  { id: "eu-central-1", series: [41, 44, 39, 52, 58, 61, 57, 66, 71, 69, 78, 84] },
  { id: "us-east-1", series: [88, 84, 91, 79, 74, 70, 66, 61, 58, 52, 49, 44] },
  { id: "ap-south-1", series: [23, 25, 24, 26, 25, 27, 26, 28, 27, 29, 28, 30] },
]

/**
 * One domain for the whole column. Every row is then drawn on the same scale,
 * which is what makes the three glyphs comparable — self-normalising each row
 * would make the flat one look as dramatic as the rising one.
 */
const REGION_DOMAIN = { min: 0, max: 100 }

export const sparklineExamples: ComponentExample[] = [
  {
    title: "Three readings of one series",
    description:
      "`line` is the default. `area` fills under it for a series whose magnitude matters as much as its direction; `bars` is for a discrete series where the individual values are the point. All three are one `<svg>` element with one shape in it, computed during render.",
    render: () => (
      <div className="flex flex-col gap-4 text-quebi-brand-text">
        {(["line", "area", "bars"] as const).map((variant) => (
          <div key={variant} className="flex items-center gap-3">
            <span className="w-12 text-xs text-quebi-fg-subtle">{variant}</span>
            <Sparkline data={SIGNUPS} variant={variant} width={120} height={24} marker />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Inline, on a line of text",
    description:
      "Default size is 64×16 — about four characters wide and the height of body text. `children` renders beside the glyph, which is where the last value goes: a sparkline reports a trend and is entitled to be labelled, unlike Activity Pulse, which reports liveness and is not.",
    render: () => (
      <p className="max-w-md text-sm text-quebi-fg-muted">
        Signups are up over the quarter{" "}
        <Sparkline
          data={SIGNUPS}
          marker
          className="text-quebi-brand-text"
          aria-label="Signups over twelve weeks, rising"
        >
          <FormattedNumber value={SIGNUPS[SIGNUPS.length - 1]} />
        </Sparkline>{" "}
        while p95 latency held steady{" "}
        <Sparkline data={LATENCY} min={0} marker className="text-quebi-fg-muted" aria-label="p95 latency over twelve weeks, flat">
          <FormattedNumber value={LATENCY[LATENCY.length - 1]} options={{ style: "unit", unit: "millisecond" }} />
        </Sparkline>
        .
      </p>
    ),
  },
  {
    title: "A column of them, on one scale",
    description:
      "The reason `min` and `max` are props: passing the same pair to every row draws them all on one scale, so the third region reads as flat rather than as dramatic. Leaving them off lets each row normalise itself, which is the right answer only when the rows are not being compared.",
    render: () => (
      <Table aria-label="Traffic by region">
        <TableHeader>
          <TableColumn isRowHeader>Region</TableColumn>
          <TableColumn>Last 12 weeks</TableColumn>
          <TableColumn>Now</TableColumn>
        </TableHeader>
        <TableBody items={REGIONS}>
          {(region) => (
            <TableRow>
              <TableCell>
                <span className="font-mono text-xs">{region.id}</span>
              </TableCell>
              <TableCell>
                <Sparkline
                  data={region.series}
                  min={REGION_DOMAIN.min}
                  max={REGION_DOMAIN.max}
                  marker
                  className="text-quebi-brand-text"
                  aria-label={`${region.id}, last twelve weeks`}
                />
              </TableCell>
              <TableCell>
                <FormattedNumber value={region.series[region.series.length - 1]} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    ),
  },
]
