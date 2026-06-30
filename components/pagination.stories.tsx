import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
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
} from "./pagination"

/**
 * Pagination — admin listing navigation.
 *
 * Not a button row. Page numbers are compact, 32px targets with `rounded-xs`
 * and ink tokens only — the current page reverses to ink-900/white so the
 * user's location reads at a glance. First / Previous / Next / Last are
 * 32px square outlined navigation controls; disabled states lose their hover
 * affordance and dim to ink-300.
 */

const meta = {
  title: "Cellestial DS/Components/Pagination",
  component: Pagination,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

function buildPages(current: number, total: number): { key: string; value: number | "ellipsis" }[] {
  if (total === 0) return []
  const mark = (nums: (number | "ellipsis")[]) => {
    let gap = 0
    return nums.map((n) => {
      if (n === "ellipsis") {
        gap++
        return { key: `gap-${gap}`, value: n as "ellipsis" }
      }
      return { key: `p-${n}`, value: n }
    })
  }
  if (total <= 7) return mark(Array.from({ length: total }, (_, i) => i + 1))
  if (current <= 3) return mark([1, 2, 3, 4, "ellipsis", total])
  if (current >= total - 2) return mark([1, "ellipsis", total - 3, total - 2, total - 1, total])
  return mark([1, "ellipsis", current - 1, current, current + 1, "ellipsis", total])
}

function Demo({ total = 12, start = 4 }: { total?: number; start?: number }) {
  const [page, setPage] = useState(start)
  const canBack = page > 1
  const canForward = page < total
  const navHref = (target: number) => `#page-${target}`
  return (
    <div className="flex flex-col items-center gap-3">
      <Pagination>
        <PaginationList>
          <PaginationFirst
            href={canBack ? navHref(1) : undefined}
            onPress={canBack ? () => setPage(1) : undefined}
          />
          <PaginationPrevious
            href={canBack ? navHref(page - 1) : undefined}
            onPress={canBack ? () => setPage(page - 1) : undefined}
          />
          {buildPages(page, total).map((item) =>
            item.value === "ellipsis" ? (
              <PaginationGap key={item.key} />
            ) : (
              <PaginationItem
                key={item.key}
                href={navHref(item.value as number)}
                isCurrent={item.value === page}
                onPress={() => setPage(item.value as number)}
              >
                {item.value}
              </PaginationItem>
            ),
          )}
          <PaginationNext
            href={canForward ? navHref(page + 1) : undefined}
            onPress={canForward ? () => setPage(page + 1) : undefined}
          />
          <PaginationLast
            href={canForward ? navHref(total) : undefined}
            onPress={canForward ? () => setPage(total) : undefined}
          />
        </PaginationList>
      </Pagination>
      <PaginationInfo>
        Page <strong>{page}</strong> of <strong>{total}</strong>
      </PaginationInfo>
    </div>
  )
}

export const Default: Story = {
  render: () => <Demo total={12} start={4} />,
}

export const AtStart: Story = {
  render: () => <Demo total={12} start={1} />,
}

export const AtEnd: Story = {
  render: () => <Demo total={12} start={12} />,
}

export const FewPages: Story = {
  render: () => <Demo total={3} start={2} />,
}

export const SinglePage: Story = {
  render: () => <Demo total={1} start={1} />,
}
