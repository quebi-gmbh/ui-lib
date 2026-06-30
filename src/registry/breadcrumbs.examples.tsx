import { Breadcrumbs, BreadcrumbsItem } from "@/components/breadcrumbs"
import type { ComponentExample } from "./types"

export const breadcrumbsExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Chevron-separated trail. The last crumb is the current page.",
    render: () => (
      <Breadcrumbs>
        <BreadcrumbsItem href="/">Catalog</BreadcrumbsItem>
        <BreadcrumbsItem href="/devices">Devices</BreadcrumbsItem>
        <BreadcrumbsItem>iPhone 15 Pro Max</BreadcrumbsItem>
      </Breadcrumbs>
    ),
  },
  {
    title: "Slash separator",
    description: "Use separator=\"slash\" for narrower trails or beside a page title.",
    render: () => (
      <Breadcrumbs separator="slash">
        <BreadcrumbsItem href="/">Plans</BreadcrumbsItem>
        <BreadcrumbsItem href="/plans/flex-50">Flex 50</BreadcrumbsItem>
        <BreadcrumbsItem>Pricing</BreadcrumbsItem>
      </Breadcrumbs>
    ),
  },
  {
    title: "With icon",
    description: "A leading icon (data-slot=\"icon\") inherits the crumb's color.",
    render: () => (
      <Breadcrumbs>
        <BreadcrumbsItem href="/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            data-slot="icon"
          >
            <path d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3H9v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6H4a1 1 0 0 1-.707-1.707l7-7Z" />
          </svg>
          Home
        </BreadcrumbsItem>
        <BreadcrumbsItem href="/settings">Settings</BreadcrumbsItem>
        <BreadcrumbsItem>Profile</BreadcrumbsItem>
      </Breadcrumbs>
    ),
  },
  {
    title: "Two levels",
    description: "A short trail with a single parent.",
    render: () => (
      <Breadcrumbs>
        <BreadcrumbsItem href="/">Dashboard</BreadcrumbsItem>
        <BreadcrumbsItem>Billing</BreadcrumbsItem>
      </Breadcrumbs>
    ),
  },
]
