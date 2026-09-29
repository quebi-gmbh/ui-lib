"use client"

import { Fragment, useState } from "react"
import { cn } from "@/lib/utils"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/input-otp"

/**
 * A fixed-shape code, described as data.
 *
 * Each group is a string of position tokens:
 *
 * - `9` — a digit
 * - `A` — a letter (typed in either case, stored upper-case)
 * - `*` — a letter or a digit
 * - `H` — a hexadecimal digit
 * - anything else, a lower-case letter included — that literal character,
 *   matched in either case. `iban("AT")` starts with `"at99"`: the country code
 *   is typed, nothing else fits there, and the `a` is not the letter token.
 *
 * The tokens are the whole of the input validation: a character that does not
 * fit its position is refused as it is typed or pasted, so the value is always
 * a prefix of a well-shaped code. What the shape cannot say — a checksum, a
 * month that is at most 12 — is `validate`, which runs once the code is
 * complete.
 */
export interface StructuredFormat {
  /** One token string per visual group. */
  groups: readonly string[]
  /** What sits between two groups. `"gap"` is space alone. Default `"dash"`. */
  separator?: "gap" | "dash" | "/" | "." | ":"
  /**
   * The shortest complete value, when the tail is optional — a BIC is eight
   * characters or eleven. Defaults to every position.
   */
  minLength?: number
  /** Shown in the empty slots, one character per position, e.g. `"MMYY"`. */
  placeholder?: string
  /** Runs on a complete value; `false` marks the field invalid. */
  validate?: (value: string) => boolean
}

const tokenClass: Record<string, string> = {
  "9": "[0-9]",
  A: "[A-Za-z]",
  "*": "[A-Za-z0-9]",
  H: "[0-9A-Fa-f]",
}

function positionClass(token: string): string {
  const known = tokenClass[token]
  if (known) return known
  const lower = token.toLowerCase()
  const upper = token.toUpperCase()
  const escapeClass = (c: string) => c.replace(/[\\^\]-]/g, "\\$&")
  return lower === upper ? `[${escapeClass(token)}]` : `[${escapeClass(upper)}${escapeClass(lower)}]`
}

/**
 * The pattern `input-otp` tests every edit against. It sees the whole value
 * after each keystroke, not the one character, so the expression has to accept
 * every *prefix* of a valid code: `^(?:a(?:b(?:c)?)?)?$`.
 */
export function formatPattern(format: StructuredFormat): string {
  const tokens = format.groups.join("").split("")
  const nested = tokens.reduceRight((inner, token) => `(?:${positionClass(token)}${inner})?`, "")
  return `^${nested}$`
}

/** How many characters a complete value has, at most. */
export function formatLength(format: StructuredFormat): number {
  return format.groups.reduce((sum, group) => sum + group.length, 0)
}

/**
 * The value with its separators put back, for display outside the field:
 * `formatValue(iban("DE"), "DE89370400440532013000")` is
 * `"DE89 3704 0044 0532 0130 00"`.
 */
export function formatValue(format: StructuredFormat, value: string): string {
  const joiner = { gap: " ", dash: "-", "/": "/", ".": ".", ":": ":" }[format.separator ?? "dash"]
  const parts: string[] = []
  let offset = 0
  for (const group of format.groups) {
    const part = value.slice(offset, offset + group.length)
    if (part) parts.push(part)
    offset += group.length
  }
  return parts.join(joiner)
}

/** True when `value` is complete and passes the format's own check. */
export function isValidStructured(format: StructuredFormat, value: string): boolean {
  const complete =
    value.length === formatLength(format) ||
    (format.minLength !== undefined && value.length === format.minLength)
  return (
    complete &&
    new RegExp(formatPattern(format)).test(value) &&
    (format.validate?.(value) ?? true)
  )
}

/* ------------------------------------------------------------------------- */
/* Checksums                                                                   */
/* ------------------------------------------------------------------------- */

/** ISO 13616: move the first four characters to the end, letters to 10–35, mod 97 is 1. */
export function ibanChecksumOk(iban: string): boolean {
  const rearranged = (iban.slice(4) + iban.slice(0, 4)).toUpperCase()
  let remainder = 0
  for (const char of rearranged) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97
  }
  return remainder === 1
}

/** Luhn, as on every payment card number. */
export function luhnOk(digits: string): boolean {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

/** ABA routing number: weights 3-7-1 across the nine digits, sum mod 10 is 0. */
export function abaChecksumOk(digits: string): boolean {
  const weights = [3, 7, 1]
  let sum = 0
  for (let i = 0; i < digits.length; i++) sum += Number(digits[i]) * (weights[i % 3] ?? 0)
  return sum % 10 === 0
}

/* ------------------------------------------------------------------------- */
/* Formats                                                                     */
/* ------------------------------------------------------------------------- */

/**
 * The BBAN — the country-specific part after `CC99` — for the countries an
 * IBAN field here is most often asked for. The shapes are the SWIFT registry's;
 * add a row to support another country.
 */
export const ibanCountries = {
  AT: "9999999999999999",
  BE: "999999999999",
  CH: "99999************",
  DE: "999999999999999999",
  ES: "99999999999999999999",
  FR: "9999999999***********99",
  GB: "AAAA99999999999999",
  IT: "A9999999999************",
  LU: "999*************",
  NL: "AAAA9999999999",
} as const

export type IbanCountry = keyof typeof ibanCountries

/** Split a token string into groups of `size`, the last one possibly short. */
function chunk(tokens: string, size: number): string[] {
  const groups: string[] = []
  for (let i = 0; i < tokens.length; i += size) groups.push(tokens.slice(i, i + size))
  return groups
}

/**
 * An IBAN for one country, in the groups of four it is printed in. The country
 * code is fixed — `DE` is the only thing the first two slots accept, and it is
 * shown there until typing starts — because the length and the shape of
 * everything after it depend on it.
 */
export function iban(country: IbanCountry): StructuredFormat {
  return {
    groups: chunk(`${country.toLowerCase()}99${ibanCountries[country]}`, 4),
    separator: "gap",
    placeholder: country,
    validate: ibanChecksumOk,
  }
}

/**
 * A BIC (SWIFT code): bank, country, location and — optionally — branch.
 * Eight characters are a complete BIC; the branch makes it eleven.
 */
export const bic: StructuredFormat = {
  groups: ["AAAA", "AA", "**", "***"],
  separator: "gap",
  minLength: 8,
}

/**
 * `length` digits in groups of `groupSize` — a nine-digit reference number is
 * `digits(9)`, three groups of three.
 */
export function digits(length: number, groupSize = 3): StructuredFormat {
  return { groups: chunk("9".repeat(length), groupSize), separator: "gap" }
}

/** A US routing (ABA) number: nine digits with a 3-7-1 check. */
export const routingNumber: StructuredFormat = {
  groups: ["9999", "9999", "9"],
  separator: "gap",
  validate: abaChecksumOk,
}

/** A US Social Security number, 3-2-4. */
export const ssn: StructuredFormat = {
  groups: ["999", "99", "9999"],
  separator: "dash",
  validate: (value) =>
    !value.startsWith("000") &&
    !value.startsWith("666") &&
    !value.startsWith("9") &&
    value.slice(3, 5) !== "00" &&
    value.slice(5) !== "0000",
}

/** A UK bank sort code, 99-99-99. */
export const sortCode: StructuredFormat = {
  groups: ["99", "99", "99"],
  separator: "dash",
}

/** A sixteen-digit payment card number, Luhn-checked. */
export const cardNumber: StructuredFormat = {
  groups: ["9999", "9999", "9999", "9999"],
  separator: "gap",
  validate: luhnOk,
}

/** A card expiry, MM/YY, with the month checked. */
export const cardExpiry: StructuredFormat = {
  groups: ["99", "99"],
  separator: "/",
  placeholder: "MMYY",
  validate: (value) => {
    const month = Number(value.slice(0, 2))
    return month >= 1 && month <= 12
  },
}

/** A day-first date, DD.MM.YYYY, checked against the calendar. */
export const dateDMY: StructuredFormat = {
  groups: ["99", "99", "9999"],
  separator: ".",
  placeholder: "DDMMYYYY",
  validate: (value) => {
    const day = Number(value.slice(0, 2))
    const month = Number(value.slice(2, 4))
    const year = Number(value.slice(4))
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  },
}

/** A 24-hour time, HH:MM. */
export const time24: StructuredFormat = {
  groups: ["99", "99"],
  separator: ":",
  placeholder: "HHMM",
  validate: (value) => Number(value.slice(0, 2)) < 24 && Number(value.slice(2)) < 60,
}

/** A MAC address, six hex pairs. */
export const macAddress: StructuredFormat = {
  groups: ["HH", "HH", "HH", "HH", "HH", "HH"],
  separator: ":",
}

/** A licence or activation key, five groups of five letters or digits. */
export const licenseKey: StructuredFormat = {
  groups: ["*****", "*****", "*****", "*****", "*****"],
  separator: "dash",
}

/** A German postal code (PLZ), five digits in one group. */
export const postalCodeDE: StructuredFormat = {
  groups: ["99999"],
}

/**
 * The formats above, by name — for an example list or a picker. Each one is
 * also exported on its own.
 */
export const structuredFormats = {
  ibanDE: iban("DE"),
  bic,
  digits9: digits(9),
  routingNumber,
  ssn,
  sortCode,
  cardNumber,
  cardExpiry,
  dateDMY,
  time24,
  macAddress,
  licenseKey,
  postalCodeDE,
} satisfies Record<string, StructuredFormat>

/* ------------------------------------------------------------------------- */
/* Component                                                                   */
/* ------------------------------------------------------------------------- */

type InputOTPProps = React.ComponentProps<typeof InputOTP>

export type StructuredInputProps = Omit<
  InputOTPProps,
  | "children"
  | "render"
  | "maxLength"
  | "pattern"
  | "value"
  | "defaultValue"
  | "onChange"
  | "placeholder"
> & {
  /** The shape of the code — a preset such as `iban("DE")` or `bic`, or your own. */
  format: StructuredFormat
  value?: string
  defaultValue?: string
  /** Called with the raw value — no separators, letters upper-cased. */
  onChange?: (value: string) => void
  /**
   * Force the invalid style. Left unset, the field turns invalid by itself
   * when the value is complete and `format.validate` rejects it.
   */
  isInvalid?: boolean
  /** Extra classes for each slot. */
  slotClassName?: string
}

function Separator({ kind }: { kind: NonNullable<StructuredFormat["separator"]> }) {
  if (kind === "dash") return <InputOTPSeparator />
  if (kind === "gap") return <span aria-hidden="true" className="w-1" />
  return (
    <span aria-hidden="true" className="text-lg text-quebi-fg-subtle">
      {kind}
    </span>
  )
}

/**
 * StructuredInput — quebi design system
 *
 * `InputOTP`, generalised: a code of fixed shape — an IBAN, a BIC, a routing
 * number, a card expiry — described once as a `StructuredFormat` and drawn as
 * slots in the groups it is printed in. Each position accepts only what can go
 * there, letters are upper-cased, a paste has its spaces and dashes stripped,
 * and a complete value that fails its checksum turns the field red.
 *
 * The value is always the raw characters — `DE89370400440532013000`, not the
 * spaced form. `formatValue` puts the separators back for display.
 *
 * Reach for it for short codes a person copies off paper. A free-length
 * string with a mask (a phone number, an amount) is `Input` or `NumberField`.
 */
export function StructuredInput({
  format,
  value: valueProp,
  defaultValue = "",
  onChange,
  isInvalid,
  slotClassName,
  containerClassName,
  inputMode,
  ...props
}: StructuredInputProps) {
  // Always controlled underneath: the upper-casing has to reach the slots, and
  // `OTPInput` left to itself would keep the lower-case letters it accepted.
  const [uncontrolled, setUncontrolled] = useState(() => defaultValue.toUpperCase())
  const value = valueProp ?? uncontrolled
  const maxLength = formatLength(format)
  const tokens = format.groups.join("")

  const complete =
    value.length === maxLength ||
    (format.minLength !== undefined && value.length === format.minLength)
  const invalid = isInvalid ?? (complete && format.validate ? !format.validate(value) : false)

  const handleChange = (next: string) => {
    const upper = next.toUpperCase()
    if (valueProp === undefined) setUncontrolled(upper)
    onChange?.(upper)
  }

  let offset = 0
  return (
    <InputOTP
      maxLength={maxLength}
      pattern={formatPattern(format)}
      inputMode={inputMode ?? (/^[9]*$/.test(tokens) ? "numeric" : "text")}
      // A code copied from a statement arrives with the separators it was
      // printed with; they are not part of the value.
      pasteTransformer={(pasted) => pasted.replace(/[\s\-/.:]/g, "").toUpperCase()}
      placeholder={format.placeholder}
      aria-invalid={invalid || undefined}
      containerClassName={cn("flex-wrap", containerClassName)}
      {...props}
      value={value}
      onChange={handleChange}
    >
      {format.groups.map((group, groupIndex) => {
        const start = offset
        offset += group.length
        return (
          <Fragment key={start}>
            {groupIndex > 0 && <Separator kind={format.separator ?? "dash"} />}
            <InputOTPGroup>
              {Array.from(group, (_, i) => start + i).map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  aria-invalid={invalid || undefined}
                  className={slotClassName}
                />
              ))}
            </InputOTPGroup>
          </Fragment>
        )
      })}
    </InputOTP>
  )
}
