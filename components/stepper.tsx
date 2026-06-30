import { twMerge } from "tailwind-merge"

/**
 * Stepper — Cellestial Design System
 *
 * Spec source (cellestial-ds/components.css + showcase.html):
 *
 *   Admin (.stepper):
 *     - row of 32px bullets + labels, connected by 2px rounded lines
 *     - states: upcoming (ink-100 bg), done (brand-500 white), active
 *       (surface + brand-500 border + 4px brand-100 ring)
 *     - line following a done step uses brand-300 (progress fill)
 *
 *   Kiosk (.kiosk-stepper):
 *     - 28px bullets, no labels, short 28px lines between
 *     - done shows a checkmark; active shows the step number
 *     - lives in the kiosk footer on every wizard step
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
      className={twMerge("flex items-center gap-0 list-none p-0 m-0", className)}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const nextLineDone = step.status === "done"
        return (
          <li key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-[10px]">
              <AdminBullet index={i + 1} status={step.status} />
              {step.label ? (
                <span
                  className={twMerge(
                    "text-[13px] font-semibold",
                    step.status === "active" ? "text-ink-900" : "text-ink-700",
                  )}
                >
                  {step.label}
                </span>
              ) : null}
            </div>
            {isLast ? null : (
              <span
                aria-hidden="true"
                className={twMerge(
                  "flex-1 h-[2px] mx-[14px] rounded-[2px]",
                  nextLineDone ? "bg-brand-300" : "bg-ink-100",
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
    "w-8 h-8 rounded-full inline-flex items-center justify-center font-bold! text-[13px] border-2"
  const state =
    status === "done"
      ? "bg-brand-500 text-white border-transparent"
      : status === "active"
        ? "bg-surface text-brand-700 border-brand-500 shadow-[0_0_0_4px_var(--color-brand-100)]"
        : "bg-ink-100 text-ink-500 border-transparent"
  return (
    <span aria-current={status === "active" ? "step" : undefined} className={twMerge(base, state)}>
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
      className={twMerge("flex items-center gap-[10px] list-none p-0 m-0", className)}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        return (
          <li key={step.id} className="flex items-center gap-[10px]">
            <KioskBullet index={i + 1} status={step.status} />
            {isLast ? null : (
              <span aria-hidden="true" className="flex-none w-7 h-[2px] bg-ink-200 rounded-[2px]" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function KioskBullet({ index, status }: { index: number; status: StepStatus }) {
  const base =
    "w-7 h-7 rounded-full inline-flex items-center justify-center font-bold! text-[12px] border-2"
  const state =
    status === "done"
      ? "bg-brand-500 text-white border-transparent"
      : status === "active"
        ? "bg-white text-brand-700 border-brand-500 shadow-[0_0_0_4px_var(--color-brand-100)]"
        : "bg-ink-100 text-ink-500 border-transparent"
  return (
    <span aria-current={status === "active" ? "step" : undefined} className={twMerge(base, state)}>
      {status === "done" ? "✓" : index}
    </span>
  )
}
