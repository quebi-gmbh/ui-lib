"use client"

import { use } from "react"
import {
  Button,
  composeRenderProps,
  DisclosureStateContext,
  Heading,
  Disclosure as PrimitiveDisclosure,
  DisclosureGroup as PrimitiveDisclosureGroup,
  DisclosurePanel as PrimitiveDisclosurePanel,
  type ButtonProps,
  type DisclosureGroupProps,
  type DisclosurePanelProps,
  type DisclosureProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * DisclosureGroup — quebi design system
 *
 * Accordion-style stack of expandable sections built on react-aria-components.
 * Each item is bordered with the signature cyan tint; headers read in white and
 * the active item lifts with a subtle teal-tinted surface and glow. Pass
 * `allowsMultipleExpanded` to keep several sections open at once.
 */
export function DisclosureGroup({ className, ...props }: DisclosureGroupProps) {
  return (
    <PrimitiveDisclosureGroup
      data-slot="disclosure-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

export function Disclosure({ className, ...props }: DisclosureProps) {
  return (
    <PrimitiveDisclosure
      data-slot="disclosure"
      className={composeRenderProps(className, (className, { isExpanded, isFocusVisibleWithin }) =>
        cn(
          "group/disclosure w-full overflow-hidden rounded-quebi-md border border-cyan-500/10 bg-quebi-bg transition-colors duration-200",
          "data-[hovered]:border-cyan-500/20",
          (isExpanded || isFocusVisibleWithin) &&
            "border-cyan-500/20 bg-quebi-brand/5 shadow-quebi-glow",
          className,
        ),
      )}
      {...props}
    />
  )
}

export interface DisclosureTriggerProps extends ButtonProps {
  ref?: React.Ref<HTMLButtonElement>
  triggerIndicator?: boolean
}

export function DisclosureTrigger({
  ref,
  className,
  triggerIndicator = true,
  ...props
}: DisclosureTriggerProps) {
  const state = use(DisclosureStateContext)
  if (!state) throw new Error("DisclosureTrigger must be used within a Disclosure")
  return (
    <Heading className="m-0">
      <Button
        {...props}
        ref={ref}
        slot="trigger"
        className={composeRenderProps(className, (className) =>
          cn(
            "flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-start font-medium text-sm text-white outline-hidden",
            "transition-colors duration-150",
            "data-[hovered]:text-white",
            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand/50 data-[focus-visible]:ring-inset",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "[&_[data-slot=icon]]:size-4 [&_[data-slot=icon]]:shrink-0",
            className,
          ),
        )}
      >
        {(values) => (
          <>
            {typeof props.children === "function" ? props.children(values) : props.children}
            {triggerIndicator && <DisclosureIndicator />}
          </>
        )}
      </Button>
    </Heading>
  )
}

export function DisclosureIndicator({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="disclosure-indicator"
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative flex size-5 shrink-0 items-center justify-center text-quebi-fg-muted [--width:--spacing(2.5)]",
        "group-data-[hovered]/disclosure:text-white",
        className,
      )}
      {...props}
    >
      <span className="absolute h-[1.5px] w-(--width) origin-center rotate-90 bg-current transition-transform duration-300 group-data-[expanded]/disclosure:rotate-0" />
      <span className="absolute h-[1.5px] w-(--width) origin-center bg-current" />
    </span>
  )
}

export function DisclosurePanel({ className, children, ...props }: DisclosurePanelProps) {
  return (
    <PrimitiveDisclosurePanel
      data-slot="disclosure-panel"
      className={cn(
        "overflow-hidden text-sm text-quebi-fg-muted transition-[height] duration-200",
        className,
      )}
      {...props}
    >
      <div
        data-slot="disclosure-panel-content"
        className="px-4 pb-4 text-pretty leading-relaxed"
      >
        {children}
      </div>
    </PrimitiveDisclosurePanel>
  )
}
