import type { ComponentMeta } from "./types"

export const inputOtpMeta: ComponentMeta = {
  slug: "input-otp",
  name: "Input OTP",
  description:
    "One-time-password / verification-code input built on the input-otp package, styled with the quebi design system. Each slot is an underlined cell and the active slot's line thickens; supports separators, invalid, and disabled states. The whole control is one input rather than one per slot: click a slot you have already typed to put the caret on it, but a slot ahead of the code is not selectable — clicking there, like typing, moves to the first empty slot, because a half-entered code has no representation with a gap in the middle.",
  category: "Inputs",
  tags: ["form", "input", "otp", "code", "verification", "interactive"],
}
