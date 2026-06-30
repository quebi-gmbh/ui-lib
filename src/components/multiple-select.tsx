"use client"

import { Plus } from "lucide-react"
import { Children, isValidElement, useMemo, useRef } from "react"
import {
  Autocomplete,
  Select,
  type SelectProps,
  SelectValue,
  useFilter,
} from "react-aria-components"
import { Button } from "@/components/button"
import { ListBox, ListBoxItem } from "@/components/list-box"
import { PopoverContent } from "@/components/popover"
import { SearchField, SearchInput } from "@/components/search-field"
import { Tag, TagGroup, TagList } from "@/components/tag-group"
import { cn } from "@/lib/utils"

/**
 * Multiple Select — quebi design system
 *
 * A multi-value picker: chosen options render as removable quebi tags inside a
 * cyan-hairline control, with an add button that opens a searchable list-box
 * popover. Composes Tag Group (selected values), Popover + Search Field +
 * List Box (the dropdown). Styled with quebi tokens — translucent surface,
 * cyan borders, brand-teal selection, and a quebi glow on the overlay.
 */

interface OptionBase {
  id: string | number
  name: string
}

interface MultipleSelectProps<T extends OptionBase>
  extends Omit<SelectProps<T, "multiple">, "selectionMode" | "children"> {
  placeholder?: string
  className?: string
  children?: React.ReactNode
  name?: string
}

interface MultipleSelectContentProps<T extends OptionBase> {
  items: Iterable<T>
  children: (item: T) => React.ReactNode
}

function MultipleSelectContent<T extends OptionBase>(_props: MultipleSelectContentProps<T>) {
  return null
}
;(MultipleSelectContent as unknown as { displayName: string }).displayName = "MultipleSelectContent"

function MultipleSelect<T extends OptionBase>({
  placeholder = "No selected items",
  className,
  children,
  name,
  ...props
}: MultipleSelectProps<T>) {
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const { contains } = useFilter({ sensitivity: "base" })

  const { before, after, list } = useMemo(() => {
    const arr = Children.toArray(children)
    const idx = arr.findIndex(
      (c) =>
        isValidElement(c) &&
        (c.type as unknown as { displayName?: string })?.displayName === "MultipleSelectContent",
    )
    if (idx === -1) {
      return { before: arr, after: [], list: null as null | MultipleSelectContentProps<T> }
    }
    const el = arr[idx] as React.ReactElement<MultipleSelectContentProps<T>>
    return { before: arr.slice(0, idx), after: arr.slice(idx + 1), list: el.props }
  }, [children])

  return (
    <Select
      name={name}
      data-slot="control"
      className={cn("w-full", className)}
      selectionMode="multiple"
      {...props}
    >
      {before}
      {list && (
        <>
          <div
            data-slot="control"
            ref={triggerRef}
            className={cn(
              "flex w-full items-center gap-2 rounded-quebi-sm border border-cyan-500/10 bg-white/[0.02] p-1.5",
              "transition-colors duration-150 focus-within:border-quebi-brand",
            )}
          >
            <SelectValue<T> className="flex-1">
              {({ selectedItems, state }) => (
                <TagGroup
                  aria-label="Selected items"
                  onRemove={(keys) => {
                    if (Array.isArray(state.value)) {
                      state.setValue(state.value.filter((k) => !keys.has(k)))
                    }
                  }}
                >
                  <TagList
                    items={selectedItems.filter((i) => i != null)}
                    renderEmptyState={() => (
                      <span className="ps-1.5 text-quebi-fg-subtle text-sm italic">
                        {placeholder}
                      </span>
                    )}
                  >
                    {(item) => <Tag>{item.name}</Tag>}
                  </TagList>
                </TagGroup>
              )}
            </SelectValue>
            <Button
              intent="outline"
              size="sq-xs"
              isCircle
              className="shrink-0 self-end"
              aria-label="Add item"
            >
              <Plus data-slot="icon" aria-hidden="true" />
            </Button>
          </div>
          <PopoverContent triggerRef={triggerRef} placement="bottom" className="flex w-full flex-col p-0">
            <Autocomplete filter={contains}>
              <SearchField autoFocus aria-label="Search items" className="border-b border-cyan-500/10">
                <SearchInput className="border-none bg-transparent outline-hidden focus:ring-0" />
              </SearchField>
              <ListBox
                className="rounded-none border-0 bg-transparent shadow-none"
                items={list.items}
              >
                {list.children}
              </ListBox>
            </Autocomplete>
          </PopoverContent>
        </>
      )}
      {after}
    </Select>
  )
}

const MultipleSelectItem = ListBoxItem

export { MultipleSelect, MultipleSelectContent, MultipleSelectItem }
