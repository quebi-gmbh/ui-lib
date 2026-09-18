"use client"

import { Check, Loader2, X } from "lucide-react"
import {
  Children,
  isValidElement,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { type Key, useFilter } from "react-aria-components"
import { PopoverContent } from "@/components/popover"
import { cn } from "@/lib/utils"

/**
 * Multiple Select — quebi design system
 *
 * A tokenizer combobox over a local option list: chosen options render as
 * removable chips *inline* with a single text input, the input is the one
 * focus/click target, typing filters the list, and the results are a non-modal
 * popover navigated with `aria-activedescendant` so focus never leaves the
 * field.
 *
 * That is the same control Async Multiple Select draws, and it is the same
 * code: `MultiSelectControl` below is the shared part, and the two components
 * are two assemblies of it that differ only in who supplies the options — a
 * local collection here, a remote `load` there. Nothing else should choose
 * between them, the way `DataTable` and `ServerTable` differ only in who owns
 * the query.
 *
 * Before task #157 this control was a different shape: a tag list plus a `+`
 * button opening a *modal* popover with its own search box. Every guard in it
 * existed because that popover took focus and handed it back — "open on focus"
 * had to tell a real arrival from the overlay's focus restore, and removing a
 * tag had to be told apart from focus shuffling inside the box. An inline input
 * has nowhere to hand focus to, so none of those questions come up and none of
 * those guards are here. The `+` is gone with them: the input is the trigger.
 */

/** The minimum an option must carry: a key and a label for its chip. */
export interface MultiSelectOption {
  id: string | number
  name: string
}

/** The DOM/selection key of an option. Ids may be numbers; keys are strings. */
export const multiSelectKey = (option: MultiSelectOption) => String(option.id)

export interface MultiSelectControlProps<T extends MultiSelectOption> {
  /** The options to offer right now — already filtered or paged by the caller. */
  options: T[]
  /** The current selection, as full options so chips stay labelled. */
  selected: T[]
  /** Clicking or pressing Enter on an option, selected or not. */
  onToggle: (option: T) => void
  /** The chip's ✕, or Backspace on an empty input. */
  onRemove: (option: T) => void
  /** The text in the input. The caller decides what it does with it. */
  search: string
  onSearchChange: (search: string) => void
  /** The body of an option row, beside its check mark. Defaults to `name`. */
  renderOption?: (option: T) => ReactNode
  /** Shows the spinner in place of the (empty) list. */
  isLoading?: boolean
  /** Shows a spinner under the list while the next page arrives. */
  isLoadingMore?: boolean
  /** Called when the results are scrolled near the bottom. */
  onLoadMore?: () => void
  /** Shown when there are no options and nothing is loading. */
  emptyMessage?: string
  placeholder?: string
  isDisabled?: boolean
  isInvalid?: boolean
  isRequired?: boolean
  /** When set, the selection is mirrored into hidden inputs for form submission. */
  name?: string
  /** The `<form>` to associate the hidden inputs with, by id. */
  form?: string
  className?: string
  /** Lands on the input — so a `<Label htmlFor>` points at the real control. */
  id?: string
  /**
   * The control's accessible name. Leave it off when a `<Label htmlFor>` names
   * the input — an `aria-label` would win over it and hide the visible text
   * from assistive technology.
   */
  "aria-label"?: string
  /** ids of the elements describing this control — a hint, an error message. */
  "aria-describedby"?: string
}

/**
 * The control both multi-value pickers draw: chips + input in one box, and the
 * results listbox under it.
 *
 * It owns the open state, the keyboard, the virtual focus and the DOM; it owns
 * no data. Where the options come from, what the search text does to them, and
 * what the selection is are all the caller's, which is the seam that lets the
 * local and the remote picker be the same control.
 */
export function MultiSelectControl<T extends MultiSelectOption>({
  options,
  selected,
  onToggle,
  onRemove,
  search,
  onSearchChange,
  renderOption,
  isLoading,
  isLoadingMore,
  onLoadMore,
  emptyMessage = "No results",
  placeholder = "Select…",
  isDisabled,
  isInvalid,
  isRequired,
  name,
  form,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: MultiSelectControlProps<T>) {
  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const optionId = (key: string) => `${reactId}-opt-${key}`

  const containerRef = useRef<HTMLDivElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const selectedKeys = useMemo(() => new Set(selected.map(multiSelectKey)), [selected])

  const openMenu = () => {
    if (!isDisabled) setOpen(true)
  }

  const closeMenu = () => {
    setOpen(false)
    setActiveKey(null)
  }

  // Keep the keyboard-highlighted option valid as the list filters/paginates.
  useEffect(() => {
    if (!open) return
    if (options.length === 0) {
      setActiveKey(null)
      return
    }
    setActiveKey((prev) =>
      prev && options.some((option) => multiSelectKey(option) === prev)
        ? prev
        : multiSelectKey(options[0]),
    )
  }, [open, options])

  // Scroll the active option into view during keyboard navigation.
  useEffect(() => {
    if (!open || !activeKey) return
    document.getElementById(`${reactId}-opt-${activeKey}`)?.scrollIntoView({ block: "nearest" })
  }, [activeKey, open, reactId])

  // Close on outside press. The popover is non-modal (so focus stays in the
  // input), which means react-aria's usePopover runs with isDismissable=false
  // and won't dismiss on outside interaction — so we own that here. Capture
  // phase runs before any child handler that might stop propagation.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (containerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
      setActiveKey(null)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => document.removeEventListener("pointerdown", onPointerDown, true)
  }, [open])

  const moveActive = (dir: 1 | -1) => {
    if (options.length === 0) return
    const idx = activeKey ? options.findIndex((o) => multiSelectKey(o) === activeKey) : -1
    const nextIdx =
      idx === -1 ? (dir === 1 ? 0 : options.length - 1) : (idx + dir + options.length) % options.length
    setActiveKey(multiSelectKey(options[nextIdx]))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (open) moveActive(1)
        else openMenu()
        break
      case "ArrowUp":
        e.preventDefault()
        if (open) moveActive(-1)
        else openMenu()
        break
      case "Enter": {
        if (!open || !activeKey) break
        const active = options.find((o) => multiSelectKey(o) === activeKey)
        if (!active) break
        e.preventDefault()
        onToggle(active)
        break
      }
      case "Escape":
        if (open) {
          e.preventDefault()
          closeMenu()
        }
        break
      case "Backspace":
        if (search === "" && selected.length > 0) {
          e.preventDefault()
          onRemove(selected[selected.length - 1])
        }
        break
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore) return
    const el = e.currentTarget
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceToBottom < 60 && options.length > 0 && !isLoading && !isLoadingMore) onLoadMore()
  }

  return (
    <div className={cn("w-full", className)}>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: the control surface forwards bare-surface and chip-body clicks to the combobox input; all real semantics live on the input/options */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          // The whole box is the way in (task #116): a press on the padding or
          // on a chip's label puts focus in the input and opens the list. A
          // press on the input, or on a chip's ✕, is that control's own
          // business — opening underneath them is the double-fire to avoid.
          if (isDisabled) return
          const target = e.target
          if (target instanceof Element && target.closest("button, input")) return
          e.preventDefault()
          inputRef.current?.focus()
          openMenu()
        }}
        data-invalid={isInvalid || undefined}
        className={cn(
          "flex w-full flex-wrap items-center gap-1.5 rounded-quebi-sm border border-quebi-line/10 bg-quebi-surface/[0.02] p-1.5",
          "transition-[border-color,box-shadow] duration-150 focus-within:border-quebi-brand-mark",
          "focus-within:ring-2 focus-within:ring-quebi-brand-mark focus-within:ring-offset-2 focus-within:ring-offset-quebi-bg",
          isInvalid && "border-red-500",
          isDisabled ? "cursor-not-allowed opacity-50" : "cursor-text",
        )}
      >
        {selected.map((item) => {
          const k = multiSelectKey(item)
          return (
            <span
              key={k}
              data-slot="chip"
              className="inline-flex items-center gap-x-1 rounded-full border border-quebi-line/10 bg-quebi-surface/[0.03] py-0.5 pe-1 ps-2.5 font-medium text-quebi-fg-muted text-xs"
            >
              {item.name}
              {!isDisabled && (
                // biome-ignore lint/correctness/noRestrictedElements: as in async-select — onMouseDown preventDefault holds focus on the input and stopPropagation stops chip removal reopening the listbox; onPress is neither DOM event.
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  tabIndex={-1}
                  // Keep focus in the input so removing a chip never opens/closes
                  // the menu or blurs the field.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(item)
                  }}
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full text-quebi-fg-subtle outline-none transition-colors duration-150",
                    "hover:bg-cyan-500/10 hover:text-quebi-fg focus-visible:ring-2 focus-visible:ring-quebi-brand-mark",
                  )}
                >
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                </button>
              )}
            </span>
          )
        })}

        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && activeKey ? optionId(activeKey) : undefined}
          aria-label={ariaLabel}
          aria-invalid={isInvalid || undefined}
          aria-required={isRequired || undefined}
          aria-describedby={ariaDescribedBy}
          disabled={isDisabled}
          value={search}
          placeholder={selected.length === 0 ? placeholder : undefined}
          onChange={(e) => {
            onSearchChange(e.target.value)
            openMenu()
          }}
          onFocus={openMenu}
          onClick={openMenu}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-w-24 flex-1 bg-transparent px-1.5 py-0.5 text-sm text-quebi-fg outline-none",
            "placeholder:text-quebi-fg-subtle placeholder:italic",
          )}
        />
      </div>

      <PopoverContent
        ref={popoverRef}
        triggerRef={containerRef}
        isOpen={open && !isDisabled}
        onOpenChange={(next) => {
          if (!next) closeMenu()
        }}
        isNonModal
        placement="bottom start"
        className="w-(--trigger-width) p-0"
      >
        <div
          role="listbox"
          id={listboxId}
          aria-multiselectable="true"
          aria-label={ariaLabel ?? "Options"}
          onScroll={handleScroll}
          className="quebi-scrollbar max-h-72 overflow-y-auto overscroll-contain p-1"
        >
          {options.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-6 text-quebi-fg-subtle text-sm">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading…
                </>
              ) : (
                emptyMessage
              )}
            </div>
          ) : (
            options.map((item) => {
              const k = multiSelectKey(item)
              const isSel = selectedKeys.has(k)
              const isActive = activeKey === k
              return (
                // biome-ignore lint/a11y/useFocusableInteractive: options use virtual focus via the combobox input's aria-activedescendant
                // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard is handled centrally on the combobox input (Enter toggles the active option)
                <div
                  key={k}
                  id={optionId(k)}
                  role="option"
                  aria-selected={isSel}
                  // Keep focus in the input while clicking an option.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveKey(k)}
                  onClick={() => onToggle(item)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-quebi-sm px-2.5 py-1.5 text-sm text-quebi-fg outline-none transition-colors duration-150",
                    isActive && "bg-quebi-surface/[0.05]",
                    isSel && "text-quebi-brand-text",
                  )}
                >
                  <Check
                    className={cn("size-4 shrink-0", isSel ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  {renderOption ? (
                    renderOption(item)
                  ) : (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                </div>
              )
            })
          )}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="size-4 animate-spin text-quebi-fg-subtle" aria-hidden="true" />
            </div>
          )}
        </div>
      </PopoverContent>

      {name &&
        selected.map((item) => (
          <input
            key={multiSelectKey(item)}
            type="hidden"
            name={name}
            form={form}
            value={multiSelectKey(item)}
          />
        ))}
    </div>
  )
}

/**
 * The props are the option-independent half of the control: the selection is
 * ids (`Key[]`), not option objects, so this interface carries no item type —
 * the items themselves arrive through `<MultipleSelectContent>`.
 */
interface MultipleSelectProps {
  /** Controlled selection, as the ids of the chosen options. */
  value?: Key[]
  /** Uncontrolled initial selection. */
  defaultValue?: Key[]
  onChange?: (value: Key[]) => void
  placeholder?: string
  isDisabled?: boolean
  isInvalid?: boolean
  isRequired?: boolean
  /** When set, the selection is mirrored into hidden inputs for form submission. */
  name?: string
  /** The `<form>` to associate the hidden inputs with, by id. */
  form?: string
  /** Lands on the input — so a `<Label htmlFor>` points at the real control. */
  id?: string
  className?: string
  /** A `<MultipleSelectContent>` holding the options; anything else is rendered around the control. */
  children?: ReactNode
  "aria-label"?: string
  /** ids of the elements describing this control — a hint, an error message. */
  "aria-describedby"?: string
}

interface MultipleSelectContentProps<T extends MultiSelectOption> {
  items: Iterable<T>
  children: (item: T) => ReactNode
}

/**
 * The option list, as data. Renders nothing itself: `MultipleSelect` reads its
 * `items` and its render function and draws the rows, so the selection key and
 * the chip labels can come from the same collection.
 */
function MultipleSelectContent<T extends MultiSelectOption>(_props: MultipleSelectContentProps<T>) {
  return null
}
;(MultipleSelectContent as unknown as { displayName: string }).displayName = "MultipleSelectContent"

interface MultipleSelectItemProps {
  /** The selection key, when it is not the option's own `id`. */
  id?: Key
  /** The text the search filters on, when the row is not plain text. */
  textValue?: string
  className?: string
  children?: ReactNode
}

/**
 * One option row's body. It is a label, not a list-box item: the row around it
 * — the check mark, the virtual-focus id, the press handling — belongs to the
 * control, so this renders only what the consumer wrote inside it.
 */
function MultipleSelectItem({ className, children }: MultipleSelectItemProps) {
  return <span className={cn("flex-1 truncate", className)}>{children}</span>
}

/** One option: the row the consumer rendered, plus the key and text it implies. */
interface Entry<T extends MultiSelectOption> {
  option: T
  node: ReactNode
  text: string
}

function MultipleSelect<T extends MultiSelectOption>({
  value,
  defaultValue,
  onChange,
  placeholder,
  isDisabled,
  isInvalid,
  isRequired,
  name,
  form,
  id,
  className,
  children,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: MultipleSelectProps) {
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

  // Each option is rendered once, here, so that an `id` or `textValue` written
  // on a MultipleSelectItem still decides the selection key and what the search
  // matches — as it did when the row was a react-aria ListBoxItem.
  const entries = useMemo<Entry<T>[]>(() => {
    if (!list) return []
    return Array.from(list.items, (item) => {
      const node = list.children(item)
      const props = isValidElement<MultipleSelectItemProps>(node) ? node.props : undefined
      const option =
        props?.id != null && props.id !== item.id ? ({ ...item, id: props.id } as T) : item
      return { option, node, text: props?.textValue ?? item.name }
    })
  }, [list])

  const [internal, setInternal] = useState<Key[]>(() => defaultValue ?? [])
  const selectedKeys = value ?? internal

  const commit = (next: Key[]) => {
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }

  const [search, setSearch] = useState("")
  const { contains } = useFilter({ sensitivity: "base" })

  const options = useMemo(
    () =>
      (search === "" ? entries : entries.filter((entry) => contains(entry.text, search))).map(
        (entry) => entry.option,
      ),
    [entries, search, contains],
  )

  // Chips are drawn from the collection, so a selected key that is no longer an
  // option still shows — as itself, rather than vanishing from the field.
  const selected = useMemo(
    () =>
      selectedKeys.map((key) => {
        const match = entries.find((entry) => multiSelectKey(entry.option) === String(key))
        return match ? match.option : ({ id: key, name: String(key) } as T)
      }),
    [entries, selectedKeys],
  )

  const nodeFor = (option: T) =>
    entries.find((entry) => multiSelectKey(entry.option) === multiSelectKey(option))?.node

  const remove = (option: T) =>
    commit(selectedKeys.filter((key) => String(key) !== multiSelectKey(option)))

  const toggle = (option: T) => {
    const key = multiSelectKey(option)
    if (selectedKeys.some((k) => String(k) === key)) remove(option)
    else commit([...selectedKeys, option.id])
  }

  return (
    <div className={cn("w-full", className)}>
      {before}
      <MultiSelectControl<T>
        options={options}
        selected={selected}
        onToggle={toggle}
        onRemove={remove}
        search={search}
        onSearchChange={setSearch}
        renderOption={(option) => nodeFor(option) ?? option.name}
        emptyMessage="No results"
        placeholder={placeholder}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isRequired={isRequired}
        name={name}
        form={form}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
      {after}
    </div>
  )
}

export type { MultipleSelectProps, MultipleSelectContentProps, MultipleSelectItemProps }
export { MultipleSelect, MultipleSelectContent, MultipleSelectItem }
