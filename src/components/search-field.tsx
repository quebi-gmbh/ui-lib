"use client"

import { Search, X } from "lucide-react"
import {
  Button,
  composeRenderProps,
  SearchField as SearchFieldPrimitive,
  type SearchFieldProps as PrimitiveSearchFieldProps,
} from "react-aria-components"
import { Input, InputGroup } from "@/components/input"
import { cn } from "@/lib/utils"
import { fieldStyles } from "@/components/field"

/**
 * SearchField — quebi design system
 *
 * A search input built on react-aria-components, composed from the quebi
 * Input + InputGroup. A leading magnifying-glass icon and a trailing clear
 * button that appears only while the field has a value (Escape / clicking it
 * clears the field). Inherits `Input`'s frame — boxed by default, an
 * underline inside `quebi-editorial` — on the `raised` ground the design gives
 * a search box where fields are boxed.
 */
export interface SearchFieldProps extends PrimitiveSearchFieldProps {
  ref?: React.RefObject<HTMLDivElement>
}

export function SearchField({ className, ref, ...props }: SearchFieldProps) {
  return (
    <SearchFieldPrimitive
      ref={ref}
      data-slot="control"
      {...props}
      aria-label={props["aria-label"] ?? "Search"}
      className={composeRenderProps(className, (resolved) =>
        cn("group/search-field block", fieldStyles, resolved),
      )}
    />
  )
}

/** The input half of a SearchField. Takes `Input`'s props, including `size`. */
export function SearchInput(props: React.ComponentProps<typeof Input>) {
  return (
    // The search box sits on `raised` where fields are boxed; `--q-field-boxed`
    // is 0 inside `quebi-editorial`, so an underlined one keeps no ground.
    <InputGroup className="[--q-field-bg:color-mix(in_srgb,var(--q-raised)_calc(var(--q-field-boxed)*100%),transparent)]">
      <Search data-slot="icon" />
      <Input placeholder="Search" {...props} />
      <Button
        className={cn(
          "flex items-center justify-end ps-3 pe-(--q-field-px) text-quebi-fg-subtle outline-none",
          "transition-colors duration-150 hover:text-quebi-fg pressed:text-quebi-fg",
          "group-empty/search-field:invisible",
          "focus-visible:text-quebi-fg",
        )}
      >
        <X className="size-4" />
      </Button>
    </InputGroup>
  )
}
