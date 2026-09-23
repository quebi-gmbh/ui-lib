import { FileText, FolderOpen, Image, MoreHorizontal } from "lucide-react"
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
  ItemGroup,
  ItemMedia,
  ItemMeta,
  ItemTitle,
} from "@/components/item"
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

export const itemExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "Avatar, name and email, the role as trailing meta and one action. The group draws the hairline between rows; a row draws nothing around itself.",
    render: () => (
      <ItemGroup className="w-full max-w-md">
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
      </ItemGroup>
    ),
  },
  {
    title: "Icon tile and a menu",
    description:
      "An IconTile leads where there is no picture. Meta that is a number or a date lines up down the list in tabular figures, and a Menu trigger holds the row's actions.",
    render: () => (
      <ItemGroup className="w-full max-w-md">
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
            <ItemActions>
              <Menu>
                <Button intent="ghost" size="sq-xs" aria-label={`Actions for ${f.name}`}>
                  <MoreHorizontal data-slot="icon" aria-hidden />
                </Button>
                <MenuContent placement="bottom end">
                  <MenuItem>Rename</MenuItem>
                  <MenuItem>Download</MenuItem>
                  <MenuSeparator />
                  <MenuItem intent="danger">Delete</MenuItem>
                </MenuContent>
              </Menu>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    ),
  },
  {
    title: "Only the slots you need",
    description:
      "Every slot is optional and nothing holds space for a missing one: a title and a badge, or a title and a secondary line, is still a row.",
    render: () => (
      <ItemGroup className="w-full max-w-sm">
        <Item>
          <ItemContent>
            <ItemTitle>Production</ItemTitle>
          </ItemContent>
          <ItemMeta>
            <Badge intent="success">Healthy</Badge>
          </ItemMeta>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle>Staging</ItemTitle>
          </ItemContent>
          <ItemMeta>
            <Badge intent="warning">Degraded</Badge>
          </ItemMeta>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle>Preview</ItemTitle>
            <ItemDescription>Deploys every pull request</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    ),
  },
  {
    title: "Inside a card",
    description:
      "When the list is one of a few different units on a dashboard, the card is the unit and the rows sit in it — one card around the list, not one per row.",
    frame: "none",
    render: () => (
      <Card className="max-w-md">
        <CardHeader title="Team" description="Three members with access to this project." />
        <CardContent>
          <ItemGroup>
            {MEMBERS.map((m) => (
              <Item key={m.id}>
                <ItemMedia>
                  <Avatar initials={m.id} alt={m.name} size="sm" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{m.name}</ItemTitle>
                </ItemContent>
                <ItemMeta>{m.role}</ItemMeta>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
    ),
  },
]
