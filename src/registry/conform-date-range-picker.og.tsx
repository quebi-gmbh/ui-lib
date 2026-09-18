import { ConformDateRangePicker } from "@/components/conform-date-range-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformDateRangePickerOgScene: OgScene = {
  scale: 1.6,
  render: () => (
    <OgForm<{ stay: { start: string; end: string } }>
      defaultValue={{ stay: { start: "2024-03-13", end: "2024-03-18" } }}
    >
      {(fields) => (
        <ConformDateRangePicker
          field={fields.stay}
          label="Stay dates"
          description="Check-in and check-out."
        />
      )}
    </OgForm>
  ),
}
