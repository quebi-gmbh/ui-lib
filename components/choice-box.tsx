"use client"

import { Children, createContext, isValidElement, type ReactNode, use } from "react"
import type { GridListItemProps, GridListProps, TextProps } from "react-aria-components"
import { composeRenderProps, GridList, GridListItem, Text } from "react-aria-components"
import { twMerge } from "tailwind-merge"
import type { VariantProps } from "tailwind-variants"
import { tv } from "tailwind-variants"
import { cx } from "@/lib/primitive"
import { Checkbox } from "./checkbox"

/**
 * Walks a React children tree for the first `ChoiceBoxLabel` and returns its
 * textual content. Lets callers pass label/description as JSX without having
 * to also pass `textValue` for accessibility.
 */
function deriveTextValueFromChildren(children: ReactNode): string | undefined {
  let found: string | undefined
  const visit = (nodes: ReactNode): void => {
    if (found !== undefined) return
    Children.forEach(nodes, (child) => {
      if (found !== undefined) return
      if (typeof child === "string") return
      if (!isValidElement(child)) return
      const elementType = child.type as unknown
      if (elementType === ChoiceBoxLabel) {
        const labelChildren = (child.props as { children?: ReactNode }).children
        if (typeof labelChildren === "string") found = labelChildren
        else if (typeof labelChildren === "number") found = String(labelChildren)
        return
      }
      const innerChildren = (child.props as { children?: ReactNode }).children
      if (innerChildren) visit(innerChildren)
    })
  }
  visit(children)
  return found
}

const choiceBoxStyles = tv({
  base: "grid [--gutter:--spacing(4)]",
  variants: {
    columns: {
      1: "col-span-full grid-cols-[auto_1fr]",
      2: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),26rem))] sm:justify-center",
      3: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(16rem,100%),22rem))] sm:justify-center",
      4: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),18rem))] sm:justify-center",
      5: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),16rem))] sm:justify-center",
      6: "grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(11rem,100%),14rem))] sm:justify-center",
    },
    gap: {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
    },
  },
  defaultVariants: {
    columns: 1,
    gap: 0,
  },
  compoundVariants: [
    {
      gap: 0,
      columns: 1,
      className:
        "rounded-lg *:data-[slot=choice-box-item]:inset-ring *:data-[slot=choice-box-item]:-mt-px *:data-[slot=choice-box-item]:rounded-none *:data-[slot=choice-box-item]:last:rounded-b-[calc(var(--radius-lg)-1px)] *:data-[slot=choice-box-item]:first:rounded-t-[calc(var(--radius-lg)-1px)]",
    },
  ],
})

const ChoiceBoxContext = createContext<{ columns?: number; gap?: number; isReadOnly?: boolean }>({})

const useChoiceBoxContext = () => use(ChoiceBoxContext)

interface ChoiceBoxProps<T extends object>
  extends GridListProps<T>,
    VariantProps<typeof choiceBoxStyles> {
  isReadOnly?: boolean
}

const ChoiceBox = <T extends object>({
  columns = 1,
  gap = 0,
  className,
  selectionMode = "single",
  isReadOnly,
  ...props
}: ChoiceBoxProps<T>) => {
  return (
    <ChoiceBoxContext value={{ columns, gap, isReadOnly }}>
      <GridList
        data-slot="choice-box"
        layout={columns === 1 ? "stack" : "grid"}
        selectionMode={selectionMode}
        className={cx(
          choiceBoxStyles({
            columns,
            gap,
          }),
          className,
        )}
        {...props}
      />
    </ChoiceBoxContext>
  )
}

const choiceBoxItemStyles = tv({
  base: [
    "group outline-hidden",
    "[--choice-box-fg:var(--color-primary-subtle-fg)] [--choice-box:var(--color-primary-subtle)]",
    "[--choice-box-selected-hovered:var(--color-primary-subtle)]/90",
    "inset-ring inset-ring-border rounded-lg p-(--gutter) **:data-[slot=label]:font-medium",
    "**:data-[slot=avatar]:row-span-2 **:data-[slot=avatar]:mt-0.5 **:data-[slot=avatar]:shrink-0",
    "**:data-[slot=icon]:row-span-2 **:data-[slot=icon]:mt-0.5 **:data-[slot=icon]:shrink-0",
    "has-data-[slot=avatar]:grid-cols-[auto_1fr_auto] has-data-[slot=icon]:grid-cols-[auto_1fr_auto]",
    "grid grid-cols-[1fr_auto] content-start items-start gap-x-[calc(var(--gutter)-(--spacing(1)))] gap-y-1",
    "[--choice-box-active-ring:var(--color-ring)]/70 [--choice-box-ring:var(--color-ring)]/20",
    "has-[[slot=description]]:**:data-[slot=label]:font-medium",
  ],
  variants: {
    isLink: {
      true: "cursor-pointer",
      false: "cursor-default",
    },
    isHovered: {
      true: "not-data-readonly:not-data-focus-visible:not-selected:inset-ring-muted-fg/30",
    },
    isFocused: {
      true: "inset-ring-(--choice-box-active-ring) ring-(--choice-box-ring) ring-3 invalid:ring-danger-subtle-fg/20",
    },
    isInvalid: { true: "ring-3 ring-danger-subtle-fg/20" },
    isOneColumn: {
      true: "col-span-full",
    },
    isActive: {
      true: [
        "bg-(--choice-box) text-(--choice-box-fg)",
        "inset-ring-(--choice-box-active-ring) z-20 hover:bg-(--choice-box-selected-hovered)",
        "**:data-[slot=label]:text-(--choice-box-fg)",
        "**:[[slot=description]]:text-(--choice-box-fg)",
      ],
    },
    isDisabled: {
      true: "z-10 opacity-50 **:data-[slot=label]:text-muted-fg forced-colors:text-[GrayText] **:[[slot=description]]:text-muted-fg/70",
    },
  },
})

interface ChoiceBoxItemProps extends GridListItemProps, VariantProps<typeof choiceBoxItemStyles> {
  label?: string
  description?: string
}

const ChoiceBoxItem = ({
  className,
  label,
  description,
  children,
  textValue: textValueProp,
  ...props
}: ChoiceBoxItemProps) => {
  // Prefer an explicit textValue prop; otherwise extract it from string children,
  // a nested ChoiceBoxLabel, or the label prop — in that priority order.
  const textValue =
    textValueProp ??
    (typeof children === "string"
      ? children
      : typeof children === "function"
        ? label
        : (deriveTextValueFromChildren(children as ReactNode) ?? label))
  const { columns, isReadOnly } = useChoiceBoxContext()
  return (
    <GridListItem
      textValue={textValue}
      data-readonly={isReadOnly}
      data-slot="choice-box-item"
      {...props}
      className={composeRenderProps(
        className,
        (className, { isFocusVisible, isSelected, ...renderProps }) =>
          choiceBoxItemStyles({
            ...renderProps,
            isOneColumn: columns === 1,
            isLink: "href" in props,
            isFocused: !isReadOnly && renderProps.isFocused,
            isActive: (!isReadOnly && isSelected) || isFocusVisible,
            className,
          }),
      )}
    >
      {composeRenderProps(children, (children, { selectionMode }) => {
        const isStringChild = typeof children === "string"
        const hasCustomChildren = typeof children !== "undefined"

        const content = hasCustomChildren ? (
          isStringChild ? (
            <ChoiceBoxLabel>{children}</ChoiceBoxLabel>
          ) : (
            children
          )
        ) : (
          <>
            {label && <ChoiceBoxLabel>{label}</ChoiceBoxLabel>}
            {description && <ChoiceBoxDescription>{description}</ChoiceBoxDescription>}
          </>
        )
        return (
          <>
            {content}
            {selectionMode === "multiple" && (
              <Checkbox
                className="col-start-2 self-start group-has-data-[slot=avatar]:col-start-3 group-has-data-[slot=icon]:col-start-3"
                slot="selection"
              />
            )}
          </>
        )
      })}
    </GridListItem>
  )
}

interface ChoiceBoxLabelProps extends TextProps {
  ref?: React.Ref<HTMLDivElement>
}

const ChoiceBoxLabel = ({ className, ref, ...props }: ChoiceBoxLabelProps) => {
  return (
    <Text
      data-slot="label"
      ref={ref}
      className={twMerge(
        "select-none text-base/6 text-fg group-disabled:opacity-50 sm:text-sm/6",
        "col-start-1 row-start-1",
        "group-has-data-[slot=icon]:col-start-2",
        "group-has-data-[slot=avatar]:col-start-2",
        className,
      )}
      {...props}
    />
  )
}

type ChoiceBoxDescriptionProps = ChoiceBoxLabelProps

const ChoiceBoxDescription = ({ className, ref, ...props }: ChoiceBoxDescriptionProps) => {
  return (
    <Text
      slot="description"
      ref={ref}
      className={twMerge(
        "col-start-1 row-start-2",
        "group-has-data-[slot=icon]:col-start-2",
        "group-has-data-[slot=avatar]:col-start-2",
        "text-base/6 text-muted-fg sm:text-sm/6",
        "group-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export type { ChoiceBoxItemProps, ChoiceBoxProps }
export { ChoiceBox, ChoiceBoxDescription, ChoiceBoxItem, ChoiceBoxLabel }
