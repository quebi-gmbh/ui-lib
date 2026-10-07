import { Breadcrumbs, BreadcrumbsItem } from "@/components/breadcrumbs"
import type { ComponentExample } from "./types"

export const breadcrumbsExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Chevron-separated trail. The last crumb is the current page.",
    render: () => (
      <Breadcrumbs>
        <BreadcrumbsItem href="/">catalog</BreadcrumbsItem>
        <BreadcrumbsItem href="/devices">devices</BreadcrumbsItem>
        <BreadcrumbsItem>iPhone 15 Pro Max</BreadcrumbsItem>
      </Breadcrumbs>
    ),
  },
  {
    title: "Slash separator",
    description: "Use separator=\"slash\" for narrower trails or beside a page title.",
    render: () => (
      <Breadcrumbs separator="slash">
        <BreadcrumbsItem href="/">plans</BreadcrumbsItem>
        <BreadcrumbsItem href="/plans/flex-50">flex 50</BreadcrumbsItem>
        <BreadcrumbsItem>pricing</BreadcrumbsItem>
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
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            data-slot="icon"
          >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
          </svg>
          home
        </BreadcrumbsItem>
        <BreadcrumbsItem href="/settings">settings</BreadcrumbsItem>
        <BreadcrumbsItem>profile</BreadcrumbsItem>
      </Breadcrumbs>
    ),
  },
  {
    title: "Two levels",
    description: "A short trail with a single parent.",
    render: () => (
      <Breadcrumbs>
        <BreadcrumbsItem href="/">dashboard</BreadcrumbsItem>
        <BreadcrumbsItem>billing</BreadcrumbsItem>
      </Breadcrumbs>
    ),
  },
]
