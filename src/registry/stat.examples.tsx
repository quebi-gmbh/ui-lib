import { Sparkline } from "@/components/sparkline"
import { Stat, StatDelta, StatGroup } from "@/components/stat"
import type { ComponentExample } from "./types"

const EUR = { style: "currency", currency: "EUR", maximumFractionDigits: 0 } as const

const KPIS = [
  {
    label: "Signups",
    value: 1284,
    delta: 0.12,
    fallIsGood: false,
    series: [12, 18, 14, 22, 26, 30, 34, 41],
  },
  {
    label: "Active kiosks",
    value: 312,
    delta: 0.03,
    fallIsGood: false,
    series: [290, 294, 296, 301, 305, 309, 312],
  },
  {
    label: "Checkout errors",
    value: 17,
    delta: -0.4,
    fallIsGood: true,
    series: [41, 38, 30, 29, 22, 19, 17],
  },
]

export const statExamples: ComponentExample[] = [
  {
    title: "A stat row",
    frame: "none",
    description:
      "Label, value, delta and a sparkline, with a hairline between the stats. Below `sm` the row stacks and the lines go, because the gap already separates them. No card around any of it.",
    render: () => (
      <StatGroup aria-label="This week">
        {KPIS.map((k) => (
          <Stat
            key={k.label}
            label={k.label}
            value={k.value}
            delta={<StatDelta value={k.delta} invert={k.fallIsGood} />}
            trend={<Sparkline data={k.series} className="text-quebi-brand-text" />}
          />
        ))}
      </StatGroup>
    ),
  },
  {
    title: "When a rise is bad",
    description:
      "The arrow follows the sign; the colour follows whether that is good news. `invert` is for the numbers you want to fall — errors, latency, churn. A zero change is neutral either way.",
    render: () => (
      <StatGroup>
        <Stat label="Revenue" value={48200} delta={<StatDelta value={0.084} />} />
        <Stat label="p95 latency" value="212 ms" delta={<StatDelta value={0.21} invert />} />
        <Stat
          label="Churn"
          value={0.021}
          formatOptions={{ style: "percent", maximumFractionDigits: 1 }}
          delta={<StatDelta value={-0.004} invert />}
        />
        <Stat label="Seats" value={40} delta={<StatDelta value={0} />} />
      </StatGroup>
    ),
  },
  {
    title: "Formatting and captions",
    description:
      "A numeric `value` goes through `FormattedNumber` with `formatOptions`, so the locale is the provider's and not the runtime's. `StatDelta` is a signed percentage by default; its `options` make it an absolute change. `caption` says what the delta is measured against.",
    render: () => (
      <StatGroup>
        <Stat
          label="Monthly recurring revenue"
          value={18430}
          formatOptions={EUR}
          delta={<StatDelta value={1240} options={EUR} />}
          caption="vs last month"
        />
        <Stat label="Onboarding" value="3 of 5" caption="steps done" />
      </StatGroup>
    ),
  },
  {
    title: "Sizes",
    description:
      "`lg` for the one number a page is about, `md` (the default) for a row of them, `sm` for a sidebar or a panel header.",
    render: () => (
      <div className="flex flex-col gap-6">
        {(["lg", "md", "sm"] as const).map((size) => (
          <Stat
            key={size}
            size={size}
            label={`Size ${size}`}
            value={1284}
            delta={<StatDelta value={0.12} />}
          />
        ))}
      </div>
    ),
  },
]
