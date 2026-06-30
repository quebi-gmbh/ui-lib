import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { FormattedStorage } from "./formatted-storage"

describe("FormattedStorage", () => {
  it("formats storage in GB correctly", () => {
    const { container } = render(<FormattedStorage value={128} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("128GB")
  })

  it("formats storage in GB for 256GB", () => {
    const { container } = render(<FormattedStorage value={256} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("256GB")
  })

  it("formats storage in GB for 512GB", () => {
    const { container } = render(<FormattedStorage value={512} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("512GB")
  })

  it("converts 1024GB to 1TB", () => {
    const { container } = render(<FormattedStorage value={1024} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("1TB")
  })

  it("converts 2048GB to 2TB", () => {
    const { container } = render(<FormattedStorage value={2048} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("2TB")
  })

  it("converts 1536GB to 1.5TB", () => {
    const { container } = render(<FormattedStorage value={1536} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("1.5TB")
  })

  it("handles null value by rendering nothing", () => {
    const { container } = render(<FormattedStorage value={null} />)
    const element = container.querySelector("span")
    expect(element).toBeFalsy()
  })

  it("handles undefined value by rendering nothing", () => {
    const { container } = render(<FormattedStorage value={undefined} />)
    const element = container.querySelector("span")
    expect(element).toBeFalsy()
  })

  it("handles 0 value by rendering nothing", () => {
    const { container } = render(<FormattedStorage value={0} />)
    const element = container.querySelector("span")
    expect(element).toBeFalsy()
  })

  it("applies custom className", () => {
    const { container } = render(<FormattedStorage value={128} className="custom-class" />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.className).toContain("custom-class")
    expect(element?.textContent).toBe("128GB")
  })

  it("formats large TB values correctly", () => {
    const { container } = render(<FormattedStorage value={4096} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("4TB")
  })

  it("formats fractional TB values with one decimal place", () => {
    const { container } = render(<FormattedStorage value={1280} />)
    const element = container.querySelector("span")
    expect(element).toBeTruthy()
    expect(element?.textContent).toBe("1.3TB")
  })
})
