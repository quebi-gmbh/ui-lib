import { cn } from "@/lib/utils"

/**
 * Stepper — quebi design system
 *
 * A horizontal progress indicator for multi-step flows.
 *
 *   Admin (variant="admin", default):
 *     - row of 32px bullets + labels, connected by 2px rounded lines
 *     - states: upcoming (muted), done (brand teal fill), active
 *       (surface + brand border)
 *     - the line following a done step fills with brand teal
 *
 *   Kiosk (variant="kiosk"):
 *     - 28px bullets, no labels, short connector lines
 *     - done shows a checkmark; active shows the step number
 *
 * Active/completed steps use the quebi brand teal as the accent. Fill, border
 * and text colour carry the state on their own, so the bullets are flat by
 * default: a stepper is usually several done steps at once, and a glow on each
 * of them is a row of lights rather than a progress indicator. `glow` opts the
 * halo back in for a kiosk or hero surface where the stepper is the subject.
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
  /** Opt in to the brand halo on done/active bullets. Reserve it for a kiosk or
   * hero surface where the stepper is the subject; on an admin form several
   * glowing bullets at once read as noise. Default `false`. */
  glow?: boolean
  className?: string
  "aria-label"?: string
}

export function Stepper({
  steps,
  variant = "admin",
  glow = false,
  className,
  "aria-label": ariaLabel = "Progress",
}: StepperProps) {
  return variant === "kiosk" ? (
    <KioskStepper steps={steps} glow={glow} className={className} ariaLabel={ariaLabel} />
  ) : (
    <AdminStepper steps={steps} glow={glow} className={className} ariaLabel={ariaLabel} />
  )
}

/**
 * The opted-in halo, shared by both bullet sizes so the two variants cannot
 * drift. `upcoming` never glows — a step that has not happened has nothing to
 * announce.
 */
function glowFor(status: StepStatus) {
  return status === "done"
    ? "shadow-quebi-glow"
    : status === "active"
      ? "shadow-quebi-glow-strong"
      : undefined
}

/* ----------------------------------------------------------------------------
 * Admin stepper
 * ---------------------------------------------------------------------------- */

function AdminStepper({
  steps,
  glow,
  className,
  ariaLabel,
}: {
  steps: StepItem[]
  glow: boolean
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
              <AdminBullet index={i + 1} status={step.status} glow={glow} />
              {step.label ? (
                <span
                  className={cn(
                    "text-[13px] font-semibold transition-colors duration-150",
                    step.status === "active"
                      ? "text-quebi-fg"
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

function AdminBullet({
  index,
  status,
  glow,
}: {
  index: number
  status: StepStatus
  glow: boolean
}) {
  const base =
    "inline-flex size-8 items-center justify-center rounded-full border-2 text-[13px] font-bold transition-all duration-200"
  const state =
    status === "done"
      ? "border-transparent bg-quebi-brand text-quebi-on-brand"
      : status === "active"
        ? "border-quebi-brand-mark bg-quebi-bg text-quebi-brand-text"
        : "border-transparent bg-quebi-surface/[0.06] text-quebi-fg-subtle"
  return (
    <span
      aria-current={status === "active" ? "step" : undefined}
      className={cn(base, state, glow && glowFor(status))}
    >
      {index}
    </span>
  )
}

/* ----------------------------------------------------------------------------
 * Kiosk stepper
 * ---------------------------------------------------------------------------- */

function KioskStepper({
  steps,
  glow,
  className,
  ariaLabel,
}: {
  steps: StepItem[]
  glow: boolean
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
            <KioskBullet index={i + 1} status={step.status} glow={glow} />
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

function KioskBullet({
  index,
  status,
  glow,
}: {
  index: number
  status: StepStatus
  glow: boolean
}) {
  const base =
    "inline-flex size-7 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-all duration-200"
  const state =
    status === "done"
      ? "border-transparent bg-quebi-brand text-quebi-on-brand"
      : status === "active"
        ? "border-quebi-brand-mark bg-quebi-bg text-quebi-brand-text"
        : "border-transparent bg-quebi-surface/[0.06] text-quebi-fg-subtle"
  return (
    <span
      aria-current={status === "active" ? "step" : undefined}
      className={cn(base, state, glow && glowFor(status))}
    >
      {status === "done" ? "✓" : index}
    </span>
  )
}
