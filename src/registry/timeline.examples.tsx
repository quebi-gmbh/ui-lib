import { Check, CreditCard, House, Package, Rocket, Sparkles, Truck, Wrench } from "lucide-react"
import { Badge } from "@/components/badge"
import { Card, CardContent, CardHeader } from "@/components/card"
import {
  Timeline,
  TimelineDescription,
  TimelineDetails,
  TimelineItem,
  type TimelineItemData,
  TimelineMarker,
  TimelineMeta,
  TimelineNow,
  TimelineTitle,
} from "@/components/timeline"
import type { ComponentExample } from "./types"

/**
 * Every example pins its own `now` and its own locale. A timeline that read the
 * clock would draw a different "future" on every visit — and a different one
 * again in the prerendered HTML.
 */
const NOW = "2026-09-28T10:00"

const RELEASES: TimelineItemData[] = [
  {
    id: "2.0",
    date: "2026-09-14",
    title: "2.0 — Timeline, Year View",
    href: "#v2-0",
    badges: <Badge>major</Badge>,
    description: "Two new date components and a rewritten prerender.",
  },
  {
    id: "1.9",
    date: "2026-08-02",
    title: "1.9 — Quick Actions",
    href: "#v1-9",
    badges: <Badge intent="outline">minor</Badge>,
    description: "A sheet of this screen's actions, from the header or a floating trigger.",
  },
  {
    id: "1.8.1",
    date: "2026-07-21",
    title: "1.8.1",
    href: "#v1-8-1",
    badges: <Badge intent="warning">fix</Badge>,
    description: "Plugin rules read tests/ again.",
  },
  {
    id: "1.8",
    date: "2026-07-03",
    title: "1.8 — Table of Contents",
    href: "#v1-8",
    badges: <Badge intent="outline">minor</Badge>,
  },
  { id: "1.7", date: "2026-05-30", title: "1.7 — Tracker", href: "#v1-7", badges: <Badge intent="outline">minor</Badge> },
  { id: "1.6", date: "2026-04-11", title: "1.6 — Filter Rail", href: "#v1-6", badges: <Badge intent="outline">minor</Badge> },
  { id: "1.0", date: "2026-01-15", title: "1.0", href: "#v1-0", badges: <Badge>major</Badge> },
]

const HISTORY: TimelineItemData[] = [
  { id: "found", date: "2016", title: "Founded in a Hamburg garage", tone: "brand" },
  { id: "first", date: "2018", title: "First customer", description: "A dental practice, still with us." },
  { id: "series", date: "2020", title: "Seed round", description: "Twelve people, one product." },
  { id: "berlin", date: "2022", title: "Berlin office opens" },
  { id: "hundred", date: "2024", title: "100 employees", tone: "success" },
  { id: "today", date: "2026", title: "Four products, 2,000 customers" },
]

export const timelineExamples: ComponentExample[] = [
  {
    title: "Changelog",
    description:
      "Vertical, content on one side, newest first. The data is in the order it was written; `order=\"desc\"` sorts it, and `collapseAfter` folds the older releases away.",
    render: () => (
      <Timeline
        aria-label="Releases"
        items={[...RELEASES].reverse()}
        order="desc"
        collapseAfter={4}
        locale="en-GB"
        className="w-full max-w-lg"
      />
    ),
  },
  {
    title: "Company history, alternating",
    description:
      "Content flips side per item and the year crosses the axis. Narrow the container and it collapses to one side.",
    render: () => (
      <Timeline
        aria-label="Our history"
        items={HISTORY}
        placement="alternating"
        locale="en-GB"
        className="w-full max-w-2xl"
      />
    ),
  },
  {
    title: "Career, with ranges",
    description:
      "`opposite` puts the dates in a column of their own. Ranges read as one label, and `end=\"present\"` leaves one open.",
    render: () => (
      <Timeline aria-label="Experience" placement="opposite" order="desc" locale="en-GB" className="w-full max-w-2xl">
        <TimelineItem start="2023-04" end="present" tone="brand" isCurrent>
          <TimelineTitle>Staff engineer, quebi</TimelineTitle>
          <TimelineDescription>Design system and the component library.</TimelineDescription>
        </TimelineItem>
        <TimelineItem start="2019" end="2023">
          <TimelineTitle>Senior engineer, Northwind</TimelineTitle>
          <TimelineDescription>Scheduling for 400 clinics.</TimelineDescription>
        </TimelineItem>
        <TimelineItem start="2018-03" end="2018-09">
          <TimelineTitle>Sabbatical</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2014-10" end="2018-02">
          <TimelineTitle>Engineer, Contoso</TimelineTitle>
        </TimelineItem>
      </Timeline>
    ),
  },
  {
    title: "Order tracking",
    description:
      "Status markers, a pulsing current step, and `now`: the connector turns dashed from the first span that reaches the future, and `TimelineNow` sorts itself into place.",
    render: () => (
      <Timeline aria-label="Order 20931" now="2026-09-26T09:15" order="asc" locale="en-GB" className="w-full max-w-md">
        <TimelineItem date="2026-09-24T18:02" tone="success" marker={<TimelineMarker icon={<CreditCard />} />}>
          <TimelineTitle>Paid</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2026-09-25T07:40" tone="success" marker={<TimelineMarker icon={<Package />} />}>
          <TimelineTitle>Packed</TimelineTitle>
          <TimelineMeta>Warehouse Hamburg</TimelineMeta>
        </TimelineItem>
        <TimelineItem
          date="2026-09-25T16:05"
          tone="brand"
          isCurrent
          marker={<TimelineMarker icon={<Truck />} />}
        >
          <TimelineTitle>In transit</TimelineTitle>
          <TimelineDescription>Handed to DHL, tracking 00340434161094042557.</TimelineDescription>
        </TimelineItem>
        <TimelineNow />
        <TimelineItem date="2026-09-27" tone="muted" marker={<TimelineMarker variant="ring" />}>
          <TimelineTitle className="text-quebi-fg-muted">Out for delivery (expected)</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2026-09-27" tone="muted" marker={<TimelineMarker icon={<House />} />}>
          <TimelineTitle className="text-quebi-fg-muted">Delivered</TimelineTitle>
        </TimelineItem>
      </Timeline>
    ),
  },
  {
    title: "Roadmap by quarter",
    description:
      "Horizontal: the list scrolls when it outgrows its container, is a focusable region the arrow keys scroll, and snaps to items by proximity.",
    render: () => (
      <Timeline
        aria-label="Roadmap"
        orientation="horizontal"
        now={NOW}
        locale="en-GB"
        className="w-full"
      >
        <TimelineItem date="2026-Q1" tone="success" marker={<TimelineMarker icon={<Check />} />}>
          <TimelineTitle>Rules as lint</TimelineTitle>
          <TimelineDescription>The published rules run on this repo.</TimelineDescription>
        </TimelineItem>
        <TimelineItem date="2026-Q2" tone="success" marker={<TimelineMarker icon={<Check />} />}>
          <TimelineTitle>Calendar views</TimelineTitle>
          <TimelineDescription>Day, week, month and year.</TimelineDescription>
        </TimelineItem>
        <TimelineItem date="2026-Q3" tone="brand" isCurrent marker={<TimelineMarker icon={<Wrench />} />}>
          <TimelineTitle>Timeline</TimelineTitle>
          <TimelineDescription>You are reading it.</TimelineDescription>
        </TimelineItem>
        <TimelineItem date="2026-Q4" tone="muted" marker={<TimelineMarker variant="ring" />}>
          <TimelineTitle>Charts, second pass</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2027-Q1" tone="muted" marker={<TimelineMarker variant="ring" />}>
          <TimelineTitle>Figma kit</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2027-Q2" tone="muted" marker={<TimelineMarker variant="ring" />}>
          <TimelineTitle>2.0</TimelineTitle>
        </TimelineItem>
      </Timeline>
    ),
  },
  {
    title: "Audit log, grouped by day",
    description:
      "Avatars as markers, date and time, `relative` labels against a pinned `now`, and sticky day headings from `groupBy`. An item with more to say folds it behind `TimelineDetails`.",
    render: () => (
      <Timeline
        aria-label="Activity"
        groupBy="day"
        order="desc"
        relative
        now={NOW}
        density="compact"
        locale="en-GB"
        className="w-full max-w-md"
        items={[
          {
            id: "1",
            date: "2026-09-28T09:12",
            title: "Anna changed the invoice address",
            avatar: { initials: "AK" },
            details: "Musterstraße 1, 20095 Hamburg → Ballindamm 7, 20095 Hamburg",
          },
          { id: "2", date: "2026-09-28T08:40", title: "Ben approved PR #190", avatar: { initials: "BS" } },
          { id: "3", date: "2026-09-27T17:03", title: "Anna invited Chris", avatar: { initials: "AK" } },
          {
            id: "4",
            date: "2026-09-27T11:30",
            title: "Deploy failed",
            tone: "danger",
            icon: <Rocket />,
            meta: "main · d6f8771",
          },
          { id: "5", date: "2026-09-26T15:45", title: "Chris signed in from a new device", avatar: { initials: "CL" } },
        ]}
      />
    ),
  },
  {
    title: "Mixed precision",
    description:
      "Each date renders at its own precision — a year long ago, a month closer in, a week, a day and a time as it gets near.",
    render: () => (
      <Timeline aria-label="Project history" locale="en-GB" className="w-full max-w-md">
        <TimelineItem date="2019">
          <TimelineTitle>Idea</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2021-Q3">
          <TimelineTitle>Prototype</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2022-03">
          <TimelineTitle>First pilot</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2023-W12">
          <TimelineTitle>Security review</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2024-06-04">
          <TimelineTitle>General availability</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2024-06-04T14:30" tone="brand">
          <TimelineTitle>Launch post published</TimelineTitle>
        </TimelineItem>
      </Timeline>
    ),
  },
  {
    title: "Proportional, with lanes",
    description:
      "`spacing=\"proportional\"`: position follows real time, ranges are bars, overlapping items take lanes, and the empty years between 2013 and 2018 are compressed behind a break instead of drawn to scale.",
    frame: "none",
    render: () => (
      <Timeline aria-label="Projects" spacing="proportional" now="2026-09" locale="en-GB">
        <TimelineItem start="2011-03" end="2013-06" tone="muted">
          <TimelineTitle>Apprenticeship</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2018-09" end="2021-02" tone="brand">
          <TimelineTitle>Scheduling</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2020-01" end="2022-10">
          <TimelineTitle>Billing</TimelineTitle>
        </TimelineItem>
        <TimelineItem date="2020-06">
          <TimelineTitle>Pilot clinic</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2022-04" end="present" tone="brand" isCurrent>
          <TimelineTitle>Design system</TimelineTitle>
        </TimelineItem>
        <TimelineItem start="2024-02" end="2025-01" tone="muted">
          <TimelineTitle>Migration</TimelineTitle>
        </TimelineItem>
      </Timeline>
    ),
  },
  {
    title: "Compact, in a sidebar",
    description:
      "`density=\"compact\"` in a narrow Card. The card is around the timeline; the items inside it are not cards.",
    render: () => (
      <Card className="w-72">
        <CardHeader title="recent" />
        <CardContent>
          <Timeline aria-label="Recent" density="compact" relative now={NOW} locale="en-GB">
            <TimelineItem date="2026-09-28T09:50" tone="brand">
              <TimelineTitle>Report exported</TimelineTitle>
            </TimelineItem>
            <TimelineItem date="2026-09-28T07:15">
              <TimelineTitle>Filter saved</TimelineTitle>
            </TimelineItem>
            <TimelineItem date="2026-09-25">
              <TimelineTitle>Dashboard shared</TimelineTitle>
            </TimelineItem>
            <TimelineItem date="2026-08">
              <TimelineTitle>Workspace created</TimelineTitle>
            </TimelineItem>
          </Timeline>
        </CardContent>
      </Card>
    ),
  },
  {
    title: "Markers and tones",
    description:
      "Dot in three sizes, ring, icon, avatar, number and a custom node. Neutral is ink, brand the action fill, muted the subtle grey; success, warning and danger are for a state that is the point. Markers are decoration — the words carry the state.",
    render: () => (
      <Timeline aria-label="Markers" locale="en-GB" className="w-full max-w-sm">
        <TimelineItem marker={<TimelineMarker size="sm" />}>
          <TimelineTitle>Small dot, neutral</TimelineTitle>
        </TimelineItem>
        <TimelineItem tone="brand" marker={<TimelineMarker size="lg" />}>
          <TimelineTitle>Large dot, brand</TimelineTitle>
        </TimelineItem>
        <TimelineItem tone="success" marker={<TimelineMarker variant="ring" />}>
          <TimelineTitle>Ring, success</TimelineTitle>
        </TimelineItem>
        <TimelineItem tone="warning" marker={<TimelineMarker icon={<Sparkles />} />}>
          <TimelineTitle>Icon, warning</TimelineTitle>
        </TimelineItem>
        <TimelineItem marker={<TimelineMarker initials="MS" />}>
          <TimelineTitle>Avatar</TimelineTitle>
        </TimelineItem>
        <TimelineItem tone="danger" marker={<TimelineMarker number={6} />}>
          <TimelineTitle>Number, danger</TimelineTitle>
        </TimelineItem>
        <TimelineItem
          tone="muted"
          connector="dashed"
          marker={
            <TimelineMarker>
              <span className="size-3 rotate-45 bg-quebi-fg-subtle" />
            </TimelineMarker>
          }
        >
          <TimelineTitle>Custom node, dashed connector on</TimelineTitle>
        </TimelineItem>
        <TimelineItem tone="muted">
          <TimelineTitle>Muted</TimelineTitle>
        </TimelineItem>
      </Timeline>
    ),
  },
  {
    title: "Content before the axis",
    description: "`placement=\"start\"` puts the content before the line and aligns it to it.",
    render: () => (
      <Timeline aria-label="Steps" placement="start" locale="en-GB" className="w-full max-w-sm">
        <TimelineItem date="2026-09-01">
          <TimelineTitle>Request received</TimelineTitle>
          <TimelineMeta>
            <Badge>Support</Badge>
          </TimelineMeta>
        </TimelineItem>
        <TimelineItem date="2026-09-02" tone="brand">
          <TimelineTitle>Answered</TimelineTitle>
          <TimelineDetails>First response in 3 hours.</TimelineDetails>
        </TimelineItem>
      </Timeline>
    ),
  },
  {
    title: "Empty",
    description: "No items renders the empty state, in words — override it with `emptyState`.",
    render: () => <Timeline aria-label="Activity" locale="en-GB" className="w-full max-w-sm" />,
  },
]
