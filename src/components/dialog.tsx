"use client"

import type { HeadingProps, TextProps } from "react-aria-components"
import {
  Heading,
  Button as PrimitiveButton,
  Dialog as PrimitiveDialog,
} from "react-aria-components"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/button"

/**
 * Dialog — quebi design system
 *
 * The dialog *surface*: a flex column that fills its overlay and scrolls its
 * body. Foundational — modal / popover / sheet / drawer compose this surface
 * inside their own overlay. Pair with react-aria's Modal/Popover to present it.
 *
 * Surface tokens: bg-quebi-bg, border-cyan-500/10, rounded-quebi-md.
 */
const Dialog = ({
  role = "dialog",
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveDialog>) => {
  return (
    <PrimitiveDialog
      data-slot="dialog"
      role={role}
      className={cn(
        "peer/dialog group/dialog relative flex max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding))] flex-col overflow-hidden rounded-quebi-md border border-cyan-500/10 bg-quebi-bg text-white outline-none [--gutter:--spacing(6)] sm:[--gutter:--spacing(8)]",
        className,
      )}
      {...props}
    />
  )
}

const DialogTrigger = ({ className, ...props }: ButtonProps) => (
  <Button className={cn("cursor-pointer", className)} {...props} />
)

interface DialogHeaderProps extends Omit<React.ComponentProps<"div">, "title"> {
  title?: string
  description?: string
}

const DialogHeader = ({ className, ...props }: DialogHeaderProps) => {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "relative space-y-1 p-(--gutter) pb-[calc(var(--gutter)---spacing(3))]",
        className,
      )}
    >
      {props.title && <DialogTitle>{props.title}</DialogTitle>}
      {props.description && <DialogDescription>{props.description}</DialogDescription>}
      {!props.title && typeof props.children === "string" ? (
        <DialogTitle>{props.children}</DialogTitle>
      ) : (
        props.children
      )}
    </div>
  )
}

interface DialogTitleProps extends HeadingProps {
  ref?: React.Ref<HTMLHeadingElement>
}
const DialogTitle = ({ className, ref, ...props }: DialogTitleProps) => (
  <Heading
    slot="title"
    ref={ref}
    className={cn("text-balance font-semibold text-white text-lg/6 sm:text-base/6", className)}
    {...props}
  />
)

interface DialogDescriptionProps extends TextProps {
  ref?: React.Ref<HTMLDivElement>
}
const DialogDescription = ({ className, ref, ...props }: DialogDescriptionProps) => (
  <p
    data-slot="description"
    className={cn(
      "text-pretty text-base/6 text-quebi-fg-muted group-disabled:opacity-50 sm:text-sm/6",
      className,
    )}
    ref={ref}
    {...props}
  />
)

interface DialogBodyProps extends React.ComponentProps<"div"> {}
const DialogBody = ({ className, ...props }: DialogBodyProps) => (
  <div
    data-slot="dialog-body"
    className={cn(
      "isolate flex min-h-0 flex-1 flex-col overflow-auto px-(--gutter) py-1",
      "**:data-[slot=dialog-footer]:px-0 **:data-[slot=dialog-footer]:pt-0",
      className,
    )}
    {...props}
  />
)

interface DialogFooterProps extends React.ComponentProps<"div"> {}
const DialogFooter = ({ className, ...props }: DialogFooterProps) => {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "isolate mt-auto flex flex-col-reverse justify-end gap-3 p-(--gutter) pt-[calc(var(--gutter)---spacing(2))] group-not-has-data-[slot=dialog-body]/dialog:pt-0 group-not-has-data-[slot=dialog-body]/popover:pt-0 sm:flex-row",
        className,
      )}
      {...props}
    />
  )
}

const DialogClose = ({ intent = "ghost", ref, ...props }: ButtonProps) => {
  return <Button slot="close" ref={ref} intent={intent} {...props} />
}

interface CloseButtonIndicatorProps extends Omit<ButtonProps, "children"> {
  className?: string
  isDismissable?: boolean | undefined
}

const DialogCloseIcon = ({ className, ...props }: CloseButtonIndicatorProps) => {
  return props.isDismissable ? (
    <PrimitiveButton
      aria-label="Close"
      slot="close"
      className={cn(
        "close absolute end-1 top-1 z-50 grid size-8 place-content-center rounded-quebi-sm text-quebi-fg-muted transition-colors hover:bg-white/[0.06] hover:text-white focus:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 sm:end-2 sm:top-2 sm:size-7",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </PrimitiveButton>
  ) : null
}

export type {
  CloseButtonIndicatorProps,
  DialogBodyProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogTitleProps,
}
export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseIcon,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
