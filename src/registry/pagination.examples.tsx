import { useState } from "react"
import {
  Pagination,
  PaginationFirst,
  PaginationGap,
  PaginationInfo,
  PaginationItem,
  PaginationJump,
  PaginationLast,
  PaginationList,
  PaginationNext,
  PaginationPlaceholder,
  PaginationPrevious,
  PaginationStack,
} from "@/components/pagination"
import { pageItems, pageRange } from "@/lib/data-table"
import type { ComponentExample } from "./types"

const PAGE_SIZE = 20
const TOTAL = 248

/**
 * The canonical pager: the range summary above the numbers, the page window
 * computed rather than hand-written, and every target a callback because this
 * page has no URL per page to offer. Swap `onPress` for `href` and the same
 * markup is the link-based pager.
 *
 * Three kinds of item come out of `pageItems`, and drawing only two of them is
 * the bug this shape exists to avoid: a window is short at either end of the
 * range, so a row that skipped the held slots would be four items wide on page
 * 1 and seven in the middle, and — being centred — would shift under the
 * reader on the press that moved it.
 */
function CanonicalPager({ withJump }: { withJump?: boolean }) {
  const [page, setPage] = useState(1)
  const rowsOnPage = Math.min(PAGE_SIZE, TOTAL - page * PAGE_SIZE)
  const range = pageRange(page, PAGE_SIZE, rowsOnPage, TOTAL, undefined)
  const pageCount = range.pageCount ?? 1

  return (
    <PaginationStack>
      <PaginationInfo>
        Showing{" "}
        <strong>
          {range.from}–{range.to}
        </strong>{" "}
        of <strong>{range.total}</strong> results
      </PaginationInfo>
      <Pagination>
        <PaginationList>
          <PaginationFirst onPress={range.hasPrevious ? () => setPage(0) : undefined} />
          <PaginationPrevious onPress={range.hasPrevious ? () => setPage(page - 1) : undefined} />
          {pageItems(page, range.pageCount).map((item, index) => {
            // A gap and a held slot have no identity of their own — a position
            // in the window is all either of them is.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above.
            if (item === "gap") return <PaginationGap key={`gap-${index}`} />
            // biome-ignore lint/suspicious/noArrayIndexKey: see above.
            if (item === "placeholder") return <PaginationPlaceholder key={`hold-${index}`} />
            return (
              <PaginationItem
                key={item}
                isCurrent={item === page}
                onPress={() => setPage(item)}
              >
                {item + 1}
              </PaginationItem>
            )
          })}
          <PaginationNext onPress={range.hasNext ? () => setPage(page + 1) : undefined} />
          <PaginationLast
            onPress={range.hasNext ? () => setPage(pageCount - 1) : undefined}
          />
        </PaginationList>
      </Pagination>
      {withJump && (
        <PaginationJump
          page={page + 1}
          pageCount={pageCount}
          onJump={(next) => setPage(next - 1)}
        />
      )}
    </PaginationStack>
  )
}

export const paginationExamples: ComponentExample[] = [
  {
    title: "With result info",
    description:
      "The canonical pager: the range summary above the page numbers, centred. PaginationStack is the column; pageItems() from @/lib/data-table picks the window, where the gaps fall, and which slots are held open by a PaginationPlaceholder so the row is the same width on every page. Every target is a callback here, so the page is a query parameter rather than an address.",
    render: () => <CanonicalPager />,
  },
  {
    title: "With result info and jump",
    description:
      "The same column with a PaginationJump under it. The field follows the page you are on, and a page past the end is a message under the input instead of an empty result.",
    render: () => <CanonicalPager withJump />,
  },
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
    title: "Compact",
    description:
      "size=\"xs\" drops every target to 30px, matching Button's xs — for a pager that sits in a toolbar rather than under a page of results.",
    render: () => (
      <Pagination size="xs">
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
    ),
  },
]
