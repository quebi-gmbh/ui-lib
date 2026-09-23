import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { ChoiceBox, ChoiceBoxItem } from "@/components/choice-box"
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import { FormattedNumber } from "@/components/formatted-number"
import { Heading } from "@/components/heading"
import { Note } from "@/components/note"
import { Separator } from "@/components/separator"
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

const MEMBERS = [
  { id: "av", name: "Aurelia Vance", role: "Owner", seen: "Today" },
  { id: "jk", name: "Jonas Keller", role: "Editor", seen: "Yesterday" },
  { id: "mr", name: "Mira Roth", role: "Viewer", seen: "Last week" },
]

const INVOICES = [
  { id: "0042", customer: "Nordlicht GmbH", status: "Paid", amount: 1280 },
  { id: "0043", customer: "Hafenbau AG", status: "Open", amount: 640 },
  { id: "0044", customer: "Kiosk Süd", status: "Overdue", amount: 215 },
]

const KPIS = [
  { label: "Signups", value: 1284, delta: "+12%", series: [12, 18, 14, 22, 26, 30, 34, 41] },
  { label: "Active kiosks", value: 312, delta: "+3%", series: [290, 294, 296, 301, 305, 309, 312] },
  { label: "Checkout errors", value: 17, delta: "−40%", series: [41, 38, 30, 29, 22, 19, 17] },
]

export const cardExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A muted surface with the signature faint cyan border.",
    render: () => (
      <Card className="max-w-sm">
        <CardHeader
          title="Storage upgrade"
          description="Expand your workspace with another 500 GB of fast object storage."
        />
        <CardContent className="text-sm text-quebi-fg-muted">
          Billed monthly. Cancel anytime — no long-term contract required.
        </CardContent>
        <CardFooter>
          <span className="font-sans font-bold text-2xl text-quebi-fg tabular-nums">
            €9<span className="text-base font-medium text-quebi-fg-muted">/mo</span>
          </span>
        </CardFooter>
      </Card>
    ),
  },
  {
    title: "Feature",
    description: "The brand-tinted variant with a glow. Reserve it for the hero card.",
    render: () => (
      <Card variant="feature" className="max-w-sm">
        <CardHeader
          title="Unlimited Pro"
          description="Everything, everywhere, all at once. Priority support included."
        />
        <CardContent className="text-sm text-quebi-fg-muted">
          The complete quebi platform with no usage caps.
        </CardContent>
        <CardFooter>
          <span className="font-sans font-bold text-2xl text-quebi-fg tabular-nums">
            €49<span className="text-base font-medium text-quebi-fg-muted">/mo</span>
          </span>
        </CardFooter>
      </Card>
    ),
  },
  {
    title: "Interactive",
    description: "Opt in to the hover lift + glow for link- or button-like cards.",
    render: () => (
      <Card interactive className="max-w-sm cursor-pointer">
        <CardHeader
          title="Open dashboard"
          description="Jump back into your projects and recent activity."
        />
      </Card>
    ),
  },
  {
    title: "With action",
    description: "CardAction pins a control to the top-right of the header.",
    render: () => (
      <Card className="max-w-sm">
        <CardHeader title="Team members" description="3 people have access to this project.">
          <CardAction>
            <Button intent="outline" size="sm">
              Invite
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    ),
  },
  {
    title: "Composed manually",
    description: "Use CardTitle and CardDescription directly for full control.",
    render: () => (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Custom layout</CardTitle>
          <CardDescription>Compose the pieces yourself when props aren't enough.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-quebi-fg-muted">
          Every sub-component accepts a className and forwards native div props.
        </CardContent>
      </Card>
    ),
  },

  // What to use instead. Each of these renders the alternative, and draws the
  // card-shaped version it replaces in `insteadOf`; the page lifts them out of
  // the gallery into their own section, side by side.
  {
    title: "A card inside a card → sections",
    description:
      "The inner card was separating one part of the outer one from the rest. A heading does that, and a separator draws the line if one is needed.",
    insteadOf: () => (
      <Card className="max-w-sm">
        <CardHeader title="Project settings" />
        <CardContent className="flex flex-col gap-3">
          <Card>
            <CardHeader title="General" description="Name and visibility." />
          </Card>
          <Card>
            <CardHeader title="Danger zone" description="Archive or delete the project." />
          </Card>
        </CardContent>
      </Card>
    ),
    render: () => (
      <div className="flex max-w-sm flex-col gap-4">
        <Heading level={3}>Project settings</Heading>
        <div>
          <Heading level={4}>General</Heading>
          <p className="mt-1 text-sm text-quebi-fg-muted">Name and visibility.</p>
        </div>
        <Separator />
        <div>
          <Heading level={4}>Danger zone</Heading>
          <p className="mt-1 text-sm text-quebi-fg-muted">Archive or delete the project.</p>
        </div>
      </div>
    ),
  },
  {
    title: "A card per list item → divided rows",
    description:
      "Three boxes of the same shape are a list. Rows separated by a hairline read faster, and they stay readable at thirty. Reach for GridList when the rows are actionable.",
    insteadOf: () => (
      <div className="flex max-w-sm flex-col gap-3">
        {MEMBERS.map((m) => (
          <Card key={m.id}>
            <CardHeader title={m.name} description={m.role} />
          </Card>
        ))}
      </div>
    ),
    render: () => (
      <ul className="flex max-w-sm flex-col">
        {MEMBERS.map((m, index) => (
          <li key={m.id}>
            {index > 0 && <Separator />}
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm font-medium text-quebi-fg">{m.name}</span>
              <span className="text-sm text-quebi-fg-muted">{m.role}</span>
            </div>
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "A card grid of records → a table",
    description:
      "When every card has the same fields, the fields are columns. A table lines them up so they can be compared, and sorts them when that matters (DataTable, ServerTable).",
    insteadOf: () => (
      <div className="grid max-w-md grid-cols-3 gap-3">
        {INVOICES.map((i) => (
          <Card key={i.id} className="p-3">
            <CardTitle className="text-sm">#{i.id}</CardTitle>
            <CardDescription className="text-xs">{i.customer}</CardDescription>
            <CardDescription className="mt-2 text-xs">{i.status}</CardDescription>
          </Card>
        ))}
      </div>
    ),
    render: () => (
      <Table aria-label="Invoices" className="max-w-md">
        <TableHeader>
          <TableColumn isRowHeader>Invoice</TableColumn>
          <TableColumn>Customer</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Amount</TableColumn>
        </TableHeader>
        <TableBody items={INVOICES}>
          {(i) => (
            <TableRow>
              <TableCell>#{i.id}</TableCell>
              <TableCell>{i.customer}</TableCell>
              <TableCell>{i.status}</TableCell>
              <TableCell>
                <FormattedNumber value={i.amount} options={{ style: "currency", currency: "EUR" }} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    ),
  },
  {
    title: "KPI cards → a stat row",
    description:
      "A number does not need a box to be read. Label, value and a delta or sparkline, with vertical separators between the stats, carry the same data in a third of the ink.",
    insteadOf: () => (
      <div className="grid max-w-md grid-cols-3 gap-3">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-3">
            <CardDescription className="text-xs">{k.label}</CardDescription>
            <CardTitle>
              <FormattedNumber value={k.value} />
            </CardTitle>
          </Card>
        ))}
      </div>
    ),
    render: () => (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
        {KPIS.map((k, index) => (
          <div key={k.label} className="flex items-stretch gap-6">
            {/* Between stats in a row; a stack needs no line, the gap does it. */}
            {index > 0 && (
              <Separator orientation="vertical" className="hidden h-auto sm:block" />
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-quebi-fg-muted">{k.label}</span>
              <span className="text-2xl font-semibold text-quebi-fg tabular-nums">
                <FormattedNumber value={k.value} />
              </span>
              <span className="flex items-center gap-2">
                <Badge intent="success">{k.delta}</Badge>
                <Sparkline data={k.series} className="text-quebi-brand-text" />
              </span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "A key/value card → DescriptionList",
    description:
      "Terms and values in a card are a description list with a border drawn round it. The list already divides its rows.",
    insteadOf: () => (
      <Card className="max-w-sm">
        <CardHeader title="Invoice #0042" />
        <CardContent className="flex flex-col gap-1 text-sm text-quebi-fg-muted">
          <span>Customer: Nordlicht GmbH</span>
          <span>Status: Paid</span>
          <span>Issued: June 30, 2026</span>
        </CardContent>
      </Card>
    ),
    render: () => (
      <DescriptionList className="max-w-sm">
        <DescriptionTerm>Customer</DescriptionTerm>
        <DescriptionDetails>Nordlicht GmbH</DescriptionDetails>
        <DescriptionTerm>Status</DescriptionTerm>
        <DescriptionDetails>Paid</DescriptionDetails>
        <DescriptionTerm>Issued</DescriptionTerm>
        <DescriptionDetails>June 30, 2026</DescriptionDetails>
      </DescriptionList>
    ),
  },
  {
    title: "A callout card → Note",
    description:
      "A card with a warning in it says nothing about how urgent the warning is. A Note carries an intent, an icon and the right role.",
    insteadOf: () => (
      <Card className="max-w-sm">
        <CardHeader
          title="Heads up"
          description="Two devices in this bundle are out of stock."
        />
      </Card>
    ),
    render: () => (
      <Note intent="warning" className="max-w-sm">
        Two devices in this bundle are out of stock.
      </Note>
    ),
  },
  {
    title: "Clickable option cards → ChoiceBox",
    description:
      "A row of interactive cards that pick one plan is a radio group drawn as cards. ChoiceBox is that, with the selection state, keyboard and form value included.",
    insteadOf: () => (
      <div className="flex max-w-sm flex-col gap-3">
        <Card interactive>
          <CardHeader title="Starter" description="For solo projects." />
        </Card>
        <Card interactive>
          <CardHeader title="Pro" description="For growing teams." />
        </Card>
      </div>
    ),
    render: () => (
      <ChoiceBox aria-label="Plan" defaultSelectedKeys={["pro"]} className="w-full max-w-sm">
        <ChoiceBoxItem id="starter" label="Starter" description="For solo projects." />
        <ChoiceBoxItem id="pro" label="Pro" description="For growing teams." />
      </ChoiceBox>
    ),
  },
]
