"use client"

import { Plus } from "lucide-react"
import { Children, isValidElement, useContext, useMemo, useRef } from "react"
import {
  Autocomplete,
  Select,
  type SelectProps,
  SelectStateContext,
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
 *
 * The whole control box is the trigger — clicking it, or tabbing into it, or
 * pressing ArrowDown/Enter/Space on it opens the dropdown, the way Async
 * Multiple Select's inline input does. The `+` button stays as the affordance
 * and as the element that carries `aria-haspopup`, but it is no longer the only
 * way in. Removing a tag never opens the menu.
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

interface MultipleSelectControlProps<T extends OptionBase> extends MultipleSelectContentProps<T> {
  placeholder: string
  isDisabled?: boolean
}

/**
 * The control box and the popover it anchors, split out so it can sit *inside*
 * `<Select>` and read `SelectStateContext`.
 *
 * That split is the whole fix: react-aria hands the open state to the trigger
 * `Button` and to nothing else, so a box built out of a div plus removable tags
 * (which cannot live inside a button) had no way to open itself. Reading the
 * state here gives the div the same `open()` the button has.
 */
function MultipleSelectControl<T extends OptionBase>({
  placeholder,
  isDisabled,
  items,
  children,
}: MultipleSelectControlProps<T>) {
  const state = useContext(SelectStateContext)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const hasFocusWithin = useRef(false)
  const { contains } = useFilter({ sensitivity: "base" })

  /**
   * Whether an event inside the box belongs to the box rather than to a control
   * within it. The two buttons in here — the `+` and a tag's ✕ — run their own
   * press and key handling, and opening underneath them is exactly the
   * double-fire to avoid: the `+` *toggles*, so an open from the box would be
   * undone by the button's own press, and removing a tag would open a menu
   * nobody asked for.
   */
  const isBoxItself = (target: EventTarget | null) =>
    !(target instanceof Element) || target.closest("button") === null

  const open = () => {
    if (!isDisabled) state?.open()
  }

  return (
    <>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: the box forwards its own presses, focus and keys to the select state; the announced trigger is still the `+` button, which carries aria-haspopup/aria-expanded */}
      <div
        data-slot="control"
        ref={triggerRef}
        onPointerDown={(e) => {
          if (isBoxItself(e.target)) open()
        }}
        onFocus={(e) => {
          // Only the user *arriving* at the field opens it. Three focus events
          // look like an arrival and are not, and each of them is a menu
          // opening on its own:
          //
          //  - focus was already somewhere in the box, or came from inside it.
          //    Removing a tag is this: react-aria moves focus from the ✕ onto a
          //    neighbouring tag, and when the tag focus came from is the one
          //    that was just removed there is no `relatedTarget` left to say so
          //    — hence the latch as well as the check.
          //  - the popover is still mounted, so this is react-aria's overlay
          //    focus scope restoring focus to the box as the overlay closes.
          //    Read as an arrival it re-opens the menu the user just dismissed,
          //    on every Escape and every click outside.
          //  - the target is one of the box's own buttons; see `isBoxItself`.
          const wasWithin = hasFocusWithin.current
          hasFocusWithin.current = true
          const from = e.relatedTarget as Node | null
          if (wasWithin || (from && triggerRef.current?.contains(from))) return
          if (popoverRef.current) return
          if (isBoxItself(e.target)) open()
        }}
        onBlur={(e) => {
          hasFocusWithin.current =
            e.relatedTarget instanceof Node && !!triggerRef.current?.contains(e.relatedTarget)
        }}
        onKeyDown={(e) => {
          // The tag list owns the arrow keys whenever it has tags to walk, and
          // says so by preventing the default; only the keys it left alone open
          // the menu.
          if (e.defaultPrevented || !isBoxItself(e.target)) return
          if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            open()
          }
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-quebi-sm border border-quebi-line/10 bg-quebi-surface/[0.02] p-1.5",
          "transition-colors duration-150 focus-within:border-quebi-brand-mark",
          isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        )}
      >
        <SelectValue<T> className="flex-1">
          {({ selectedItems, state: selectState }) => (
            <TagGroup
              aria-label="Selected items"
              onRemove={(keys) => {
                if (Array.isArray(selectState.value)) {
                  selectState.setValue(selectState.value.filter((k) => !keys.has(k)))
                }
              }}
            >
              <TagList
                items={selectedItems.filter((i) => i != null)}
                renderEmptyState={() => (
                  <span className="ps-1.5 text-quebi-fg-subtle text-sm italic">{placeholder}</span>
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
      <PopoverContent
        ref={popoverRef}
        triggerRef={triggerRef}
        placement="bottom"
        className="flex w-full flex-col p-0"
      >
        <Autocomplete filter={contains}>
          <SearchField
            autoFocus
            aria-label="Search items"
            className="border-b border-quebi-line/10"
          >
            <SearchInput className="border-none bg-transparent outline-hidden focus:ring-0" />
          </SearchField>
          <ListBox
            className="rounded-none border-0 bg-transparent shadow-none"
            items={items}
          >
            {children}
          </ListBox>
        </Autocomplete>
      </PopoverContent>
    </>
  )
}

function MultipleSelect<T extends OptionBase>({
  placeholder = "No selected items",
  className,
  children,
  name,
  ...props
}: MultipleSelectProps<T>) {
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
        <MultipleSelectControl<T>
          placeholder={placeholder}
          isDisabled={props.isDisabled}
          items={list.items}
        >
          {list.children}
        </MultipleSelectControl>
      )}
      {after}
    </Select>
  )
}

const MultipleSelectItem = ListBoxItem

export { MultipleSelect, MultipleSelectContent, MultipleSelectItem }
