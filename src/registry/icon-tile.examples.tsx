import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CreditCard,
  Database,
  Info,
  Rocket,
  Server,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/button"
import { Heading } from "@/components/heading"
import { IconTile } from "@/components/icon-tile"
import { Text } from "@/components/text"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

export const iconTileExamples: ComponentExample[] = [
  {
    title: "Intents",
    description:
      "The tint scale is Badge's, value for value — brand teal flags a feature, and the ai gradient stays on AI surfaces.",
    render: () => (
      <Row>
        <IconTile intent="neutral">
          <Server data-slot="icon" />
        </IconTile>
        <IconTile intent="brand">
          <Rocket data-slot="icon" />
        </IconTile>
        <IconTile intent="accent">
          <CreditCard data-slot="icon" />
        </IconTile>
        <IconTile intent="success">
          <CheckCircle2 data-slot="icon" />
        </IconTile>
        <IconTile intent="warning">
          <AlertTriangle data-slot="icon" />
        </IconTile>
        <IconTile intent="danger">
          <Trash2 data-slot="icon" />
        </IconTile>
        <IconTile intent="info">
          <Info data-slot="icon" />
        </IconTile>
        <IconTile intent="ai">
          <Sparkles data-slot="icon" />
        </IconTile>
        <IconTile intent="outline">
          <Database data-slot="icon" />
        </IconTile>
      </Row>
    ),
  },
  {
    title: "Sizes",
    description:
      "xs through lg are Button's square scale, so a tile and an icon button in the same row are the same height. 2xs sits below it, for an inline indicator that is not a hit target.",
    render: () => (
      <Row>
        <IconTile size="2xs" intent="brand">
          <Zap data-slot="icon" />
        </IconTile>
        <IconTile size="xs" intent="brand">
          <Zap data-slot="icon" />
        </IconTile>
        <IconTile size="sm" intent="brand">
          <Zap data-slot="icon" />
        </IconTile>
        <IconTile size="md" intent="brand">
          <Zap data-slot="icon" />
        </IconTile>
        <IconTile size="lg" intent="brand">
          <Zap data-slot="icon" />
        </IconTile>
      </Row>
    ),
  },
  {
    title: "Beside an icon button",
    description:
      "Each tile size pairs with the button square size of the same name: sm with sq-sm, md with sq-md.",
    render: () => (
      <Row>
        <IconTile size="sm" intent="neutral">
          <BellRing data-slot="icon" />
        </IconTile>
        <Button size="sq-sm" intent="outline" aria-label="Notifications">
          <BellRing data-slot="icon" />
        </Button>
        <IconTile size="md" intent="neutral">
          <BellRing data-slot="icon" />
        </IconTile>
        <Button size="sq-md" intent="outline" aria-label="Notifications">
          <BellRing data-slot="icon" />
        </Button>
      </Row>
    ),
  },
  {
    title: "Circle",
    description: "isCircle rounds the tile — square is the default, as it is for Button and Toggle.",
    render: () => (
      <Row>
        <IconTile isCircle intent="success">
          <CheckCircle2 data-slot="icon" />
        </IconTile>
        <IconTile isCircle intent="brand" size="lg">
          <Rocket data-slot="icon" />
        </IconTile>
      </Row>
    ),
  },
  {
    title: "Leading a feature row",
    description:
      "The tile owns the box and the tint; the row around it is plain layout, which stays yours.",
    render: () => (
      <div className="flex max-w-md flex-col gap-4">
        <div className="flex items-start gap-4">
          <IconTile intent="brand" size="lg">
            <Rocket data-slot="icon" />
          </IconTile>
          <div className="flex flex-col gap-1">
            <Heading level={3}>Instant deploys</Heading>
            <Text>Push to main and the kiosk fleet updates within the minute.</Text>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <IconTile intent="accent" size="lg">
            <Database data-slot="icon" />
          </IconTile>
          <div className="flex flex-col gap-1">
            <Heading level={3}>Every revision kept</Heading>
            <Text>Roll back to any published version without leaving the dashboard.</Text>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "When the glyph is the meaning",
    description:
      "A tile is decorative by default. Where nothing beside it says what it means, label it — role=\"img\" plus an aria-label, so the state is not colour-only.",
    render: () => (
      <Row>
        <IconTile intent="success" role="img" aria-label="Sync healthy">
          <CheckCircle2 data-slot="icon" />
        </IconTile>
        <IconTile intent="warning" role="img" aria-label="Sync delayed">
          <AlertTriangle data-slot="icon" />
        </IconTile>
      </Row>
    ),
  },
]
