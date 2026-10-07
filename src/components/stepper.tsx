import { cn } from "@/lib/utils"

/**
 * Stepper — quebi design system
 *
 * A horizontal progress indicator for multi-step flows, drawn in ink.
 *
 *   Admin (variant="admin", default):
 *     - row of 32px bullets + labels, joined by 1px rules
 *     - states: upcoming (hairline ring, subtle number), done (rule ring, ink
 *       number), active (solid action fill)
 *     - the rule following a done step is ink; the rest are hairlines
 *
 *   Kiosk (variant="kiosk"):
 *     - 28px bullets, no labels, short connector rules
 *     - done shows a checkmark; active shows the step number
 *
 * Exactly one bullet is filled — the one the reader is on — so the eye finds it
 * without a hue or a halo. Done and upcoming differ by the weight of their ring
 * and their ink, the way the rest of the system tells strong from quiet.
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
  /** @deprecated Draws nothing: the design has no shadows in the page flow.
   * Still accepted so existing callers compile. */
  glow?: boolean
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

/** Shared by both bullet sizes so the two variants cannot drift. */
const BULLET_STATE: Record<StepStatus, string> = {
  done: "border-quebi-rule bg-transparent text-quebi-fg",
  active: "border-quebi-action bg-quebi-action text-quebi-on-action",
  upcoming: "border-quebi-hairline bg-transparent text-quebi-fg-subtle",
}

/** The rule after a step: ink once the step is done, a hairline before. */
function connectorFor(status: StepStatus) {
  return status === "done" ? "bg-quebi-rule" : "bg-quebi-hairline"
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
        return (
          <li key={step.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <AdminBullet index={i + 1} status={step.status} />
              {step.label ? (
                <span
                  className={cn(
                    "text-quebi-body-s transition-colors duration-150",
                    step.status === "active" && "font-medium",
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
                  "mx-3.5 h-px flex-1 transition-colors duration-150",
                  connectorFor(step.status),
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
}: {
  index: number
  status: StepStatus
}) {
  const base =
    "inline-flex size-8 items-center justify-center rounded-full border font-mono text-xs tabular-nums transition-colors duration-150"
  return (
    <span
      aria-current={status === "active" ? "step" : undefined}
      className={cn(base, BULLET_STATE[status])}
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
                  "h-px w-7 flex-none transition-colors duration-150",
                  connectorFor(step.status),
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
}: {
  index: number
  status: StepStatus
}) {
  const base =
    "inline-flex size-7 items-center justify-center rounded-full border font-mono text-xs tabular-nums transition-colors duration-150"
  return (
    <span
      aria-current={status === "active" ? "step" : undefined}
      className={cn(base, BULLET_STATE[status])}
    >
      {status === "done" ? "✓" : index}
    </span>
  )
}
