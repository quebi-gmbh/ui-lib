import { ArrowRight } from "lucide-react"
import { LinkButton } from "@/components/link-button"
import type { OgScene } from "./types"

/** Looks like a Button, navigates like a link — so the scene is a Button's. */
export const linkButtonOgScene: OgScene = {
  render: () => (
    <div className="flex items-center gap-4">
      <LinkButton href="#" intent="primary" size="lg">
        Read the docs
        <ArrowRight data-slot="icon" aria-hidden="true" />
      </LinkButton>
      <LinkButton href="#" intent="outline" size="lg">
        GitHub
      </LinkButton>
    </div>
  ),
}
