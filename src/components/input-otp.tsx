"use client"

import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"
import { use, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"

/**
 * The slot the pointer is over, read from the slot's own `data-index` rather
 * than from its position among its siblings — the test is geometric, so it
 * stays correct in RTL and under any layout that splits the slots into groups.
 *
 * Only the horizontal extent is tested. The slots sit in a row under one
 * input that covers the whole container, so the column is what identifies a
 * slot; a container styled taller than its slots would otherwise reject a
 * click that plainly aimed at one.
 */
function slotIndexAt(input: HTMLInputElement, clientX: number): number | null {
  const container = input.closest("[data-input-otp-container]")
  if (!container) return null
  const slots = Array.from(
    container.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'),
  )
  for (const slot of slots) {
    const rect = slot.getBoundingClientRect()
    if (clientX >= rect.left && clientX <= rect.right) {
      const index = Number(slot.dataset.index)
      return Number.isInteger(index) ? index : null
    }
  }
  return null
}

/**
 * InputOTP — quebi design system
 *
 * One-time-password / verification-code input built on the `input-otp`
 * package. Slots use the quebi input style (translucent field, cyan-tinted
 * border); the active slot lifts its border to brand teal with the quebi
 * teal ring. Invalid uses red; disabled dims the whole control.
 */
export function InputOTP({
  className,
  containerClassName,
  onPointerDown,
  ...props
}: React.ComponentPropsWithoutRef<typeof OTPInput>) {
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Put the caret on the slot that was clicked, when the value reaches that
   * far.
   *
   * `OTPInput` is a single `<input>` stretched across every slot, and it draws
   * its text transparently at `letter-spacing: -.5em`, so the whole value
   * occupies a few pixels at the left edge: the caret the browser places from
   * a click has nothing to do with the slot under the pointer, and the end of
   * the value is what almost every click resolves to. `OTPInput`'s own
   * `onFocus` then snaps the caret to the end of the value regardless. Between
   * them, clicking a digit you had already typed selected the last one
   * instead, and there was no way to go back and fix a slot with the mouse.
   *
   * Deriving the offset from the slot geometry fixes that. A slot *past* the
   * end of the value stays unaddressable and is meant to: a caret cannot sit
   * where the string has no character, so those clicks keep landing on the
   * first empty slot — a code is typed left to right and a value with a hole
   * in it has no representation here.
   */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLInputElement>) => {
      onPointerDown?.(event)
      const input = inputRef.current
      if (!input || input.disabled || event.defaultPrevented || event.button !== 0) return
      const index = slotIndexAt(input, event.clientX)
      if (index === null || index >= input.value.length) return
      // Focusing the input, and the snap to end-of-value inside that, are the
      // pointerdown default action — both run after this handler returns, so
      // the correction has to wait for them. A frame later they are done.
      requestAnimationFrame(() => {
        if (document.activeElement !== input) return
        input.setSelectionRange(index, index + 1, "forward")
      })
    },
    [onPointerDown],
  )

  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
      ref={inputRef}
      onPointerDown={handlePointerDown}
    />
  )
}

export function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}

export function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = use(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      // Which slot this is, for the pointer hit test in `InputOTP` — the one
      // place that has to map a click back to an offset in the value.
      data-index={index}
      data-active={isActive}
      className={cn(
        "relative flex size-10 items-center justify-center text-sm text-quebi-fg",
        "border border-quebi-line/20 border-l-0 bg-quebi-surface/[0.02] outline-none",
        "transition-[border-color,box-shadow] duration-200",
        "first:rounded-s-quebi-sm first:border-l last:rounded-e-quebi-sm",
        "data-[active=true]:z-10 data-[active=true]:border-quebi-brand-mark",
        "data-[active=true]:ring-2 data-[active=true]:ring-quebi-brand-mark",
        "aria-invalid:border-red-500 data-[active=true]:aria-invalid:border-red-500 data-[active=true]:aria-invalid:ring-red-500/50",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-quebi-brand duration-1000" />
        </div>
      )}
    </div>
  )
}

export function InputOTPSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    // The dash between two groups of slots is decorative: the slots either
    // side already carry the accessible structure, and a `separator` role here
    // announced a divider that means nothing to someone typing a code. Hidden
    // from the accessibility tree it is what it looks like — a visual gap.
    <div
      data-slot="input-otp-separator"
      aria-hidden="true"
      className={cn("text-quebi-fg-subtle", className)}
      {...props}
    >
      <Minus className="size-4" />
    </div>
  )
}
