import { Breadcrumbs, BreadcrumbsItem } from "@/components/breadcrumbs"
import type { OgScene } from "./types"

/** A three-deep trail, ending on the page you are supposedly looking at. */
export const breadcrumbsOgScene: OgScene = {
  scale: 2,
  render: () => (
    <Breadcrumbs>
      <BreadcrumbsItem href="/">catalog</BreadcrumbsItem>
      <BreadcrumbsItem href="/devices">devices</BreadcrumbsItem>
      <BreadcrumbsItem>iPhone 15 Pro</BreadcrumbsItem>
    </Breadcrumbs>
  ),
}
