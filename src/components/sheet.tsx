"use client"

import type { DialogProps, ModalOverlayProps } from "react-aria-components"
import {
  composeRenderProps,
  DialogTrigger as DialogTriggerPrimitive,
  Modal,
  ModalOverlay,
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
 * Sheet — quebi design system
 *
 * A side panel that slides in from any edge of the viewport. Composes the
 * Dialog surface inside a react-aria Modal/ModalOverlay. Use for filters,
 * detail editing, navigation drawers, and other off-canvas content.
 *
 * Two shapes, as with Modal: `Sheet` is react-aria's `DialogTrigger` and takes
 * a trigger plus a `SheetContent`; when state decides instead — a drawer a
 * route opens, say — render `SheetContent` on its own with
 * `isOpen`/`onOpenChange` and leave `Sheet` out. A `Sheet` with a single child
 * puts that child in its trigger slot, which warns on every render.
 *
 * Surface: bg-quebi-elevated, square, lifted by `shadow-quebi-float`. Docked to
 * an edge it draws one hairline, on the side facing the page; floating, it is
 * ruled all round.
 */
const Sheet = DialogTriggerPrimitive

interface SheetContentProps
  extends Omit<ModalOverlayProps, "children">,
    Pick<DialogProps, "aria-label" | "role" | "aria-labelledby" | "children"> {
  closeButton?: boolean
  isFloat?: boolean
  side?: "top" | "bottom" | "left" | "right"
  overlay?: Omit<ModalOverlayProps, "children">
}

const sideVariants: Record<string, string> = {
  top: "entering:slide-in-from-top exiting:slide-out-to-top inset-x-0 top-0 border-b data-[float=true]:inset-x-2 data-[float=true]:top-2",
  bottom:
    "entering:slide-in-from-bottom exiting:slide-out-to-bottom inset-x-0 bottom-0 border-t data-[float=true]:inset-x-2 data-[float=true]:bottom-2",
  left: "entering:slide-in-from-left exiting:slide-out-to-left-80 inset-y-0 left-0 h-auto w-3/4 overflow-y-auto border-r sm:max-w-80 data-[float=true]:inset-y-2 data-[float=true]:left-2",
  right:
    "entering:slide-in-from-right exiting:slide-out-to-right-80 inset-y-0 right-0 h-auto w-3/4 overflow-y-auto border-l sm:max-w-80 data-[float=true]:inset-y-2 data-[float=true]:right-2",
}

const SheetContent = ({
  className,
  isDismissable: isDismissableInternal,
  side = "right",
  role = "dialog",
  closeButton = true,
  isFloat = true,
  overlay,
  children,
  // Held back from the overlay's props: the label describes the dialog, not the
  // scrim. Same reasoning as ModalContent.
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}: SheetContentProps) => {
  const isDismissable = isDismissableInternal ?? role !== "alertdialog"
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      className={composeRenderProps(overlay?.className, (resolved) =>
        cn(
          // Backdrop — neutral scrim + subtle blur, as ModalContent's.
          "fixed start-0 top-0 z-50 size-full overflow-hidden bg-black/60 backdrop-blur-sm",
          "entering:fade-in entering:animate-in exiting:fade-out exiting:animate-out duration-200 ease-in-out",
          resolved,
        ),
      )}
      {...props}
    >
      <Modal
        data-float={isFloat}
        className={composeRenderProps(className, (resolved) =>
          cn(
            // The side variant draws the edge; the Dialog inside is told not to.
            "fixed z-50 grid gap-4 border-quebi-hairline bg-quebi-elevated text-quebi-fg shadow-quebi-float",
            "data-[float=true]:border",
            "transform-gpu transition ease-in-out will-change-transform [--visual-viewport-vertical-padding:16px]",
            // One length and one curve for both directions, matching Drawer's
            // `0.2s easeInOut` — Drawer is the surface the report held up as the
            // right feel (task #179), so it sets the tempo and the CSS overlays
            // follow it. The `ease-in-out` above sets `--tw-ease` for the
            // animation as well as the transition, so the two cannot drift.
            "entering:fade-in entering:animate-in exiting:fade-out exiting:animate-out duration-200",
            sideVariants[side],
            resolved,
          ),
        )}
      >
        <Dialog
          className="border-0 sm:[--gutter:--spacing(6)]"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          role={role}
        >
          {(values) => (
            <>
              {typeof children === "function" ? children(values) : children}
              {closeButton && (
                <DialogCloseIcon className="end-2.5 top-2.5" isDismissable={isDismissable} />
              )}
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

const SheetTrigger = DialogTrigger
const SheetFooter = DialogFooter
const SheetHeader = DialogHeader
const SheetTitle = DialogTitle
const SheetDescription = DialogDescription
const SheetBody = DialogBody
const SheetClose = DialogClose

export type { SheetContentProps }
export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
