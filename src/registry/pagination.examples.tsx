import {
  Pagination,
  PaginationFirst,
  PaginationGap,
  PaginationInfo,
  PaginationItem,
  PaginationLast,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@/components/pagination"
import type { ComponentExample } from "./types"

export const paginationExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "Prev/next controls wrapping a row of page numbers. Page 3 is active.",
    render: () => (
      <Pagination>
        <PaginationList>
          <PaginationPrevious href="#" />
          <PaginationItem href="#">1</PaginationItem>
          <PaginationItem href="#">2</PaginationItem>
          <PaginationItem href="#" isCurrent>
            3
          </PaginationItem>
          <PaginationItem href="#">4</PaginationItem>
          <PaginationItem href="#">5</PaginationItem>
          <PaginationNext href="#" />
        </PaginationList>
      </Pagination>
    ),
  },
  {
    title: "With gaps",
    description: "Truncated ranges use a gap. First/last jump controls bracket the row.",
    render: () => (
      <Pagination>
        <PaginationList>
          <PaginationFirst href="#" />
          <PaginationPrevious href="#" />
          <PaginationItem href="#">1</PaginationItem>
          <PaginationGap />
          <PaginationItem href="#">7</PaginationItem>
          <PaginationItem href="#" isCurrent>
            8
          </PaginationItem>
          <PaginationItem href="#">9</PaginationItem>
          <PaginationGap />
          <PaginationItem href="#">24</PaginationItem>
          <PaginationNext href="#" />
          <PaginationLast href="#" />
        </PaginationList>
      </Pagination>
    ),
  },
  {
    title: "Disabled edges",
    description: "On the first page, the first/prev controls render as disabled (no href).",
    render: () => (
      <Pagination>
        <PaginationList>
          <PaginationFirst />
          <PaginationPrevious />
          <PaginationItem href="#" isCurrent>
            1
          </PaginationItem>
          <PaginationItem href="#">2</PaginationItem>
          <PaginationItem href="#">3</PaginationItem>
          <PaginationNext href="#" />
          <PaginationLast href="#" />
        </PaginationList>
      </Pagination>
    ),
  },
  {
    title: "With result info",
    description: "Pair the pager with a summary of the current range.",
    render: () => (
      <div className="flex w-full flex-col items-center gap-3">
        <PaginationInfo>
          Showing <strong>21–40</strong> of <strong>248</strong> results
        </PaginationInfo>
        <Pagination>
          <PaginationList>
            <PaginationPrevious href="#" />
            <PaginationItem href="#">1</PaginationItem>
            <PaginationItem href="#" isCurrent>
              2
            </PaginationItem>
            <PaginationItem href="#">3</PaginationItem>
            <PaginationNext href="#" />
          </PaginationList>
        </Pagination>
      </div>
    ),
  },
]
