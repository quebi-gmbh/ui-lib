import { CalendarDate } from "@internationalized/date"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import { Checkbox, CheckboxGroup } from "./checkbox"
import { DateField, DateInput } from "./date-field"
import { DatePicker, DatePickerTrigger } from "./date-picker"
import { Description, FieldError, Label } from "./field"
import { Input } from "./input"
import { NumberField, NumberInput } from "./number-field"
import { Radio, RadioGroup } from "./radio"
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select"
import { Switch } from "./switch"
import { TextField } from "./text-field"

/**
 * Verbatim port of the Forms & inputs section from cellestial-ds/showcase.html.
 *
 * Spec: label (13px/600/ink-800) + input (14px, py-2.5 px-3, ink-200 border,
 * focus brand-500 + 4px brand-100 ring) + hint (12px/ink-500, danger-600 when error).
 */

const meta = {
  title: "Cellestial DS/Components/Forms",
  parameters: { layout: "padded" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{children}</div>
)

export const TextNumberSelect: Story = {
  name: "Text, number, select",
  render: () => (
    <Row>
      <TextField>
        <Label>Plan name</Label>
        <Input defaultValue="Essentials 20" />
        <Description>Shown to customers on the kiosk.</Description>
      </TextField>

      <NumberField
        defaultValue={29.99}
        minValue={0}
        formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
      >
        <Label>Monthly price</Label>
        <NumberInput prefix="£" />
        <Description>VAT inclusive.</Description>
      </NumberField>

      <Select defaultSelectedKey="24">
        <Label>Contract length</Label>
        <SelectTrigger />
        <SelectContent>
          <SelectItem id="12">12 months</SelectItem>
          <SelectItem id="24">24 months</SelectItem>
          <SelectItem id="36">36 months</SelectItem>
          <SelectItem id="none">No contract</SelectItem>
        </SelectContent>
        <Description>Used in the matching engine.</Description>
      </Select>
    </Row>
  ),
}

export const ErrorAndHelper: Story = {
  name: "Error & helper states",
  render: () => (
    <Row>
      <TextField isInvalid>
        <Label>SKU</Label>
        <Input defaultValue="IPH-15-PMX" />
        <FieldError>A device with this SKU already exists.</FieldError>
      </TextField>

      <NumberField defaultValue={50} minValue={0}>
        <Label>Data allowance</Label>
        <NumberInput suffix="GB" />
        <Description>Enter 0 for unlimited.</Description>
      </NumberField>

      <div className="flex flex-col gap-1.5">
        <span className="font-body font-semibold text-[13px] text-ink-800">Visible on kiosk</span>
        <div className="flex items-center gap-3">
          <Switch defaultSelected aria-label="Visible on kiosk" />
          <span className="text-ink-500 text-[13px]">This plan is live on all 4 kiosks.</span>
        </div>
      </div>
    </Row>
  ),
}

export const Dates: Story = {
  name: "Date & date-picker",
  render: () => (
    <Row>
      <DateField defaultValue={new CalendarDate(2026, 4, 23)}>
        <Label>Launch date</Label>
        <DateInput />
        <Description>When this plan goes live on the kiosks.</Description>
      </DateField>

      <DatePicker defaultValue={new CalendarDate(2026, 7, 1)}>
        <Label>Promotion end</Label>
        <DatePickerTrigger />
        <Description>Pick a date from the calendar.</Description>
      </DatePicker>

      <DateField isInvalid defaultValue={new CalendarDate(2024, 1, 1)}>
        <Label>Contract start</Label>
        <DateInput />
        <FieldError>Start date must be in the future.</FieldError>
      </DateField>
    </Row>
  ),
}

export const CheckboxRadioSegmented: Story = {
  name: "Checkbox, radio, segmented",
  render: () => (
    <div className="flex flex-wrap gap-10">
      <div className="flex flex-col gap-3">
        <span className="font-body font-semibold text-[13px] text-ink-800">Includes</span>
        <CheckboxGroup defaultValue={["calls", "5g"]}>
          <Checkbox value="calls">Unlimited calls &amp; texts</Checkbox>
          <Checkbox value="5g">5G access</Checkbox>
          <Checkbox value="roaming">Roaming in EU</Checkbox>
          <Checkbox value="family">Family sharing</Checkbox>
        </CheckboxGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-body font-semibold text-[13px] text-ink-800">Billing cycle</span>
        <RadioGroup defaultValue="monthly">
          <Radio value="monthly">Monthly</Radio>
          <Radio value="quarterly">Quarterly</Radio>
          <Radio value="annually">Annually — save 8%</Radio>
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-body font-semibold text-[13px] text-ink-800">
          Display on kiosk as
        </span>
        <Segmented options={["Monthly", "Upfront", "Total"]} />
      </div>
    </div>
  ),
}

/** Lightweight spec-aligned segmented control, shown inline here.
 * Graduates to its own component once there's a second consumer. */
function Segmented({ options }: { options: string[] }) {
  const [active, setActive] = useState(options[0] as string)
  return (
    <div className="inline-flex p-[3px] bg-ink-50 rounded-sm gap-0.5">
      {options.map((label) => (
        <button
          type="button"
          key={label}
          onClick={() => setActive(label)}
          className={`font-body font-semibold text-[13px] px-[14px] py-2 rounded-[6px] transition-all duration-[120ms] cursor-pointer ${
            active === label
              ? "bg-surface text-ink-900 shadow-1"
              : "bg-transparent text-ink-600 hover:text-ink-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
