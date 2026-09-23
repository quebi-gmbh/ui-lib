import { ChevronRight } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { Badge } from "@/components/badge"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemMeta, ItemTitle } from "@/components/item"
import { List, ListLink } from "@/components/list"
import type { OgScene } from "./types"

const MEMBERS = [
  { id: "av", name: "Aurelia Vance", email: "aurelia@quebi.de", role: "Owner" },
  { id: "jk", name: "Jonas Keller", email: "jonas@quebi.de", role: "Editor" },
  { id: "mr", name: "Mira Roth", email: "mira@quebi.de", role: "Viewer" },
] as const

/** Three divided rows that navigate — the hairline rhythm is what says "list", the chevron what says "goes somewhere". */
export const listOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <List aria-label="Members" className="w-110">
      {MEMBERS.map((m) => (
        <Item key={m.id}>
          <ItemMedia>
            <Avatar initials={m.id} alt={m.name} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              <ListLink href={`#${m.id}`}>{m.name}</ListLink>
            </ItemTitle>
            <ItemDescription>{m.email}</ItemDescription>
          </ItemContent>
          <ItemMeta>
            <Badge intent={m.role === "Owner" ? "brand" : "neutral"}>{m.role}</Badge>
            <ChevronRight className="size-4" aria-hidden />
          </ItemMeta>
        </Item>
      ))}
    </List>
  ),
}
