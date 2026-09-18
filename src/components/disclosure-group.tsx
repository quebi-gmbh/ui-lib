"use client"

import { createContext, use } from "react"
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
  type DisclosureProps as PrimitiveDisclosureProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * DisclosureGroup — quebi design system
 *
 * Accordion-style stack of expandable sections built on react-aria-components.
 * Each item is bordered with the signature cyan tint; headers read in white and
 * the active item lifts with a subtle teal-tinted surface and glow. Pass
 * `allowsMultipleExpanded` to keep several sections open at once.
 *
 * `<Disclosure variant="plain">` drops the surface entirely — no border, no
 * tint, no glow, tight padding and an eyebrow-style header — for the case where
 * the disclosure *is* the chrome rather than sitting inside it, such as the
 * collapsible category groups in a long nav. The variant is set on the
 * Disclosure and the trigger, indicator and panel follow it, so a call site
 * passes one prop rather than flattening three components by hand.
 */
type DisclosureVariant = "card" | "plain"

/**
 * The variant is set once on the Disclosure and read by the trigger, indicator
 * and panel. It travels in context rather than as a CSS `group-data-` override
 * because the two skins differ in padding, type scale and hover colour — as
 * overrides those would land on the same specificity as the base classes they
 * are meant to beat, and which one won would come down to stylesheet order.
 */
const DisclosureVariantContext = createContext<DisclosureVariant>("card")

export function DisclosureGroup({ className, ...props }: DisclosureGroupProps) {
  return (
    <PrimitiveDisclosureGroup
      data-slot="disclosure-group"
      className={composeRenderProps(className, (resolved) => cn("flex flex-col gap-2", resolved))}
      {...props}
    />
  )
}

export interface DisclosureProps extends PrimitiveDisclosureProps {
  /** `card` (default) is the bordered accordion surface; `plain` is bare nav chrome. */
  variant?: "card" | "plain"
}

export function Disclosure({ className, variant = "card", ...props }: DisclosureProps) {
  return (
    <DisclosureVariantContext value={variant}>
      <PrimitiveDisclosure
        data-slot="disclosure"
        data-variant={variant}
        className={composeRenderProps(className, (className, { isExpanded, isFocusVisibleWithin }) =>
          cn(
            "group/disclosure w-full overflow-hidden transition-colors duration-200",
            variant === "card" && [
              "rounded-quebi-md border border-quebi-line/10 bg-quebi-bg",
              "data-[hovered]:border-quebi-line/20",
              (isExpanded || isFocusVisibleWithin) &&
                "border-quebi-line/20 bg-quebi-brand/5 shadow-quebi-glow",
            ],
            className,
          ),
        )}
        {...props}
      />
    </DisclosureVariantContext>
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
  const variant = use(DisclosureVariantContext)
  if (!state) throw new Error("DisclosureTrigger must be used within a Disclosure")
  return (
    <Heading className="m-0">
      <Button
        {...props}
        ref={ref}
        slot="trigger"
        className={composeRenderProps(className, (className) =>
          cn(
            "flex w-full cursor-pointer items-center justify-between gap-3 text-start font-medium outline-hidden",
            "transition-colors duration-150",
            "data-[focus-visible]:ring-2 data-[focus-visible]:ring-quebi-brand-mark data-[focus-visible]:ring-inset",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "[&_[data-slot=icon]]:size-4 [&_[data-slot=icon]]:shrink-0",
            variant === "card" && "px-4 py-3 text-sm text-quebi-fg data-[hovered]:text-quebi-fg",
            variant === "plain" && [
              "rounded-quebi-sm px-3 py-1.5 text-xs uppercase tracking-wider",
              "text-quebi-fg-muted data-[hovered]:text-quebi-fg",
            ],
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
  const variant = use(DisclosureVariantContext)
  return (
    <span
      data-slot="disclosure-indicator"
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative flex size-5 shrink-0 items-center justify-center text-quebi-fg-muted [--width:--spacing(2.5)]",
        "group-data-[hovered]/disclosure:text-quebi-fg",
        variant === "plain" && "size-4 [--width:--spacing(2)]",
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
  const variant = use(DisclosureVariantContext)
  return (
    <PrimitiveDisclosurePanel
      data-slot="disclosure-panel"
      className={composeRenderProps(className, (resolved) =>
        cn(
          "overflow-hidden text-sm text-quebi-fg-muted transition-[height] duration-200",
          resolved,
        ),
      )}
      {...props}
    >
      <div
        data-slot="disclosure-panel-content"
        className={cn(
          variant === "card" && "px-4 pb-4 text-pretty leading-relaxed",
          variant === "plain" && "pt-1 pb-2",
        )}
      >
        {children}
      </div>
    </PrimitiveDisclosurePanel>
  )
}
