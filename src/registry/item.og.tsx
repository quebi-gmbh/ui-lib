import { MoreHorizontal } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { Button } from "@/components/button"
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
import type { OgScene } from "./types"

const MEMBERS = [
  { id: "av", name: "Aurelia Vance", email: "aurelia@quebi.de", role: "Owner" },
  { id: "jk", name: "Jonas Keller", email: "jonas@quebi.de", role: "Editor" },
]

/** Two rows, every slot filled, so the leading/content/trailing rhythm and the hairline both read. */
export const itemOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <ItemGroup className="w-110">
      {MEMBERS.map((m) => (
        <Item key={m.id}>
          <ItemMedia>
            <Avatar initials={m.id} alt={m.name} size="lg" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{m.name}</ItemTitle>
            <ItemDescription>{m.email}</ItemDescription>
          </ItemContent>
          <ItemMeta>{m.role}</ItemMeta>
          <ItemActions>
            <Button intent="ghost" size="sq-sm" aria-label={`Actions for ${m.name}`}>
              <MoreHorizontal data-slot="icon" aria-hidden />
            </Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  ),
}
