"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { use } from "react"
import type {
  DialogProps,
  DialogTriggerProps,
  HeadingProps,
  ModalOverlayProps,
  TextProps,
} from "react-aria-components"
import {
  Button as ButtonPrimitive,
  Dialog,
  DialogTrigger,
  Heading,
  ModalOverlay,
  Modal as ModalPrimitive,
  OverlayTriggerStateContext,
  Text,
} from "react-aria-components"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/button"

/**
 * Drawer — quebi design system
 *
 * A draggable sliding panel that enters from any edge. Built on react-aria's
 * Modal/ModalOverlay for accessibility and `motion` for the slide + drag-to-
 * dismiss gesture. Composes the same overlay surface tokens as Dialog.
 *
 * Surface tokens: bg-quebi-elevated, border-quebi-line/20. Depth is a neutral
 * shadow, not the mint `shadow-quebi-glow` it used to carry: a halo painted at
 * full strength from the first frame of the slide is what task #142 reported.
 */

const DrawerRoot = motion.create(ModalPrimitive)
const DrawerOverlay = motion.create(ModalOverlay)

const Drawer = (props: DialogTriggerProps) => <DialogTrigger {...props} />

interface DrawerContentProps
  extends Omit<ModalOverlayProps, "className" | "children" | "isDismissable">,
    Pick<DialogProps, "aria-label" | "aria-labelledby" | "role" | "children" | "className"> {
  isFloat?: boolean
  isBlurred?: boolean
  className?: string
  side?: "top" | "bottom" | "left" | "right"
  notch?: boolean
}

const DrawerContent = ({
  side = "bottom",
  isFloat = false,
  isBlurred = true,
  notch = true,
  children,
  className,
  ...props
}: DrawerContentProps) => {
  const state = use(OverlayTriggerStateContext)
  // Modal guards its scrim with `motion-reduce:backdrop-blur-none`; the blur is
  // an animated value here, so the same guard has to be a hook.
  const prefersReducedMotion = useReducedMotion()
  const blurAmount = isBlurred && !prefersReducedMotion ? "blur(8px)" : "blur(0px)"
  if (!state) throw new Error("DrawerContent must be used within a Drawer")

  return (
    <AnimatePresence>
      {(props?.isOpen || state?.isOpen) && (
        <DrawerOverlay
          isDismissable
          isOpen={props?.isOpen || state?.isOpen}
          onOpenChange={props?.onOpenChange || state?.setOpen}
          // The blur is a motion value rather than a `backdrop-blur-sm` class so
          // it can tween: as a class it was applied the moment the overlay
          // mounted and removed the moment AnimatePresence unmounted it, which
          // is the hard cut reported in task #142 — the scrim had already faded
          // to transparent while the page was still fully blurred, then snapped
          // sharp. 8px is what `backdrop-blur-sm` resolves to, so the drawer
          // still matches the Modal's scrim at rest. (Motion writes the
          // unprefixed property only; Safari below 18 simply gets no blur.)
          initial={{ backgroundColor: "rgba(0, 0, 0, 0)", backdropFilter: "blur(0px)" }}
          animate={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: blurAmount,
          }}
          exit={{ backgroundColor: "rgba(0, 0, 0, 0)", backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 z-50 will-change-auto [--visual-viewport-vertical-padding:32px]"
        >
          {({ state }) => (
            <DrawerRoot
              className={cn(
                "fixed max-h-full touch-none overflow-hidden border border-quebi-line/20 bg-quebi-elevated align-middle text-quebi-fg shadow-xl will-change-transform",
                side === "top" &&
                  (isFloat
                    ? "inset-x-2 top-2 rounded-quebi-md"
                    : "inset-x-0 top-0 rounded-b-quebi-md"),
                side === "right" &&
                  [
                    "w-full max-w-xs overflow-y-auto",
                    "**:[[slot=header]]:text-start",
                    isFloat ? "inset-y-2 right-2 rounded-quebi-md" : "inset-y-0 right-0 h-auto",
                  ].join(" "),
                side === "bottom" &&
                  (isFloat
                    ? "inset-x-2 bottom-2 rounded-quebi-md"
                    : "inset-x-0 bottom-0 rounded-t-quebi-md"),
                side === "left" &&
                  [
                    "w-full max-w-xs overflow-y-auto",
                    "**:[[slot=header]]:text-start",
                    isFloat ? "inset-y-2 left-2 rounded-quebi-md" : "inset-y-0 left-0 h-auto",
                  ].join(" "),
                className,
              )}
              animate={{ x: 0, y: 0 }}
              initial={{
                x: side === "left" ? "-100%" : side === "right" ? "100%" : 0,
                y: side === "top" ? "-100%" : side === "bottom" ? "100%" : 0,
              }}
              exit={{
                x: side === "left" ? "-100%" : side === "right" ? "100%" : 0,
                y: side === "top" ? "-100%" : side === "bottom" ? "100%" : 0,
              }}
              drag={side === "left" || side === "right" ? "x" : "y"}
              whileDrag={{ cursor: "grabbing" }}
              dragConstraints={{
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
              dragTransition={{
                bounceStiffness: 600,
                bounceDamping: 20,
              }}
              // Same length and curve as the overlay above, so the scrim and its
              // blur clear exactly when the panel has finished leaving.
              transition={{ duration: 0.2, ease: "easeInOut" }}
              onDragEnd={(_, { offset, velocity }) => {
                if (side === "bottom" && (velocity.y > 150 || offset.y > screen.height * 0.25)) {
                  state.close()
                }
                if (side === "top" && (velocity.y < -150 || offset.y < screen.height * 0.25)) {
                  state.close()
                }
                if (side === "left" && velocity.x < -150) {
                  state.close()
                }
                if (side === "right" && velocity.x > 150) {
                  state.close()
                }
              }}
              dragElastic={{
                top: side === "top" ? 1 : 0,
                bottom: side === "bottom" ? 1 : 0,
                left: side === "left" ? 1 : 0,
                right: side === "right" ? 1 : 0,
              }}
              dragPropagation
            >
              <Dialog
                aria-label="Drawer"
                role="dialog"
                className={cn(
                  "relative flex flex-col overflow-hidden outline-hidden will-change-auto",
                  side === "top" || side === "bottom"
                    ? "mx-auto max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding))] max-w-lg"
                    : "h-full",
                )}
              >
                {notch && side === "bottom" && (
                  <div className="notch sticky top-0 mx-auto mt-2.5 h-1.5 w-10 shrink-0 touch-pan-y rounded-full bg-quebi-surface/20" />
                )}
                {children as React.ReactNode}
                {notch && side === "top" && (
                  <div className="notch sticky bottom-0 mx-auto mb-2.5 h-1.5 w-10 shrink-0 touch-pan-y rounded-full bg-quebi-surface/20" />
                )}
              </Dialog>
            </DrawerRoot>
          )}
        </DrawerOverlay>
      )}
    </AnimatePresence>
  )
}

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      slot="header"
      className={cn("flex flex-col p-4 text-center sm:text-start", className)}
      {...props}
    />
  )
}

const DrawerTitle = ({ className, ...props }: HeadingProps) => (
  <Heading
    slot="title"
    className={cn("font-semibold text-quebi-fg text-lg/8", className)}
    {...props}
  />
)

const DrawerDescription = ({ className, ...props }: TextProps) => (
  <Text slot="description" className={cn("text-quebi-fg-muted text-sm", className)} {...props} />
)

const DrawerBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    slot="body"
    className={cn(
      "isolate flex max-h-[calc(var(--visual-viewport-height)-var(--visual-viewport-vertical-padding))] flex-col overflow-auto px-4 py-1 will-change-scroll",
      className,
    )}
    {...props}
  />
)

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      slot="footer"
      className={cn(
        "isolate mt-auto flex flex-col-reverse justify-end gap-2 p-4 sm:flex-row",
        className,
      )}
      {...props}
    />
  )
}

const DrawerClose = ({ className, intent = "outline", ref, ...props }: ButtonProps) => {
  return <Button slot="close" className={className} ref={ref} intent={intent} {...props} />
}

const DrawerTrigger = ButtonPrimitive

export type { DrawerContentProps }
export {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
}
