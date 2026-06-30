"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { tv } from "tailwind-variants"
import { cn } from "@/lib/utils"

/**
 * Toast — quebi design system
 *
 * Transient, non-blocking feedback. Self-contained (no external toast lib):
 * a context-backed queue renders a fixed, portalled stack with an aria-live
 * region for accessibility.
 *
 * Intents: default (neutral surface), success (emerald), warning (amber),
 * danger (red), info (cyan) — matching the quebi status ramps. Auto-dismiss
 * after `duration` ms (set to 0 to keep until dismissed).
 *
 * Usage:
 *   <ToastProvider> wraps your app, then call `const toast = useToast()`
 *   and fire `toast.success("Saved")` / `toast({ title, description })`.
 */

type IconProps = React.SVGProps<SVGSVGElement>

const baseIconProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": "true",
}

const CheckCircleIcon = (props: IconProps) => (
  <svg {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      clipRule="evenodd"
    />
  </svg>
)

const ExclamationTriangleIcon = (props: IconProps) => (
  <svg {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
      clipRule="evenodd"
    />
  </svg>
)

const XCircleIcon = (props: IconProps) => (
  <svg {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
      clipRule="evenodd"
    />
  </svg>
)

const InformationCircleIcon = (props: IconProps) => (
  <svg {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm9-1.5a.75.75 0 0 0 0 1.5h.255a.75.75 0 0 1 .73.926l-.708 2.836A1.75 1.75 0 0 0 13.225 18h.526a.75.75 0 0 0 0-1.5h-.255a.25.25 0 0 1-.243-.31l.71-2.836A1.75 1.75 0 0 0 12.265 11H11.25Zm.75-3.75a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
      clipRule="evenodd"
    />
  </svg>
)

const CloseIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
)

export type ToastIntent = "default" | "success" | "warning" | "danger" | "info"

export interface ToastOptions {
  /** Headline text or node. */
  title: React.ReactNode
  /** Optional secondary line below the title. */
  description?: React.ReactNode
  /** Status colour ramp. */
  intent?: ToastIntent
  /** Auto-dismiss after N ms. 0 keeps the toast until dismissed. Default 4000. */
  duration?: number
}

interface ToastRecord extends Required<Omit<ToastOptions, "description">> {
  id: string
  description?: React.ReactNode
}

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

interface ToastApi {
  (options: ToastOptions): string
  success: (title: React.ReactNode, options?: Omit<ToastOptions, "title" | "intent">) => string
  warning: (title: React.ReactNode, options?: Omit<ToastOptions, "title" | "intent">) => string
  error: (title: React.ReactNode, options?: Omit<ToastOptions, "title" | "intent">) => string
  info: (title: React.ReactNode, options?: Omit<ToastOptions, "title" | "intent">) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Imperative access to the toast queue. Must be used under a ToastProvider. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>")
  return ctx
}

const iconMap = {
  default: null,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: XCircleIcon,
  info: InformationCircleIcon,
} as const

const toastStyles = tv({
  base: [
    "pointer-events-auto flex w-full max-w-sm items-start gap-3",
    "rounded-quebi-md border p-4 text-sm/5 text-pretty backdrop-blur-sm",
    "shadow-quebi-glow",
    "transition-all duration-200 ease-out",
  ],
  variants: {
    intent: {
      default: "border-cyan-500/10 bg-quebi-bg/90 text-quebi-fg-muted",
      success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      danger: "border-red-500/20 bg-red-500/10 text-red-200",
      info: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    },
  },
  defaultVariants: { intent: "default" },
})

const positionStyles: Record<ToastPosition, string> = {
  "top-left": "top-0 left-0 items-start",
  "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-0 right-0 items-end",
  "bottom-left": "bottom-0 left-0 items-start",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-0 right-0 items-end",
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  const Icon = iconMap[toast.intent]

  useEffect(() => {
    if (!toast.duration) return
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div data-slot="toast" className={cn(toastStyles({ intent: toast.intent }))}>
      {Icon && <Icon className="mt-px size-5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-white">{toast.title}</div>
        {toast.description && (
          <div className="mt-1 text-quebi-fg-muted">{toast.description}</div>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "-mr-1 -mt-1 shrink-0 cursor-pointer rounded-quebi-sm p-1 text-current/70",
          "transition-colors duration-150 hover:bg-white/10 hover:text-current",
          "outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg",
        )}
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  )
}

export interface ToastProviderProps {
  children: React.ReactNode
  /** Where the stack docks on screen. Default "bottom-right". */
  position?: ToastPosition
  /** Default auto-dismiss for toasts that don't set one. Default 4000ms. */
  duration?: number
}

let counter = 0

export function ToastProvider({
  children,
  position = "bottom-right",
  duration = 4000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const api = useMemo<ToastApi>(() => {
    const push = (options: ToastOptions) => {
      const id = `toast-${++counter}`
      setToasts((prev) => [
        ...prev,
        {
          id,
          title: options.title,
          description: options.description,
          intent: options.intent ?? "default",
          duration: options.duration ?? duration,
        },
      ])
      return id
    }

    const fn = ((options: ToastOptions) => push(options)) as ToastApi
    fn.success = (title, opts) => push({ ...opts, title, intent: "success" })
    fn.warning = (title, opts) => push({ ...opts, title, intent: "warning" })
    fn.error = (title, opts) => push({ ...opts, title, intent: "danger" })
    fn.info = (title, opts) => push({ ...opts, title, intent: "info" })
    fn.dismiss = dismiss
    return fn
  }, [duration, dismiss])

  const isTop = position.startsWith("top")

  const viewport =
    typeof document !== "undefined"
      ? createPortal(
          <div
            role="region"
            aria-label="Notifications"
            className={cn(
              "pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-3 p-4",
              isTop ? "flex-col" : "flex-col-reverse",
              positionStyles[position],
            )}
          >
            <div aria-live="polite" aria-atomic="false" className="sr-only">
              {toasts.map((t) => (
                <div key={t.id}>{t.title}</div>
              ))}
            </div>
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )
      : null

  return (
    <ToastContext.Provider value={api}>
      {children}
      {viewport}
    </ToastContext.Provider>
  )
}
