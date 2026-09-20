import {
  Pagination,
  PaginationInfo,
  PaginationItem,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
  PaginationStack,
} from "@/components/pagination"
import type { OgScene } from "./types"

/** The range summary above the window of pages, on page three of nine. */
export const paginationOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <PaginationStack>
      <PaginationInfo>
        Showing <strong>41–60</strong> of <strong>174</strong> results
      </PaginationInfo>
      <Pagination>
        <PaginationList>
          <PaginationPrevious />
          <PaginationItem>1</PaginationItem>
          <PaginationItem>2</PaginationItem>
          <PaginationItem isCurrent>3</PaginationItem>
          <PaginationItem>4</PaginationItem>
          <PaginationItem>5</PaginationItem>
          <PaginationNext />
        </PaginationList>
      </Pagination>
    </PaginationStack>
  ),
}
