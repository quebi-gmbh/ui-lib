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
 * Built on react-aria-components. Tags are hairline cyan-tinted pills; the
 * selected state fills with brand teal. Removable tags expose a small remove
 * button. Focus uses the quebi teal ring; disabled dims.
 */
export function TagGroup({ className, ...props }: TagGroupProps) {
  return (
    <TagGroupPrimitive
      data-slot="control"
      className={cn("flex flex-col gap-y-1.5 *:data-[slot=label]:font-medium", className)}
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
          "inline-flex cursor-default items-center gap-x-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          "border-cyan-500/10 bg-transparent text-quebi-fg-muted",
          "transition-colors duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
          "hover:border-cyan-500/20",
          "data-[selected]:border-quebi-brand data-[selected]:bg-quebi-brand data-[selected]:text-quebi-bg",
          "data-[href]:cursor-pointer",
          allowsRemoving && "pr-1",
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
                "hover:bg-cyan-500/10 hover:text-white",
                "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50",
                "group-data-[selected]:text-quebi-bg/70 group-data-[selected]:hover:bg-quebi-bg/20 group-data-[selected]:hover:text-quebi-bg",
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
