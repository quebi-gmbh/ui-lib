"use client"

import { Search, X } from "lucide-react"
import {
  Button,
  type InputProps as PrimitiveInputProps,
  SearchField as SearchFieldPrimitive,
  type SearchFieldProps as PrimitiveSearchFieldProps,
} from "react-aria-components"
import { Input, InputGroup } from "@/components/input"
import { cn } from "@/lib/utils"

/**
 * SearchField — quebi design system
 *
 * A search input built on react-aria-components, composed from the quebi
 * Input + InputGroup. A leading magnifying-glass icon and a trailing clear
 * button that appears only while the field has a value (Escape / clicking it
 * clears the field). Inherits the quebi field styling: a translucent surface
 * with a cyan-tinted border that lifts to brand teal on focus.
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
      className={cn("group/search-field block w-full", className)}
    />
  )
}

export function SearchInput(props: PrimitiveInputProps) {
  return (
    <InputGroup>
      <Search data-slot="icon" />
      <Input placeholder="Search" {...props} />
      <Button
        className={cn(
          "grid place-content-center px-3 text-quebi-fg-subtle outline-none",
          "transition-colors duration-150 hover:text-white pressed:text-white",
          "group-empty/search-field:invisible",
          "focus-visible:text-white",
        )}
      >
        <X className="size-4" />
      </Button>
    </InputGroup>
  )
}
