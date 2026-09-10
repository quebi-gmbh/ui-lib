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
 * Panel: bg-quebi-bg, border-quebi-line/10, rounded-quebi-md.
 *
 * There are two shapes, and which one you want is decided by what opens the
 * modal:
 *
 * - **An element opens it.** Wrap the pairing in `Modal`, whose two children
 *   are the trigger and the overlay. `Modal` *is* react-aria's `DialogTrigger`:
 *   it owns the open state and restores focus to the trigger on close.
 *
 *   ```tsx
 *   <Modal>
 *     <ModalTrigger>Open</ModalTrigger>
 *     <ModalContent>…</ModalContent>
 *   </Modal>
 *   ```
 *
 * - **State opens it** — a lightbox, a confirm raised from a menu item, an
 *   overlay a route decides to show. Render `ModalContent` on its own with
 *   `isOpen`/`onOpenChange`; there is no trigger element to pair with, so there
 *   is nothing for `Modal` to do.
 *
 *   ```tsx
 *   <ModalContent isOpen={isOpen} onOpenChange={setOpen}>…</ModalContent>
 *   ```
 *
 *   Focus still returns to whatever was focused when it opened — that comes
 *   from the overlay's focus scope, not from the trigger.
 *
 * Do not reach for the first shape to get the second: `Modal` given a single
 * child puts that child in the *trigger* slot, where react-aria wraps it in a
 * `PressResponder` that finds nothing pressable and warns on every render.
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

/**
 * The overlay and panel: everything the modal paints, minus the trigger.
 *
 * Takes its open state from the enclosing `Modal` (or any other react-aria
 * trigger it is nested in, as `DatePicker` does on mobile) — *unless* it is
 * given `isOpen`/`defaultOpen`, in which case it owns the state itself and
 * needs no wrapper. `onOpenChange` belongs on whichever of the two holds the
 * state: on `Modal` in the trigger shape, here in the controlled one.
 */
const ModalContent = ({
  className,
  isDismissable: isDismissableInternal,
  children,
  overlay,
  size = "md",
  role = "dialog",
  closeButton = true,
  // The label describes the dialog, not the scrim around it, so these are held
  // back from the overlay's props and handed to Dialog below. In the trigger
  // shape react-aria labels the dialog from the trigger's own text, which is
  // what hid this; standing on its own, an unlabelled dialog is a real defect.
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
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
          "relative overflow-hidden bg-quebi-bg text-quebi-fg",
          "rounded-t-quebi-md border border-quebi-line/10 shadow-quebi-glow-strong sm:rounded-quebi-md",
          sizes[size],
          "entering:slide-in-from-bottom sm:entering:zoom-in-95 sm:entering:slide-in-from-bottom-0 entering:animate-in entering:duration-300 entering:ease-out",
          "exiting:slide-out-to-bottom sm:exiting:zoom-out-95 sm:exiting:slide-out-to-bottom-0 exiting:animate-out exiting:ease-in",
          className,
        )}
      >
        <Dialog role={role} aria-label={ariaLabel} aria-labelledby={ariaLabelledby}>
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
