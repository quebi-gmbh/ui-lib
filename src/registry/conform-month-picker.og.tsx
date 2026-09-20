import { ConformMonthPicker } from "@/components/conform-month-picker"
import { OgForm } from "./og-scene"
import type { OgScene } from "./types"

export const conformMonthPickerOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <OgForm<{ month: string }> defaultValue={{ month: "2024-03-01" }} className="w-fit">
      {(fields) => <ConformMonthPicker field={fields.month} label="Billing month" />}
    </OgForm>
  ),
}
