"use client"

import type { DialogProps, DialogTriggerProps, ModalOverlayProps } from "react-aria-components"
import {
  DialogTrigger as DialogTriggerPrimitive,
  ModalOverlay,
  Modal as ModalPrimitive,
} from "react-aria-components"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseIcon,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog"

/**
 * Modal — quebi design system
 *
 * Presents the Dialog surface inside a dark, blurred overlay. Foundational:
 * date-picker and gallery compose this. Overlay: bg-black/60 + backdrop-blur.
 * Panel: bg-quebi-bg, border-cyan-500/10, rounded-quebi-md.
 */
const Modal = (props: DialogTriggerProps) => {
  return <DialogTriggerPrimitive {...props} />
}

const sizes = {
  "2xs": "sm:max-w-2xs",
  xs: "sm:max-w-xs",
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  fullscreen: "",
}

interface ModalContentProps
  extends Omit<ModalOverlayProps, "children">,
    Pick<DialogProps, "aria-label" | "aria-labelledby" | "role" | "children"> {
  size?: keyof typeof sizes
  closeButton?: boolean
  overlay?: Pick<ModalOverlayProps, "className">
}

const ModalContent = ({
  className,
  isDismissable: isDismissableInternal,
  children,
  overlay,
  size = "md",
  role = "dialog",
  closeButton = true,
  ...props
}: ModalContentProps) => {
  const isDismissable = isDismissableInternal ?? role !== "alertdialog"
  return (
    <ModalOverlay
      data-slot="modal-overlay"
      isDismissable={isDismissable}
      className={cn(
        // quebi backdrop — dark scrim + subtle blur.
        "fixed start-0 top-0 z-50 h-(--visual-viewport-height,100vh) w-screen",
        "bg-black/60 backdrop-blur-sm motion-reduce:backdrop-blur-none",
        "grid grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr]",
        "entering:fade-in entering:animate-in entering:duration-300 entering:ease-out",
        "exiting:fade-out exiting:animate-out exiting:ease-in",
        size === "fullscreen" ? "md:p-3" : "md:p-4",
        overlay?.className,
      )}
      {...props}
    >
      <ModalPrimitive
        data-slot="modal-content"
        className={cn(
          "row-start-2 w-full text-start align-middle",
          "[--visual-viewport-vertical-padding:16px]",
          size === "fullscreen"
            ? "**:data-[slot=dialog-body]:min-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding)-var(--dialog-header-height)-var(--dialog-footer-height))] sm:[--visual-viewport-vertical-padding:16px]"
            : "sm:[--visual-viewport-vertical-padding:32px]",
          // quebi surface — bg-quebi-bg, cyan border, glow elevation.
          "relative overflow-hidden bg-quebi-bg text-white",
          "rounded-t-quebi-md border border-cyan-500/10 shadow-quebi-glow-strong sm:rounded-quebi-md",
          sizes[size],
          "entering:slide-in-from-bottom sm:entering:zoom-in-95 sm:entering:slide-in-from-bottom-0 entering:animate-in entering:duration-300 entering:ease-out",
          "exiting:slide-out-to-bottom sm:exiting:zoom-out-95 sm:exiting:slide-out-to-bottom-0 exiting:animate-out exiting:ease-in",
          className,
        )}
      >
        <Dialog role={role}>
          {(values) => (
            <>
              {typeof children === "function" ? children(values) : children}
              {closeButton && <DialogCloseIcon isDismissable={isDismissable} />}
            </>
          )}
        </Dialog>
      </ModalPrimitive>
    </ModalOverlay>
  )
}

const ModalTrigger = DialogTrigger
const ModalHeader = DialogHeader
const ModalTitle = DialogTitle
const ModalDescription = DialogDescription
const ModalFooter = DialogFooter
const ModalBody = DialogBody
const ModalClose = DialogClose

export type { ModalContentProps }
export {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
}
