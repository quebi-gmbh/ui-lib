import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date"
import { useState } from "react"
import { FormattedDate } from "@/components/formatted-date"
import { WeekPicker, WeekPickerField, type WeekRange } from "@/components/week-picker"
import type { ComponentExample } from "./types"

const ControlledWeek = () => {
  const [week, setWeek] = useState<WeekRange | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <WeekPicker aria-label="Delivery week" value={week} onChange={setWeek} />
      <p className="text-quebi-fg-muted text-sm tabular-nums">
        {week ? (
          <>
            Selected:{" "}
            <FormattedDate date={week.start.toDate("UTC")} dateStyle="medium" timeZone="UTC" /> —{" "}
            <FormattedDate date={week.end.toDate("UTC")} dateStyle="medium" timeZone="UTC" />
          </>
        ) : (
          "Pick a week — the whole row is the target."
        )}
      </p>
    </div>
  )
}

/**
 * The same month, laid out three ways. The site is drawn in de-DE, so the first
 * grid starts on Monday; the other two are told otherwise.
 */
const WeekStarts = () => (
  <div className="flex flex-wrap items-start gap-6">
    {[
      { caption: "The locale's own first day", props: {} },
      { caption: 'firstDayOfWeek="sun"', props: { firstDayOfWeek: "sun" } as const },
      { caption: 'locale="en-US"', props: { locale: "en-US" } as const },
    ].map((variant) => (
      <div key={variant.caption} className="flex flex-col gap-2">
        <p className="font-semibold text-quebi-fg-muted text-xs uppercase tracking-[0.08em]">
          {variant.caption}
        </p>
        <WeekPicker aria-label={variant.caption} hideWeekNumbers {...variant.props} />
      </div>
    ))}
  </div>
)

export const weekPickerExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Hover lights the whole week; one click selects it. The gutter numbers the weeks ISO-8601, and the current week is ringed in brand teal.",
    render: () => <WeekPicker aria-label="Week" />,
  },
  {
    title: "Preselected",
    description:
      "defaultValue is snapped to the locale's week, so any day inside the week you mean will do.",
    render: () => (
      <WeekPicker
        aria-label="Week"
        defaultValue={{
          start: new CalendarDate(2026, 9, 16),
          end: new CalendarDate(2026, 9, 16),
        }}
      />
    ),
  },
  {
    title: "Without week numbers",
    description: "hideWeekNumbers drops the gutter when the dates are the point.",
    render: () => <WeekPicker aria-label="Week" hideWeekNumbers />,
  },
  {
    title: "Bounded",
    description:
      "minValue and maxValue gate which weeks are selectable — a week is offered if any of its days is in range — and never truncate the week you get back.",
    render: () => (
      <WeekPicker
        aria-label="Sprint week"
        minValue={today(getLocalTimeZone())}
        maxValue={today(getLocalTimeZone()).add({ weeks: 4 })}
      />
    ),
  },
  {
    title: "Where a week starts",
    description:
      "firstDayOfWeek and locale are the two things that decide which seven days a row is, which is why they are props and not formatting: a grid that disagrees with whatever reads its value offers a week nobody meant. Override one in a picker and override it in the view above it too \u2014 Calendar Toolbar passes Week View's through for exactly that reason.",
    render: () => <WeekStarts />,
  },
  {
    title: "Controlled",
    description: "The value is always a whole week, start to end.",
    render: () => <ControlledWeek />,
  },
  {
    title: "Popover field",
    description:
      "The trigger reads the week number next to the dates it means, since a week number alone is ambiguous across locales.",
    render: () => <WeekPickerField aria-label="Week" />,
  },
  {
    title: "Disabled",
    description: "The whole picker dims and nothing takes focus.",
    render: () => <WeekPicker aria-label="Week" isDisabled />,
  },
]
