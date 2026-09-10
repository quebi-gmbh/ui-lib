/**
 * The polar and hierarchical charts.
 *
 * These six wrappers all make the same kind of decision before recharts ever
 * sees them — which hue a node gets, which series is a bar and which a line,
 * whether the legend can tell two series apart — and none of that is visible to
 * type checking. What is asserted here is that decision, not the geometry
 * recharts computes from it.
 *
 * Two practical limits shape the file. `Chart` wraps a `ResponsiveContainer`,
 * so nothing renders at all until the container has a size: `useFakeLayout()`
 * gives every element one, and puts the real descriptors back afterwards so the
 * rest of the suite still measures zero. And the cartesian charts need text
 * metrics happy-dom does not provide — their axes and marks stay unrendered
 * even with a size — so the cases below are the polar and hierarchical charts,
 * plus the legend, which is ordinary HTML in every one of them.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { getComponent } from "../../src/registry"
import { RadarChart } from "../../src/components/radar-chart"
import { RadialBarChart } from "../../src/components/radial-bar-chart"
import { ScatterChart } from "../../src/components/scatter-chart"
import { SunburstChart } from "../../src/components/sunburst-chart"
import { Treemap } from "../../src/components/treemap"

const WIDTH = 640
const HEIGHT = 360

const SIZES = [
  ["offsetWidth", WIDTH],
  ["clientWidth", WIDTH],
  ["offsetHeight", HEIGHT],
  ["clientHeight", HEIGHT],
] as const

function useFakeLayout() {
  const saved = new Map<string, PropertyDescriptor | undefined>()

  beforeAll(() => {
    for (const [property, value] of SIZES) {
      saved.set(property, Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, property))
      Object.defineProperty(window.HTMLElement.prototype, property, { configurable: true, value })
    }
    saved.set(
      "getBoundingClientRect",
      Object.getOwnPropertyDescriptor(window.Element.prototype, "getBoundingClientRect"),
    )
    Object.defineProperty(window.Element.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        width: WIDTH,
        height: HEIGHT,
        top: 0,
        left: 0,
        bottom: HEIGHT,
        right: WIDTH,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })
  })

  afterAll(() => {
    for (const [property, descriptor] of saved) {
      const target =
        property === "getBoundingClientRect" ? window.Element.prototype : window.HTMLElement.prototype
      if (descriptor) {
        Object.defineProperty(target, property, descriptor)
      } else {
        Reflect.deleteProperty(target, property)
      }
    }
  })
}

const fillsOf = (container: HTMLElement, selector: string) =>
  Array.from(container.querySelectorAll(selector)).map((node) => node.getAttribute("fill"))

const TEAL = "var(--color-quebi-brand)"

describe("charts", () => {
  useFakeLayout()

  describe("RadarChart", () => {
    const data = [
      { skill: "Speed", current: 120, target: 150 },
      { skill: "Docs", current: 99, target: 120 },
      { skill: "Cost", current: 65, target: 100 },
    ]

    test("draws one polygon per config key, in palette order", () => {
      const { container } = render(
        <RadarChart
          config={{ current: { label: "Current" }, target: { label: "Target" } }}
          data={data}
          dataKey="skill"
          containerHeight={300}
        />,
      )

      const polygons = container.querySelectorAll(".recharts-radar-polygon path")
      expect(polygons).toHaveLength(2)
      expect(polygons[0]?.getAttribute("stroke")).toBe(TEAL)
      expect(polygons[1]?.getAttribute("stroke")).not.toBe(TEAL)
    })

    test("a config colour overrides the palette slot", () => {
      const { container } = render(
        <RadarChart
          config={{ current: { label: "Current", color: "chart-3" } }}
          data={data}
          dataKey="skill"
          containerHeight={300}
        />,
      )

      expect(
        container.querySelector(".recharts-radar-polygon path")?.getAttribute("stroke"),
      ).not.toBe(TEAL)
    })
  })

  describe("RadialBarChart", () => {
    test("the centered label is the value, through valueFormatter", () => {
      const { container } = render(
        <RadialBarChart
          config={{ uptime: { label: "Uptime" } }}
          data={[{ name: "Uptime", uptime: 96.4 }]}
          dataKey="name"
          angleDomain={[0, 100]}
          showLabel
          labelDescription="This quarter"
          valueFormatter={(value) => `${value}%`}
          legend={false}
          containerHeight={260}
        />,
      )

      const label = container.querySelector("[data-slot='label']")
      expect(label?.textContent).toContain("96.4%")
      expect(label?.textContent).toContain("This quarter")
    })

    test("an explicit label wins over the computed one", () => {
      const { container } = render(
        <RadialBarChart
          config={{ uptime: { label: "Uptime" } }}
          data={[{ name: "Uptime", uptime: 96.4 }]}
          dataKey="name"
          showLabel
          label="Healthy"
          legend={false}
          containerHeight={260}
        />,
      )

      expect(container.querySelector("[data-slot='label']")?.textContent).toContain("Healthy")
    })

    test("no centered label unless it is asked for", () => {
      const { container } = render(
        <RadialBarChart
          config={{ uptime: { label: "Uptime" } }}
          data={[{ name: "Uptime", uptime: 96.4 }]}
          dataKey="name"
          legend={false}
          containerHeight={260}
        />,
      )

      expect(container.querySelector("[data-slot='label']")).toBeNull()
    })
  })

  describe("Treemap", () => {
    const nested = [
      { name: "Forms", children: [{ name: "Input", size: 6 }, { name: "Select", size: 4 }] },
      { name: "Charts", children: [{ name: "Bar", size: 5 }] },
    ]

    test("a leaf inherits its branch's hue, and two branches differ", () => {
      const { container } = render(
        <Treemap config={{}} data={nested} dataKey="size" containerHeight={300} />,
      )

      const fills = fillsOf(container, "rect")
      expect(fills.length).toBeGreaterThan(0)

      const hues = new Set(fills)
      // Two branches, two hues — every rectangle of a branch, frame and leaves
      // alike, carries the branch's own colour.
      expect(hues.size).toBe(2)
      expect(hues).toContain(TEAL)
    })

    test("a config entry named after a branch repaints that branch", () => {
      const { container } = render(
        <Treemap
          config={{ Forms: { label: "Forms", color: "chart-5" } }}
          data={nested}
          dataKey="size"
          containerHeight={300}
        />,
      )

      // The overridden branch is no longer the first palette slot; the branch
      // that was not named still is.
      const fills = new Set(fillsOf(container, "rect"))
      expect(fills.has(TEAL)).toBe(false)
    })

    test("showValues labels the leaves through valueFormatter", () => {
      render(
        <Treemap
          config={{}}
          data={nested}
          dataKey="size"
          showValues
          valueFormatter={(value) => `${value} kB`}
          containerHeight={300}
        />,
      )

      expect(screen.getByText("6 kB")).toBeInTheDocument()
    })
  })

  describe("SunburstChart", () => {
    const traffic = {
      name: "All",
      value: 10,
      children: [
        { name: "Direct", value: 6, children: [{ name: "Bookmarks", value: 6 }] },
        { name: "Search", value: 4 },
      ],
    }

    test("a ring segment inherits the hue of the branch it belongs to", () => {
      const { container } = render(
        <SunburstChart config={{}} data={traffic} containerHeight={300} />,
      )

      const fills = fillsOf(container, "path")
      // Direct and its child ring are one hue; Search is the next one.
      expect(fills).toHaveLength(3)
      expect(fills[0]).toBe(TEAL)
      expect(fills[1]).toBe(TEAL)
      expect(fills[2]).not.toBe(TEAL)
    })

    test("hideValues drops the numbers recharts prints inside each segment", () => {
      const withValues = render(<SunburstChart config={{}} data={traffic} containerHeight={300} />)
      expect(withValues.container.querySelectorAll("text").length).toBeGreaterThan(0)
      withValues.unmount()

      const { container } = render(
        <SunburstChart config={{}} data={traffic} hideValues containerHeight={300} />,
      )
      // The text is still in the tree for the tooltip's sake — what changes is
      // that it is painted in nothing at all.
      for (const text of Array.from(container.querySelectorAll("text"))) {
        expect(text.getAttribute("fill")).toBe("transparent")
      }
    })
  })

  describe("ScatterChart", () => {
    const series = [
      { name: "morning", data: [{ h: 161, w: 55 }, { h: 175, w: 71 }] },
      { name: "evening", data: [{ h: 158, w: 51 }, { h: 172, w: 64 }] },
    ]
    const config = {
      morning: { label: "Morning" },
      evening: { label: "Evening" },
    }

    test("each series gets its own legend entry", () => {
      // A scatter series carries its points in its own `data` and has no data
      // key to be named by, so before ChartLegendContent fell back to the
      // payload's value both entries landed on the same id.
      render(
        <ScatterChart
          config={config}
          series={series}
          dataKey="h"
          yKey="w"
          containerHeight={280}
        />,
      )

      expect(screen.getByText("Morning")).toBeInTheDocument()
      expect(screen.getByText("Evening")).toBeInTheDocument()
    })

    test("selecting one legend entry does not select the other", async () => {
      const user = userEvent.setup()
      const { container } = render(
        <ScatterChart
          config={config}
          series={series}
          dataKey="h"
          yKey="w"
          containerHeight={280}
        />,
      )

      const [morning, evening] = Array.from(container.querySelectorAll("button"))
      if (!morning || !evening) throw new Error("expected two legend toggles")

      await user.click(morning)

      expect(morning).toHaveAttribute("data-selected")
      expect(evening).not.toHaveAttribute("data-selected")
    })
  })

  describe("the gallery examples", () => {
    // The cartesian charts need text metrics happy-dom does not have, so their
    // marks never appear here — but React still walks the whole tree, which is
    // what catches an example that throws on a bad prop or a missing key. These
    // files are copied verbatim by agents through /api/components/<slug>.json,
    // so an example that cannot render is shipped to every consumer.
    const SLUGS = [
      "chart",
      "area-chart",
      "bar-chart",
      "line-chart",
      "pie-chart",
      "composed-chart",
      "scatter-chart",
      "radar-chart",
      "radial-bar-chart",
      "treemap",
      "sunburst-chart",
    ]

    test.each(SLUGS.map((slug) => [slug] as const))("every %s example renders", (slug) => {
      const entry = getComponent(slug)
      expect(entry?.examples.length).toBeGreaterThan(0)

      for (const example of entry?.examples ?? []) {
        const { container, unmount } = render(example.render())
        expect(container.querySelector("[data-chart]")).not.toBeNull()
        unmount()
      }
    })
  })
})
