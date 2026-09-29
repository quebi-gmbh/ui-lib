import type { ComponentMeta } from "./types"

export const structuredInputMeta: ComponentMeta = {
  slug: "structured-input",
  name: "Structured Input",
  description:
    "Input OTP, generalised to any fixed-shape code: an IBAN, a BIC, a nine-digit number, a routing number, a card number or expiry, a sort code, a MAC address, a licence key. The shape is data — groups of position tokens (digit, letter, letter-or-digit, hex, literal) — and the field draws one slot per position in the groups the code is printed in, refuses a character that does not fit its position, upper-cases letters, strips spaces and dashes from a paste, and turns red when a complete value fails its checksum (IBAN mod 97, Luhn, ABA). The value is always the raw characters; formatValue puts the separators back for display.",
  category: "Inputs",
  tags: ["form", "input", "iban", "bic", "mask", "code", "banking", "interactive"],
  usage: {
    when: [
      "A short code of fixed shape that a person copies off paper or a screen: IBAN, BIC, routing number, licence key.",
      "A value whose every position has a known kind (digit, letter, hex) and whose checksum you want checked as it is typed.",
    ],
    whenNot: [
      "A one-time password — use InputOTP, which is this without the format.",
      "Free-length text with a loose shape, such as a phone number or an e-mail address — use Input.",
      "An amount or a quantity — use NumberField.",
      "A calendar date or a time the user picks — use DateField or TimeField, which know about locales and calendars.",
    ],
    instead: [
      {
        job: "A verification code",
        use: [{ name: "InputOTP", slug: "input-otp" }],
      },
      {
        job: "A date or a time",
        use: [
          { name: "DateField", slug: "date-field" },
          { name: "TimeField", slug: "time-field" },
        ],
      },
      {
        job: "Free text or a number",
        use: [
          { name: "Input", slug: "input" },
          { name: "NumberField", slug: "number-field" },
        ],
      },
    ],
  },
}
