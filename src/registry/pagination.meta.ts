import type { ComponentMeta } from "./types"

export const paginationMeta: ComponentMeta = {
  slug: "pagination",
  name: "Pagination",
  description:
    "The pager for a page of results, and the shape to reach for: PaginationStack centres the range summary above the row of page numbers, with an optional PaginationJump — a labelled \"Go to page\" field whose bound is a message under the input rather than an empty result. Targets are links by default — a URL per page, an anchor you can middle-click — and pressable without one, so the same row serves a page that is a query parameter with no address. That callback mode is what Table Controls' TablePager renders, so a table and a page of a document number their pages the same way. Sizes match Button: xs is 30px, sm 38px and the default.",
  category: "Navigation",
  tags: ["navigation", "pagination", "pager", "links", "jump"],
}
