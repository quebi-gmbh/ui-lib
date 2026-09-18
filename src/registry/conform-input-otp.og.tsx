import { ConformInputOTP } from "@/components/conform-input-otp"
import { InputOTPGroup, InputOTPSlot } from "@/components/input-otp"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformInputOtpOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <OgForm<{ code: string }> defaultValue={{ code: "1408" }} className="w-fit">
      {(fields) => (
        <ConformInputOTP
          field={fields.code}
          label="Verification code"
          description="We sent it to your email."
          maxLength={6}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </ConformInputOTP>
      )}
    </OgForm>
  ),
}
