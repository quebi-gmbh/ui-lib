/**
 * Which scale a FileTrigger is on.
 *
 * FileTrigger renders a Button, so it inherits whatever Button's default size
 * is — and Button's default is the CTA scale (`md`, `text-base`, 46px). That
 * read wrong on every picker at once (task #135): a picker is a field control,
 * it sits next to an Input and inside a DropZone, and every field-shaped
 * control in the library is `text-sm`. The fix is a different default here,
 * which is one word of source and therefore exactly the kind of thing that
 * gets "tidied" back. So the claim the default makes — *this is the field
 * scale, not the CTA scale* — is pinned against `inputSizeStyles` itself
 * rather than against a copy of its values.
 */
import { describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import { FileTrigger } from "../../src/components/file-trigger"
import { inputSizeStyles } from "../../src/components/input"

const classesOf = (element: HTMLElement) => new Set(element.className.split(/\s+/))

const trigger = () => screen.getByRole("button")

describe("FileTrigger's default size", () => {
  test("is the field scale's sm, value for value", () => {
    render(<FileTrigger />)
    const classes = classesOf(trigger())

    // `inputSizeStyles.sm` is "text-sm px-3 py-2" — the same 38px box Button's
    // own `sm` draws. Not "looks similar": the same typography and padding, so
    // a picker beside an Input shares its baseline and its height.
    for (const token of inputSizeStyles.sm.split(" ")) {
      expect(classes).toContain(token)
    }
  })

  test("is not Button's CTA scale", () => {
    render(<FileTrigger />)
    // The regression this file exists for: `text-base` here is 16px against
    // every neighbouring control's 14px.
    expect(classesOf(trigger())).not.toContain("text-base")
  })
})

describe("FileTrigger's size prop", () => {
  test("still reaches the CTA scale when a consumer asks for it", () => {
    // The default moved; the escape hatch did not. `size="md"` is how someone
    // who wants the picker to read as a call to action says so.
    render(<FileTrigger size="md" />)
    expect(classesOf(trigger())).toContain("text-base")
  })
})
