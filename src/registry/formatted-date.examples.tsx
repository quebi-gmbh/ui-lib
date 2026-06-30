import {
  DateTime,
  FormattedDate,
  RelativeTime,
  ShortDate,
} from "@/components/formatted-date"
import type { ComponentExample } from "./types"

const testDate = new Date("2024-03-15T14:30:00.000Z")

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 text-white">{children}</div>
)

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-quebi-fg-muted">{children}</span>
)

export const formattedDateExamples: ComponentExample[] = [
  {
    title: "Formats",
    description: "Absolute formatting via the fallback format style (German locale).",
    render: () => (
      <Stack>
        <div>
          <Label>Short: </Label>
          <FormattedDate date={testDate} format="short" locale="de" />
        </div>
        <div>
          <Label>Medium: </Label>
          <FormattedDate date={testDate} format="medium" locale="de" />
        </div>
        <div>
          <Label>Long: </Label>
          <FormattedDate date={testDate} format="long" locale="de" />
        </div>
        <div>
          <Label>Full: </Label>
          <FormattedDate date={testDate} format="full" locale="de" />
        </div>
      </Stack>
    ),
  },
  {
    title: "With time",
    description: "Combine dateStyle and timeStyle for a date plus a time.",
    render: () => (
      <Stack>
        <div>
          <Label>Date + short time: </Label>
          <FormattedDate date={testDate} dateStyle="medium" timeStyle="short" locale="de" />
        </div>
        <div>
          <Label>Date + long time: </Label>
          <FormattedDate date={testDate} dateStyle="long" timeStyle="long" locale="de" />
        </div>
      </Stack>
    ),
  },
  {
    title: "Relative time",
    description: "Human-friendly relative output via Intl.RelativeTimeFormat.",
    render: () => (
      <Stack>
        <div>
          <Label>5 minutes ago: </Label>
          <RelativeTime date={new Date(Date.now() - 5 * 60 * 1000)} locale="de" />
        </div>
        <div>
          <Label>2 hours from now: </Label>
          <RelativeTime date={new Date(Date.now() + 2 * 60 * 60 * 1000)} locale="de" />
        </div>
        <div>
          <Label>3 days ago: </Label>
          <RelativeTime date={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} locale="de" />
        </div>
      </Stack>
    ),
  },
  {
    title: "Locales",
    description: "The same date rendered across several locales.",
    render: () => (
      <Stack>
        <div>
          <Label>German: </Label>
          <FormattedDate date={testDate} dateStyle="long" locale="de" />
        </div>
        <div>
          <Label>English: </Label>
          <FormattedDate date={testDate} dateStyle="long" locale="en" />
        </div>
        <div>
          <Label>French: </Label>
          <FormattedDate date={testDate} dateStyle="long" locale="fr" />
        </div>
        <div>
          <Label>Spanish: </Label>
          <FormattedDate date={testDate} dateStyle="long" locale="es" />
        </div>
        <div>
          <Label>Italian: </Label>
          <FormattedDate date={testDate} dateStyle="long" locale="it" />
        </div>
      </Stack>
    ),
  },
  {
    title: "Convenience components",
    description: "ShortDate, DateTime and RelativeTime wrap the common patterns.",
    render: () => (
      <Stack>
        <div>
          <Label>ShortDate: </Label>
          <ShortDate date={testDate} locale="de" />
        </div>
        <div>
          <Label>DateTime: </Label>
          <DateTime date={testDate} locale="de" />
        </div>
        <div>
          <Label>RelativeTime: </Label>
          <RelativeTime date={new Date(Date.now() - 2 * 60 * 60 * 1000)} locale="de" />
        </div>
      </Stack>
    ),
  },
]
