import { useState } from "react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/input-otp"
import type { OgScene } from "./types"

/**
 * Four of six digits in. Half-typed rather than blank or complete: the empty
 * slots are what say this is a code field and not six small boxes.
 */
const PartialCode = () => {
  const [value] = useState("1408")

  return (
    <InputOTP maxLength={6} value={value} onChange={() => {}} aria-label="One-time password">
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}

export const inputOtpOgScene: OgScene = {
  scale: 2.4,
  render: () => <PartialCode />,
}
