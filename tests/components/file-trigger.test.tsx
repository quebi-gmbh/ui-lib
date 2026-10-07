/**
 * Which scale a FileTrigger is on.
 *
 * FileTrigger renders a Button, so it inherits whatever Button's default size
 * is — and Button's default is the CTA scale (`md`, 46px). That read wrong on
 * every picker at once (task #135): a picker is a field control, it sits next
 * to an Input and inside a DropZone, and every field-shaped control in the
 * library is 38px at its default size. The fix is a different default here,
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
  test("is the field scale's sm: the same type and the same vertical padding", () => {
    render(<FileTrigger />)
    const classes = classesOf(trigger())

    // `inputSizeStyles.sm` is "text-sm px-0 py-2". The type and the vertical
    // padding are what put a picker on an Input's baseline and height. The
    // horizontal padding is the one value that cannot carry over: an
    // underline-only field runs to its edges, a button with a border cannot.
    for (const token of inputSizeStyles.sm.split(" ").filter((t) => !t.startsWith("px-"))) {
      expect(classes).toContain(token)
    }
  })

  test("is not Button's CTA scale", () => {
    render(<FileTrigger />)
    // Button's `md` is the design's 46px call to action; a picker beside a
    // 38px field at that height reads as the page's primary action.
    expect(classesOf(trigger())).not.toContain("py-3")
  })
})

describe("FileTrigger's size prop", () => {
  test("still reaches the CTA scale when a consumer asks for it", () => {
    // The default moved; the escape hatch did not. `size="md"` is how someone
    // who wants the picker to read as a call to action says so.
    render(<FileTrigger size="md" />)
    expect(classesOf(trigger())).toContain("py-3")
  })
})
