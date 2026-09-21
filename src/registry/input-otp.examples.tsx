import { useState } from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/input-otp"
import type { ComponentExample } from "./types"

export const inputOtpExamples: ComponentExample[] = [
  {
    title: "Default",
    description:
      "A six-digit code in a single group. One input sits under all six slots: click a digit you have typed to correct it, and anything further right lands on the first empty slot.",
    render: () => (
      <InputOTP maxLength={6} aria-label="One-time password">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    ),
  },
  {
    title: "Sizes",
    description:
      "xs (30px), sm (38px), and the default md (42px) — a slot is as tall as a field of the same step, and square. The size reaches the slots through the field-size context, so it is written once on InputOTP and a code field in a table cell is small without anyone saying so.",
    render: () => (
      <div className="flex flex-col gap-3">
        {(["xs", "sm", "md"] as const).map((size) => (
          <InputOTP key={size} size={size} maxLength={4} aria-label={`Code (${size})`}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        ))}
      </div>
    ),
  },
  {
    title: "With separator",
    description: "Two groups of three split by a separator.",
    render: () => (
      <InputOTP maxLength={6} aria-label="One-time password">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    ),
  },
  {
    title: "Disabled",
    render: () => (
      <InputOTP maxLength={4} disabled aria-label="One-time password">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    ),
  },
  {
    title: "Controlled",
    description: "Reads the current value as you type.",
    render: () => {
      const ControlledExample = () => {
        const [value, setValue] = useState("")
        return (
          <div className="flex flex-col items-start gap-3">
            <InputOTP
              maxLength={6}
              value={value}
              onChange={setValue}
              aria-label="One-time password"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-sm text-quebi-fg-muted">
              {value === "" ? "Enter your code" : `Code: ${value}`}
            </p>
          </div>
        )
      }
      return <ControlledExample />
    },
  },
]
