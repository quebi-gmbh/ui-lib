import { cn } from "@/lib/utils"

/**
 * Stepper — quebi design system
 *
 * A horizontal progress indicator for multi-step flows.
 *
 *   Admin (variant="admin", default):
 *     - row of 32px bullets + labels, connected by 2px rounded lines
 *     - states: upcoming (muted), done (brand teal), active
 *       (surface + brand border + brand glow ring)
 *     - the line following a done step fills with brand teal
 *
 *   Kiosk (variant="kiosk"):
 *     - 28px bullets, no labels, short connector lines
 *     - done shows a checkmark; active shows the step number
 *
 * Active/completed steps use the quebi brand teal as the accent.
 */

export type StepStatus = "done" | "active" | "upcoming"

export interface StepItem {
  id: string
  /** Required for admin; ignored by the kiosk variant. */
  label?: string
  status: StepStatus
}

export interface StepperProps {
  steps: StepItem[]
  /** Admin (32px + label) or kiosk (28px bullet-only). Defaults to admin. */
  variant?: "admin" | "kiosk"
  className?: string
  "aria-label"?: string
}

export function Stepper({
  steps,
  variant = "admin",
  className,
  "aria-label": ariaLabel = "Progress",
}: StepperProps) {
  return variant === "kiosk" ? (
    <KioskStepper steps={steps} className={className} ariaLabel={ariaLabel} />
  ) : (
    <AdminStepper steps={steps} className={className} ariaLabel={ariaLabel} />
  )
}

/* ----------------------------------------------------------------------------
 * Admin stepper
 * ---------------------------------------------------------------------------- */

function AdminStepper({
  steps,
  className,
  ariaLabel,
}: {
  steps: StepItem[]
  className?: string
  ariaLabel: string
}) {
  return (
    <ol
      aria-label={ariaLabel}
      className={cn("flex list-none items-center gap-0 p-0 m-0", className)}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const nextLineDone = step.status === "done"
        return (
          <li key={step.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <AdminBullet index={i + 1} status={step.status} />
              {step.label ? (
                <span
                  className={cn(
                    "text-[13px] font-semibold transition-colors duration-150",
                    step.status === "active"
                      ? "text-white"
                      : step.status === "done"
                        ? "text-quebi-fg-muted"
                        : "text-quebi-fg-subtle",
                  )}
                >
                  {step.label}
                </span>
              ) : null}
            </div>
            {isLast ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-3.5 h-0.5 flex-1 rounded-full transition-colors duration-150",
                  nextLineDone ? "bg-quebi-brand" : "bg-cyan-500/10",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function AdminBullet({ index, status }: { index: number; status: StepStatus }) {
  const base =
    "inline-flex size-8 items-center justify-center rounded-full border-2 text-[13px] font-bold transition-all duration-200"
  const state =
    status === "done"
      ? "border-transparent bg-quebi-brand text-quebi-bg shadow-quebi-glow"
      : status === "active"
        ? "border-quebi-brand bg-quebi-bg text-quebi-brand shadow-quebi-glow-strong"
        : "border-transparent bg-white/[0.06] text-quebi-fg-subtle"
  return (
    <span aria-current={status === "active" ? "step" : undefined} className={cn(base, state)}>
      {index}
    </span>
  )
}

/* ----------------------------------------------------------------------------
 * Kiosk stepper
 * ---------------------------------------------------------------------------- */

function KioskStepper({
  steps,
  className,
  ariaLabel,
}: {
  steps: StepItem[]
  className?: string
  ariaLabel: string
}) {
  return (
    <ol
      aria-label={ariaLabel}
      className={cn("flex list-none items-center gap-2.5 p-0 m-0", className)}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        return (
          <li key={step.id} className="flex items-center gap-2.5">
            <KioskBullet index={i + 1} status={step.status} />
            {isLast ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 w-7 flex-none rounded-full transition-colors duration-150",
                  step.status === "done" ? "bg-quebi-brand" : "bg-cyan-500/10",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function KioskBullet({ index, status }: { index: number; status: StepStatus }) {
  const base =
    "inline-flex size-7 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-all duration-200"
  const state =
    status === "done"
      ? "border-transparent bg-quebi-brand text-quebi-bg shadow-quebi-glow"
      : status === "active"
        ? "border-quebi-brand bg-quebi-bg text-quebi-brand shadow-quebi-glow-strong"
        : "border-transparent bg-white/[0.06] text-quebi-fg-subtle"
  return (
    <span aria-current={status === "active" ? "step" : undefined} className={cn(base, state)}>
      {status === "done" ? "✓" : index}
    </span>
  )
}
