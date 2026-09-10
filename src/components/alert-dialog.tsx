"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { Button } from "@/components/button"
import {
  ModalBody,
  ModalContent,
  type ModalContentProps,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/modal"

/**
 * AlertDialog — quebi design system
 *
 * The library's answer to `window.confirm()`, in two shapes.
 *
 * - **`<AlertDialog>`** is the surface: a `role="alertdialog"` modal with a
 *   title, a consequence, and exactly two buttons. Controlled, like every other
 *   overlay here.
 *
 * - **`useConfirm()`** is the same surface reached imperatively. It returns a
 *   function that returns `Promise<boolean>`, so the line that asked the
 *   question is still the line that reads the answer:
 *
 *   ```tsx
 *   const confirm = useConfirm()
 *
 *   async function onDelete() {
 *     if (!(await confirm({ title: "Delete this project?", intent: "danger" }))) return
 *     await deleteProject(id)
 *   }
 *   ```
 *
 *   That is the whole point of the hook. `confirm()` is synchronous and a React
 *   dialog is not, so the usual replacement splits a handler in two and moves
 *   its second half onto a button. Awaiting a promise does not: the handler
 *   keeps its shape and only gains an `await`.
 *
 * `useConfirm()` throws unless a `<ConfirmProvider>` is mounted above it — one
 * at the root of the app, exactly like `<ToastProvider>`. Questions asked while
 * another is open queue up and are asked in turn; a dialog is modal, so there
 * is never more than one on screen.
 */

/** Colour ramp for the confirming button. */
export type ConfirmIntent = "primary" | "danger" | "accent"

export interface ConfirmOptions {
  /** The question. Also the dialog's accessible name. */
  title: React.ReactNode
  /** The consequence, in a line — what the user cannot undo afterwards. */
  description?: React.ReactNode
  /** Label on the confirming button. Default "Confirm". */
  confirmLabel?: string
  /** Label on the cancelling button. Default "Cancel". */
  cancelLabel?: string
  /** Colour ramp for the confirming button. Default "primary". */
  intent?: ConfirmIntent
}

export interface AlertDialogProps extends ConfirmOptions {
  /** Whether the dialog is on screen. Controlled — there is no uncontrolled shape. */
  isOpen: boolean
  /**
   * Asked to close: the confirming button, the cancelling button, or Escape.
   * Only ever called with `false`, because an alert dialog cannot open itself.
   */
  onOpenChange?: (isOpen: boolean) => void
  /** The user answered yes. Fired before `onOpenChange`. */
  onConfirm?: () => void
  /** The user answered no, or dismissed the dialog. Fired before `onOpenChange`. */
  onCancel?: () => void
  /** Panel width. Default "sm" — a question is not a form. */
  size?: ModalContentProps["size"]
  /** Extra detail between the description and the buttons. */
  children?: React.ReactNode
}

/**
 * A two-answer modal question: title, consequence, cancel, confirm.
 *
 * `role="alertdialog"` means it is not dismissable by clicking the scrim (the
 * Modal derives that from the role) and has no close icon, so the only ways out
 * are the two buttons and Escape — and Escape is a cancellation, because there
 * is no third answer to the question being asked.
 */
export function AlertDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  intent = "primary",
  size = "sm",
  children,
}: AlertDialogProps) {
  const answer = (confirmed: boolean) => {
    if (confirmed) onConfirm?.()
    else onCancel?.()
    onOpenChange?.(false)
  }

  return (
    <ModalContent
      role="alertdialog"
      size={size}
      closeButton={false}
      isOpen={isOpen}
      // The overlay only ever asks to *close* — Escape, or the focus scope
      // being dismissed — and the buttons below do not route through here (they
      // are not `slot="close"`), so this branch is the dismissal and nothing
      // else. Dismissing a question you cannot answer twice is answering "no".
      onOpenChange={(open) => {
        if (!open) answer(false)
      }}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>
      {children && <ModalBody>{children}</ModalBody>}
      {/* Cancel first in the DOM: react-aria's Dialog moves focus to the first
          focusable element, and the safe answer is the one a stray Enter should
          land on. The footer reverses visually on mobile. */}
      <ModalFooter>
        <Button intent="outline" onPress={() => answer(false)}>
          {cancelLabel}
        </Button>
        <Button intent={intent} onPress={() => answer(true)}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  )
}

/** Ask a question; get the answer back. Rejects nothing — a dismissal is `false`. */
export type ConfirmFn = (question: string | ConfirmOptions) => Promise<boolean>

interface ConfirmRequest {
  id: string
  options: ConfirmOptions
  resolve: (answer: boolean) => void
}

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * The promise-based confirmation. Must be used under a `<ConfirmProvider>`.
 *
 * Takes the same options as `<AlertDialog>`, or a bare string when the question
 * is the whole of it, so a `confirm("Delete this project?")` becomes
 * `await confirm("Delete this project?")` and the branch below it survives.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within a <ConfirmProvider>")
  return ctx
}

export interface ConfirmProviderProps {
  children: React.ReactNode
  /** Options every question inherits unless it sets its own. */
  defaults?: Omit<ConfirmOptions, "title" | "description">
}

let counter = 0

/**
 * Mount once at the root of the app. Owns the queue and renders the dialog.
 */
export function ConfirmProvider({ children, defaults }: ConfirmProviderProps) {
  const [queue, setQueue] = useState<ConfirmRequest[]>([])
  const [shown, setShown] = useState<ConfirmRequest | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // Every question still awaiting an answer. Unmounting the provider settles
  // them as "no" rather than leaving each `await confirm(...)` pending forever,
  // which is a hang with no stack trace pointing anywhere near here.
  const outstanding = useRef(new Set<ConfirmRequest>())

  const confirm = useCallback<ConfirmFn>(
    (question) =>
      new Promise<boolean>((resolve) => {
        const request: ConfirmRequest = {
          id: `confirm-${++counter}`,
          options: typeof question === "string" ? { title: question } : question,
          resolve,
        }
        outstanding.current.add(request)
        setQueue((prev) => [...prev, request])
      }),
    [],
  )

  // One at a time: the head of the queue opens once the previous answer is in.
  // `shown` is deliberately not cleared on close — react-aria keeps the panel
  // mounted through its exit animation, and blanking the title mid-fade is the
  // flicker that would cost.
  useEffect(() => {
    if (isOpen || queue.length === 0) return
    setShown(queue[0])
    setQueue((prev) => prev.slice(1))
    setIsOpen(true)
  }, [isOpen, queue])

  useEffect(() => {
    const pending = outstanding.current
    return () => {
      for (const request of pending) request.resolve(false)
      pending.clear()
    }
  }, [])

  const settle = useCallback((request: ConfirmRequest | null, answer: boolean) => {
    // Escape fires `onCancel` and then `onOpenChange`; the membership check is
    // what keeps that from being two answers to one question.
    if (!request || !outstanding.current.has(request)) return
    outstanding.current.delete(request)
    request.resolve(answer)
    setIsOpen(false)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {shown && (
        <AlertDialog
          {...defaults}
          {...shown.options}
          isOpen={isOpen}
          onConfirm={() => settle(shown, true)}
          onCancel={() => settle(shown, false)}
          onOpenChange={(open) => {
            if (!open) setIsOpen(false)
          }}
        />
      )}
    </ConfirmContext.Provider>
  )
}
