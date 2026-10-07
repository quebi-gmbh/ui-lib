"use client"

import { X } from "lucide-react"
import {
  Button,
  type TagGroupProps,
  type TagListProps,
  type TagProps,
  Tag as TagPrimitive,
  TagGroup as TagGroupPrimitive,
  TagList as TagListPrimitive,
  composeRenderProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * TagGroup — quebi design system
 *
 * Built on react-aria-components. Each tag is the design's Tag — a pill on the
 * raised ground in the muted ink, lowercase label — and a selected tag is
 * state, so it takes the `selected` ground, like every other selected item. Removable tags
 * expose a small remove button. Focus is the outward ring; disabled dims.
 */
export function TagGroup({ className, ...props }: TagGroupProps) {
  return (
    <TagGroupPrimitive
      data-slot="control"
      className={cn("flex flex-col gap-y-2", className)}
      {...props}
    />
  )
}

export function TagList<T extends object>({ className, ...props }: TagListProps<T>) {
  return (
    <TagListPrimitive
      className={composeRenderProps(className, (className) =>
        cn("flex flex-wrap gap-1.5", className),
      )}
      {...props}
    />
  )
}

export function Tag({ children, className, ...props }: TagProps) {
  const textValue = typeof children === "string" ? children : undefined

  return (
    <TagPrimitive
      textValue={textValue}
      data-slot="control"
      className={composeRenderProps(className, (className, { allowsRemoving, isDisabled }) =>
        cn(
          "group inline-flex cursor-default items-center gap-x-1.5 rounded-full px-3 py-1.5 text-quebi-tag",
          "bg-quebi-raised text-quebi-fg-muted",
          "transition-colors duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
          "hover:bg-quebi-pressed hover:text-quebi-fg",
          "data-[selected]:bg-quebi-selected data-[selected]:text-quebi-on-selected",
          "data-[href]:cursor-pointer",
          allowsRemoving && "pr-1.5",
          isDisabled && "cursor-not-allowed opacity-50",
          className,
        ),
      )}
      {...props}
    >
      {composeRenderProps(children, (children, { allowsRemoving }) => (
        <>
          {children}
          {allowsRemoving && (
            <Button
              slot="remove"
              className={cn(
                "-mr-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                "text-quebi-fg-subtle outline-none transition-colors duration-150",
                "hover:bg-quebi-bg hover:text-quebi-fg",
                "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-focus data-[focus-visible]:ring-offset-0",
                "group-data-[selected]:text-quebi-on-selected group-data-[selected]:hover:bg-quebi-bg group-data-[selected]:hover:text-quebi-on-selected",
              )}
            >
              <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
            </Button>
          )}
        </>
      ))}
    </TagPrimitive>
  )
}
