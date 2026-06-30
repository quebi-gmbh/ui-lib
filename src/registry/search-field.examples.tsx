import { useState } from "react"
import { SearchField, SearchInput } from "@/components/search-field"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full max-w-xs flex-col items-stretch gap-3">{children}</div>
)

export const searchFieldExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A search field with a leading icon and a clear button that appears while typing.",
    render: () => (
      <SearchField className="max-w-xs" aria-label="Search">
        <SearchInput placeholder="Search components" />
      </SearchField>
    ),
  },
  {
    title: "States",
    description: "Default, with an initial value, and disabled.",
    render: () => (
      <Col>
        <SearchField aria-label="Default">
          <SearchInput placeholder="Search" />
        </SearchField>
        <SearchField aria-label="With value" defaultValue="quebi">
          <SearchInput placeholder="Search" />
        </SearchField>
        <SearchField aria-label="Disabled" isDisabled>
          <SearchInput placeholder="Search" />
        </SearchField>
      </Col>
    ),
  },
  {
    title: "Controlled",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState("")
        return (
          <Col>
            <SearchField aria-label="Controlled" value={value} onChange={setValue}>
              <SearchInput placeholder="Type to search" />
            </SearchField>
            <p className="text-sm text-quebi-fg-muted">You searched: {value || "nothing yet"}</p>
          </Col>
        )
      }
      return <ControlledExample />
    },
  },
]
