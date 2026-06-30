"use client"

import type { GridListItemProps, GridListProps, TextProps } from "react-aria-components"
import {
  Button,
  composeRenderProps,
  GridListHeader as GridListHeaderPrimitive,
  GridListItem as GridListItemPrimitive,
  GridList as GridListPrimitive,
  GridListSection as GridListSectionPrimitive,
  Text,
} from "react-aria-components"
import { Checkbox } from "@/components/checkbox"
import { cn } from "@/lib/utils"

/**
 * GridList — quebi design system
 *
 * Built on react-aria-components. A keyboard-navigable, selectable list with
 * optional drag handles and per-row checkboxes. Rows carry the signature
 * cyan-tinted border; selected/hovered/focused rows fill with brand teal at
 * 10% and lift their ring to the brand color.
 */
const GridList = <T extends object>({ className, ...props }: GridListProps<T>) => (
  <GridListPrimitive
    data-slot="grid-list"
    className={cn(
      "relative flex flex-col gap-y-1 sm:text-sm/6",
      "*:data-[drop-target]:border *:data-[drop-target]:border-quebi-brand",
      "has-data-[slot=grid-list-section]:gap-y-6",
      className,
    )}
    {...props}
  />
)

const GridListSection = <T extends object>({
  className,
  ...props
}: React.ComponentProps<typeof GridListSectionPrimitive<T>>) => {
  return (
    <GridListSectionPrimitive
      data-slot="grid-list-section"
      className={cn("space-y-1", className)}
      {...props}
    />
  )
}

const GridListHeader = ({
  className,
  ...props
}: React.ComponentProps<typeof GridListHeaderPrimitive>) => {
  return (
    <GridListHeaderPrimitive
      data-slot="grid-list-header"
      className={cn("mb-2 font-semibold text-sm/6 text-quebi-fg-muted", className)}
      {...props}
    />
  )
}

const GridListItem = ({ className, children, ...props }: GridListItemProps) => {
  const textValue = typeof children === "string" ? children : undefined
  return (
    <GridListItemPrimitive
      textValue={textValue}
      {...props}
      className={composeRenderProps(
        className,
        (className, { isHovered, isFocusVisible, isSelected, isDisabled }) =>
          cn(
            "group relative min-w-0 outline-hidden",
            "rounded-quebi-sm border border-cyan-500/10 px-3 py-2.5",
            "flex min-w-0 cursor-default items-center gap-2 sm:gap-2.5",
            "text-white transition-colors duration-150",
            "data-[dragging]:cursor-grab data-[dragging]:opacity-70",
            "**:data-[slot=icon]:size-5 **:data-[slot=icon]:shrink-0 **:data-[slot=icon]:text-quebi-fg-muted sm:**:data-[slot=icon]:size-4",
            (isSelected || isHovered || isFocusVisible) &&
              "border-cyan-500/20 bg-quebi-brand/10",
            isFocusVisible &&
              "ring-2 ring-quebi-brand/50 ring-offset-2 ring-offset-quebi-bg",
            isDisabled && "opacity-50",
            "href" in props && "cursor-pointer",
            className,
          ),
      )}
    >
      {(values) => (
        <>
          {values.allowsDragging && (
            <Button slot="drag" className="text-quebi-fg-muted outline-hidden">
              <svg
                aria-hidden="true"
                data-slot="drag-icon"
                className="size-5 sm:size-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M11 5.5C11 6.32843 10.3284 7 9.5 7C8.67157 7 8 6.32843 8 5.5C8 4.67157 8.67157 4 9.5 4C10.3284 4 11 4.67157 11 5.5Z"
                  fill="currentColor"
                />
                <path
                  d="M16 5.5C16 6.32843 15.3284 7 14.5 7C13.6716 7 13 6.32843 13 5.5C13 4.67157 13.6716 4 14.5 4C15.3284 4 16 4.67157 16 5.5Z"
                  fill="currentColor"
                />
                <path
                  d="M11 18.5C11 19.3284 10.3284 20 9.5 20C8.67157 20 8 19.3284 8 18.5C8 17.6716 8.67157 17 9.5 17C10.3284 17 11 17.6716 11 18.5Z"
                  fill="currentColor"
                />
                <path
                  d="M16 18.5C16 19.3284 15.3284 20 14.5 20C13.6716 20 13 19.3284 13 18.5C13 17.6716 13.6716 17 14.5 17C15.3284 17 16 17.6716 16 18.5Z"
                  fill="currentColor"
                />
                <path
                  d="M11 12C11 12.8284 10.3284 13.5 9.5 13.5C8.67157 13.5 8 12.8284 8 12C8 11.1716 8.67157 10.5 9.5 10.5C10.3284 10.5 11 11.1716 11 12Z"
                  fill="currentColor"
                />
                <path
                  d="M16 12C16 12.8284 15.3284 13.5 14.5 13.5C13.6716 13.5 13 12.8284 13 12C13 11.1716 13.6716 10.5 14.5 10.5C15.3284 10.5 16 11.1716 16 12Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          )}

          {values.selectionMode === "multiple" && values.selectionBehavior === "toggle" && (
            <Checkbox slot="selection" />
          )}
          {typeof children === "function" ? children(values) : children}
        </>
      )}
    </GridListItemPrimitive>
  )
}

const GridListEmptyState = ({ ref, className, ...props }: React.ComponentProps<"div">) => (
  <div ref={ref} className={cn("p-6 text-quebi-fg-muted", className)} {...props} />
)

const GridListSpacer = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return <div ref={ref} aria-hidden className={cn("-ms-4 flex-1", className)} {...props} />
}

const GridListStart = ({ className, ref, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      ref={ref}
      className={cn("relative flex items-center gap-x-2.5 sm:gap-x-3", className)}
      {...props}
    />
  )
}

interface GridListTextProps extends TextProps {
  ref?: React.Ref<HTMLDivElement>
}

const GridListLabel = ({ className, ref, ...props }: GridListTextProps) => (
  <Text ref={ref} className={cn("font-medium text-white", className)} {...props} />
)

const GridListDescription = ({ className, ref, ...props }: GridListTextProps) => (
  <Text
    slot="description"
    ref={ref}
    className={cn("font-normal text-quebi-fg-muted text-sm", className)}
    {...props}
  />
)

export type { GridListItemProps, GridListProps }
export {
  GridList,
  GridListDescription,
  GridListEmptyState,
  GridListHeader,
  GridListItem,
  GridListLabel,
  GridListSection,
  GridListSpacer,
  GridListStart,
}
