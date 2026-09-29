/**
 * StructuredInput: the format is the validation, so what it refuses and what
 * it accepts is the behaviour worth pinning — the prefix pattern `input-otp`
 * tests every edit against, the upper-casing, the paste clean-up, and the
 * checksum that turns a complete value invalid.
 */
import { describe, expect, test } from "bun:test"
import { fireEvent, render } from "@testing-library/react"
import {
  abaChecksumOk,
  bic,
  cardNumber,
  dateDMY,
  digits,
  formatLength,
  formatPattern,
  formatValue,
  iban,
  ibanChecksumOk,
  isValidStructured,
  luhnOk,
  StructuredInput,
} from "../../src/components/structured-input"

describe("formatPattern", () => {
  test("accepts every prefix of a well-shaped value and nothing else", () => {
    const pattern = new RegExp(formatPattern(bic))
    for (let i = 0; i <= 11; i++) expect(pattern.test("DEUTDEFF500".slice(0, i))).toBe(true)
    expect(pattern.test("deutdeff500")).toBe(true)
    expect(pattern.test("DEU1")).toBe(false)
    expect(pattern.test("DEUTDEFF5000")).toBe(false)
  })

  test("a lower-case letter in a group is a literal, not the letter token", () => {
    const pattern = new RegExp(formatPattern(iban("AT")))
    expect(pattern.test("AT6")).toBe(true)
    expect(pattern.test("at6")).toBe(true)
    expect(pattern.test("BT")).toBe(false)
  })
})

describe("formats", () => {
  test("lengths match the published shapes", () => {
    expect(formatLength(iban("DE"))).toBe(22)
    expect(formatLength(iban("GB"))).toBe(22)
    expect(formatLength(iban("NL"))).toBe(18)
    expect(formatLength(iban("FR"))).toBe(27)
    expect(formatLength(digits(9))).toBe(9)
    expect(digits(9).groups).toEqual(["999", "999", "999"])
  })

  test("formatValue puts the separators back", () => {
    expect(formatValue(iban("DE"), "DE89370400440532013000")).toBe("DE89 3704 0044 0532 0130 00")
    expect(formatValue(dateDMY, "2902")).toBe("29.02")
  })

  test("checksums", () => {
    expect(ibanChecksumOk("DE89370400440532013000")).toBe(true)
    expect(ibanChecksumOk("DE89370400440532013001")).toBe(false)
    expect(ibanChecksumOk("GB29NWBK60161331926819")).toBe(true)
    expect(luhnOk("4242424242424242")).toBe(true)
    expect(luhnOk("4242424242424241")).toBe(false)
    expect(abaChecksumOk("021000021")).toBe(true)
    expect(abaChecksumOk("021000022")).toBe(false)
  })

  test("isValidStructured needs a complete value that passes the check", () => {
    expect(isValidStructured(bic, "DEUTDEFF")).toBe(true)
    expect(isValidStructured(bic, "DEUTDEFF500")).toBe(true)
    expect(isValidStructured(bic, "DEUTDEF")).toBe(false)
    expect(isValidStructured(cardNumber, "4242424242424242")).toBe(true)
    expect(isValidStructured(dateDMY, "29022024")).toBe(true)
    expect(isValidStructured(dateDMY, "29022023")).toBe(false)
  })
})

function renderField(ui: React.ReactElement) {
  const { container } = render(ui)
  const input = container.querySelector<HTMLInputElement>('input[data-slot="input-otp"]')
  if (!input) throw new Error("no input rendered")
  const slots = Array.from(container.querySelectorAll<HTMLElement>('[data-slot="input-otp-slot"]'))
  return { input, slots, container }
}

describe("StructuredInput", () => {
  test("draws one slot per position, in the format's groups", () => {
    const { slots, container } = renderField(<StructuredInput format={iban("DE")} aria-label="IBAN" />)
    expect(slots).toHaveLength(22)
    expect(container.querySelectorAll('[data-slot="input-otp-group"]')).toHaveLength(6)
  })

  test("upper-cases what it accepts and refuses what does not fit", () => {
    const values: string[] = []
    const { input } = renderField(
      <StructuredInput format={bic} onChange={(value) => values.push(value)} aria-label="BIC" />,
    )
    fireEvent.change(input, { target: { value: "deut" } })
    expect(values.at(-1)).toBe("DEUT")
    expect(input.value).toBe("DEUT")
    fireEvent.change(input, { target: { value: "DEUT1" } })
    expect(values.at(-1)).toBe("DEUT")
  })

  test("a complete value that fails its check is invalid; a passing one is not", () => {
    const bad = renderField(
      <StructuredInput format={iban("DE")} defaultValue="DE89370400440532013001" aria-label="IBAN" />,
    )
    expect(bad.input.getAttribute("aria-invalid")).toBe("true")
    expect(bad.slots[0]?.getAttribute("aria-invalid")).toBe("true")

    const good = renderField(
      <StructuredInput format={iban("DE")} defaultValue="DE89370400440532013000" aria-label="IBAN" />,
    )
    expect(good.input.hasAttribute("aria-invalid")).toBe(false)
  })

  test("isInvalid overrides the check", () => {
    const { input } = renderField(
      <StructuredInput format={bic} defaultValue="DEUT" isInvalid aria-label="BIC" />,
    )
    expect(input.getAttribute("aria-invalid")).toBe("true")
  })
})
