"use client"

import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"
import { use } from "react"
import { cn } from "@/lib/utils"

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
  ...props
}: React.ComponentPropsWithoutRef<typeof OTPInput>) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
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
      data-active={isActive}
      className={cn(
        "relative flex size-10 items-center justify-center text-sm text-white",
        "border border-cyan-500/20 border-l-0 bg-white/[0.02] outline-none",
        "transition-[border-color,box-shadow] duration-200",
        "first:rounded-s-quebi-sm first:border-l last:rounded-e-quebi-sm",
        "data-[active=true]:z-10 data-[active=true]:border-quebi-brand",
        "data-[active=true]:ring-2 data-[active=true]:ring-quebi-brand/50",
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
    <div
      data-slot="input-otp-separator"
      role="separator"
      className={cn("text-quebi-fg-subtle", className)}
      {...props}
    >
      <Minus className="size-4" aria-hidden="true" />
    </div>
  )
}
