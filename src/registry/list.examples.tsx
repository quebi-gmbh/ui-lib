import {
  Bell,
  ChevronRight,
  FileText,
  FolderOpen,
  GitPullRequest,
  Image,
  Inbox,
  MoreHorizontal,
  Plus,
} from "lucide-react"
import { Avatar } from "@/components/avatar"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Card, CardContent, CardHeader } from "@/components/card"
import { ShortDate } from "@/components/formatted-date"
import { IconTile } from "@/components/icon-tile"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemMeta,
  ItemTitle,
} from "@/components/item"
import { List, ListEmpty, ListLink, ListSection } from "@/components/list"
import { Menu, MenuContent, MenuItem, MenuSeparator } from "@/components/menu"
import type { ComponentExample } from "./types"

const MEMBERS = [
  { id: "av", name: "Aurelia Vance", email: "aurelia@quebi.de", role: "Owner" },
  { id: "jk", name: "Jonas Keller", email: "jonas@quebi.de", role: "Editor" },
  { id: "mr", name: "Mira Roth", email: "mira@quebi.de", role: "Viewer" },
]

const FILES = [
  { id: "q3", name: "Q3 report.pdf", icon: FileText, size: "2.4 MB", modified: "2026-09-18" },
  { id: "hero", name: "hero-banner.png", icon: Image, size: "812 KB", modified: "2026-09-12" },
  { id: "assets", name: "Brand assets", icon: FolderOpen, size: "14 files", modified: "2026-08-30" },
]

const PROJECTS = [
  { id: "atlas", name: "Atlas", detail: "Design system migration", status: "Active" },
  { id: "beacon", name: "Beacon", detail: "Onboarding flow rewrite", status: "Review" },
  { id: "cobalt", name: "Cobalt", detail: "Billing export", status: "Paused" },
] as const

const STATUS_INTENT = {
  Active: "success",
  Review: "warning",
  Paused: "neutral",
} as const

const ENVIRONMENTS = [
  { id: "prod", name: "Production", region: "eu-central-1" },
  { id: "staging", name: "Staging", region: "eu-central-1" },
  { id: "preview", name: "Preview", region: "eu-west-1" },
  { id: "dev", name: "Development", region: "eu-west-1" },
  { id: "load", name: "Load test", region: "us-east-1" },
  { id: "sandbox", name: "Sandbox", region: "us-east-1" },
]

const ACTIVITY = [
  {
    group: "Today",
    rows: [
      { id: "pr-412", icon: GitPullRequest, title: "Jonas opened #412", detail: "Add a List page" },
      { id: "n-1", icon: Bell, title: "Deploy finished", detail: "Production, 3 services" },
    ],
  },
  {
    group: "Earlier this week",
    rows: [
      { id: "pr-409", icon: GitPullRequest, title: "Mira merged #409", detail: "Panel component" },
      { id: "n-2", icon: FileText, title: "Q3 report shared", detail: "With the finance team" },
    ],
  },
]

export const listExamples: ComponentExample[] = [
  {
    title: "Divided",
    description:
      "The default. A hairline between rows and nothing around them — the list sits on the page, and each row is an `Item`: media, title and secondary line, meta, an action.",
    render: () => (
      <List aria-label="Members" className="w-full max-w-md">
        {MEMBERS.map((m) => (
          <Item key={m.id}>
            <ItemMedia>
              <Avatar initials={m.id} alt={m.name} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{m.name}</ItemTitle>
              <ItemDescription>{m.email}</ItemDescription>
            </ItemContent>
            <ItemMeta>{m.role}</ItemMeta>
            <ItemActions>
              <Button intent="outline" size="xs">
                Manage
              </Button>
            </ItemActions>
          </Item>
        ))}
      </List>
    ),
  },
  {
    title: "Plain",
    description:
      "`variant=\"plain\"` drops the hairlines. For short lists whose rows already have a strong left edge — an icon tile down every row does the separating.",
    render: () => (
      <List variant="plain" aria-label="Files" className="w-full max-w-md">
        {FILES.map((f) => (
          <Item key={f.id}>
            <ItemMedia>
              <IconTile size="sm">
                <f.icon data-slot="icon" aria-hidden />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{f.name}</ItemTitle>
              <ItemDescription>
                <ShortDate date={f.modified} locale="en" />
              </ItemDescription>
            </ItemContent>
            <ItemMeta>{f.size}</ItemMeta>
          </Item>
        ))}
      </List>
    ),
  },
  {
    title: "Compact",
    description:
      "`density=\"compact\"` halves each row's vertical padding, for a long list that is read as a whole or a list in a sidebar. Keep the rows to one line when you use it.",
    render: () => (
      <List density="compact" aria-label="Environments" className="w-full max-w-sm">
        {ENVIRONMENTS.map((e) => (
          <Item key={e.id}>
            <ItemContent>
              <ItemTitle>{e.name}</ItemTitle>
            </ItemContent>
            <ItemMeta>{e.region}</ItemMeta>
          </Item>
        ))}
      </List>
    ),
  },
  {
    title: "Inset in a card",
    description:
      "When the list is the content of a Card, `inset` runs the rows — and the hairlines between them — to the card's edges, while the text stays in line with the card's header. One card round the list, never one per row.",
    frame: "none",
    render: () => (
      <Card className="max-w-md">
        <CardHeader title="Team" description="Three members with access to this project." />
        <CardContent>
          <List inset aria-label="Team">
            {MEMBERS.map((m) => (
              <Item key={m.id}>
                <ItemMedia>
                  <Avatar initials={m.id} alt={m.name} size="sm" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{m.name}</ItemTitle>
                </ItemContent>
                <ItemMeta>{m.role}</ItemMeta>
                <ItemActions>
                  <Menu>
                    <Button intent="ghost" size="sq-xs" aria-label={`Actions for ${m.name}`}>
                      <MoreHorizontal data-slot="icon" aria-hidden />
                    </Button>
                    <MenuContent placement="bottom end">
                      <MenuItem>Change role</MenuItem>
                      <MenuSeparator />
                      <MenuItem intent="danger">Remove</MenuItem>
                    </MenuContent>
                  </Menu>
                </ItemActions>
              </Item>
            ))}
          </List>
        </CardContent>
      </Card>
    ),
  },
  {
    title: "Rows that navigate",
    description:
      "A `ListLink` in the title stretches over the whole row: one target, one tab stop, a hover tint and a focus ring round the row. The action slot sits above it, so the row's own Button still takes its own press. This is navigation — rows the user selects or arrows through are a GridList.",
    render: () => (
      <List aria-label="Projects" className="w-full max-w-md">
        {PROJECTS.map((p) => (
          <Item key={p.id}>
            <ItemContent>
              <ItemTitle>
                <ListLink href={`#project-${p.id}`}>{p.name}</ListLink>
              </ItemTitle>
              <ItemDescription>{p.detail}</ItemDescription>
            </ItemContent>
            <ItemMeta>
              <Badge intent={STATUS_INTENT[p.status]}>{p.status}</Badge>
              <ChevronRight className="size-4" aria-hidden />
            </ItemMeta>
          </Item>
        ))}
      </List>
    ),
  },
  {
    title: "Static rows beside rows that navigate",
    description:
      "The difference is in the title, not the list. A row with no `ListLink` is static — nothing but its action takes focus — so the reader can tell a row that goes somewhere from one that only describes something.",
    render: () => (
      <List aria-label="Pull requests" className="w-full max-w-md">
        <Item>
          <ItemMedia>
            <IconTile size="sm">
              <GitPullRequest data-slot="icon" aria-hidden />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <ListLink href="#pr-412">Add a List page</ListLink>
            </ItemTitle>
            <ItemDescription>#412 · opened by Jonas</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button intent="outline" size="xs">
              Review
            </Button>
          </ItemActions>
        </Item>
        <Item>
          <ItemMedia>
            <IconTile size="sm">
              <GitPullRequest data-slot="icon" aria-hidden />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Draft: billing export</ItemTitle>
            <ItemDescription>Not pushed yet</ItemDescription>
          </ItemContent>
        </Item>
      </List>
    ),
  },
  {
    title: "Grouped",
    description:
      "`ListSection` puts a heading over each list and names the section by it. Split a long list by the thing the reader scans for — date, status, owner — and keep every group in the same shape.",
    render: () => (
      <div className="w-full max-w-md">
        {ACTIVITY.map((section) => (
          <ListSection key={section.group} title={section.group}>
            <List>
              {section.rows.map((r) => (
                <Item key={r.id}>
                  <ItemMedia>
                    <IconTile size="sm">
                      <r.icon data-slot="icon" aria-hidden />
                    </IconTile>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{r.title}</ItemTitle>
                    <ItemDescription>{r.detail}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </List>
          </ListSection>
        ))}
      </div>
    ),
  },
  {
    title: "Empty",
    description:
      "`ListEmpty` renders in place of the list, not inside it: what would be here, and the action that puts the first one there. An empty `<li>` would be announced as a list of one item.",
    frame: "none",
    render: () => (
      <Card className="max-w-md">
        <CardHeader title="Invitations" description="People you have invited to this project." />
        <CardContent>
          <ListEmpty
            icon={
              <IconTile>
                <Inbox data-slot="icon" aria-hidden />
              </IconTile>
            }
            title="No pending invitations"
            description="Invite a teammate and they will show up here until they accept."
          >
            <Button size="sm">
              <Plus data-slot="icon" aria-hidden />
              Invite
            </Button>
          </ListEmpty>
        </CardContent>
      </Card>
    ),
  },
]
