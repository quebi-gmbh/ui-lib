import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/description-list"
import type { ComponentExample } from "./types"

export const descriptionListExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Terms in muted foreground, descriptions in white, with subtle row dividers.",
    render: () => (
      <DescriptionList>
        <DescriptionTerm>Name</DescriptionTerm>
        <DescriptionDetails>Aurelia Vance</DescriptionDetails>
        <DescriptionTerm>Email</DescriptionTerm>
        <DescriptionDetails>aurelia@quebi.de</DescriptionDetails>
        <DescriptionTerm>Role</DescriptionTerm>
        <DescriptionDetails>Platform Engineer</DescriptionDetails>
      </DescriptionList>
    ),
  },
  {
    title: "Invoice summary",
    description: "Useful for rendering structured metadata such as an order or invoice.",
    render: () => (
      <DescriptionList>
        <DescriptionTerm>Invoice</DescriptionTerm>
        <DescriptionDetails>#QB-2026-0042</DescriptionDetails>
        <DescriptionTerm>Status</DescriptionTerm>
        <DescriptionDetails>
          <span className="text-quebi-brand">Paid</span>
        </DescriptionDetails>
        <DescriptionTerm>Amount</DescriptionTerm>
        <DescriptionDetails>€1,280.00</DescriptionDetails>
        <DescriptionTerm>Issued</DescriptionTerm>
        <DescriptionDetails>June 30, 2026</DescriptionDetails>
      </DescriptionList>
    ),
  },
  {
    title: "Long descriptions",
    description: "Descriptions wrap independently of their terms.",
    render: () => (
      <DescriptionList>
        <DescriptionTerm>Project</DescriptionTerm>
        <DescriptionDetails>Quebi UI Library</DescriptionDetails>
        <DescriptionTerm>Summary</DescriptionTerm>
        <DescriptionDetails>
          A copy-paste React component library styled with the quebi design system, rendered live in
          a gallery and auto-published to a static AI-discovery API at build time.
        </DescriptionDetails>
      </DescriptionList>
    ),
  },
]
