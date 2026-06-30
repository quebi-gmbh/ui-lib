import { useState } from "react"
import { Meter, MeterHeader, MeterTrack, MeterValue } from "@/components/meter"
import type { ComponentExample } from "./types"

const Col = ({ children }: { children: React.ReactNode }) => (
  <div className="flex w-full max-w-sm flex-col gap-6">{children}</div>
)

export const meterExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A labelled meter with a header, formatted value, and track.",
    render: () => (
      <div className="w-full max-w-sm">
        <Meter value={42} aria-label="Storage used">
          <MeterHeader>
            <span>Storage used</span>
            <MeterValue />
          </MeterHeader>
          <MeterTrack />
        </Meter>
      </div>
    ),
  },
  {
    title: "Thresholds",
    description:
      "The fill is brand teal below 70%, amber from 70-90%, and red at 90% and above.",
    render: () => (
      <Col>
        <Meter value={45} aria-label="Normal">
          <MeterHeader>
            <span>Normal</span>
            <MeterValue />
          </MeterHeader>
          <MeterTrack />
        </Meter>
        <Meter value={78} aria-label="Warning">
          <MeterHeader>
            <span>Warning</span>
            <MeterValue />
          </MeterHeader>
          <MeterTrack />
        </Meter>
        <Meter value={95} aria-label="Danger">
          <MeterHeader>
            <span>Danger</span>
            <MeterValue />
          </MeterHeader>
          <MeterTrack />
        </Meter>
      </Col>
    ),
  },
  {
    title: "Formatted value",
    description: "Use formatOptions to render the value as a currency or unit.",
    render: () => (
      <div className="w-full max-w-sm">
        <Meter
          value={620}
          minValue={0}
          maxValue={1000}
          formatOptions={{ style: "currency", currency: "USD" }}
          aria-label="Budget spent"
        >
          <MeterHeader>
            <span>Budget spent</span>
            <MeterValue />
          </MeterHeader>
          <MeterTrack />
        </Meter>
      </div>
    ),
  },
  {
    title: "Custom color",
    description: "Pin an explicit fill color to bypass the threshold logic.",
    render: () => (
      <div className="w-full max-w-sm">
        <Meter value={88} color="var(--color-quebi-brand)" aria-label="Score">
          <MeterHeader>
            <span>Score</span>
            <MeterValue />
          </MeterHeader>
          <MeterTrack />
        </Meter>
      </div>
    ),
  },
  {
    title: "Live",
    render: () => {
      const LiveExample = () => {
        const [value, setValue] = useState(30)
        return (
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Meter value={value} aria-label="Live usage">
              <MeterHeader>
                <span>Live usage</span>
                <MeterValue />
              </MeterHeader>
              <MeterTrack />
            </Meter>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              aria-label="Adjust value"
              className="accent-quebi-brand"
            />
          </div>
        )
      }
      return <LiveExample />
    },
  },
]
