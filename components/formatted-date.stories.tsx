import type { Meta, StoryObj } from "@storybook/react-vite"
import { DateTime, FormattedDate, RelativeTime, ShortDate } from "./formatted-date"

const meta = {
  title: "UI/FormattedDate",
  component: FormattedDate,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    date: {
      control: "date",
      description: "The date to format",
    },
    format: {
      control: "select",
      options: ["short", "medium", "long", "full"],
      description: "Format style when dateStyle/timeStyle not specified",
    },
    dateStyle: {
      control: "select",
      options: [undefined, "short", "medium", "long", "full"],
      description: "Specific date format style",
    },
    timeStyle: {
      control: "select",
      options: [undefined, "short", "medium", "long", "full"],
      description: "Specific time format style",
    },
    showTime: {
      control: "boolean",
      description: "Whether to show time",
    },
    relative: {
      control: "boolean",
      description: "Whether to show relative time",
    },
    locale: {
      control: "select",
      options: ["de", "en", "fr", "es", "it"],
      description: "Locale for formatting",
    },
    className: {
      control: "text",
      description: "CSS class name",
    },
  },
} satisfies Meta<typeof FormattedDate>

export default meta
type Story = StoryObj<typeof meta>

const testDate = new Date("2024-03-15T14:30:00.000Z")

export const Default: Story = {
  args: {
    date: testDate,
    locale: "de",
  },
}

export const ShortFormat: Story = {
  args: {
    date: testDate,
    format: "short",
    locale: "de",
  },
}

export const LongFormat: Story = {
  args: {
    date: testDate,
    format: "long",
    locale: "de",
  },
}

export const WithTime: Story = {
  args: {
    date: testDate,
    dateStyle: "medium",
    timeStyle: "short",
    locale: "de",
  },
}

export const RelativeTimeExample: Story = {
  args: {
    date: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    relative: true,
    locale: "de",
  },
}

export const EnglishLocale: Story = {
  args: {
    date: testDate,
    locale: "en",
  },
}

export const CustomClassName: Story = {
  args: {
    date: testDate,
    className: "text-blue-600 font-semibold",
    locale: "de",
  },
}

// Convenience component stories
export const ShortDateComponent: Story = {
  args: {
    date: testDate,
    locale: "de",
  },
  render: () => <ShortDate date={testDate} locale="de" />,
}

export const DateTimeComponent: Story = {
  args: {
    date: testDate,
    locale: "de",
  },
  render: () => <DateTime date={testDate} locale="de" />,
}

export const RelativeTimeComponent: Story = {
  args: {
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    locale: "de",
  },
  render: () => <RelativeTime date={new Date(Date.now() - 2 * 60 * 60 * 1000)} locale="de" />,
}

// Multiple examples
export const MultipleFormats: Story = {
  args: {
    date: testDate,
    locale: "de",
  },
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Different Formats:</h3>
        <div className="space-y-2">
          <div>
            Short: <FormattedDate date={testDate} format="short" locale="de" />
          </div>
          <div>
            Medium: <FormattedDate date={testDate} format="medium" locale="de" />
          </div>
          <div>
            Long: <FormattedDate date={testDate} format="long" locale="de" />
          </div>
          <div>
            Full: <FormattedDate date={testDate} format="full" locale="de" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">With Time:</h3>
        <div className="space-y-2">
          <div>
            Date + Short Time:{" "}
            <FormattedDate date={testDate} dateStyle="medium" timeStyle="short" locale="de" />
          </div>
          <div>
            Date + Long Time:{" "}
            <FormattedDate date={testDate} dateStyle="long" timeStyle="long" locale="de" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Relative Times:</h3>
        <div className="space-y-2">
          <div>
            5 minutes ago: <RelativeTime date={new Date(Date.now() - 5 * 60 * 1000)} locale="de" />
          </div>
          <div>
            2 hours from now:{" "}
            <RelativeTime date={new Date(Date.now() + 2 * 60 * 60 * 1000)} locale="de" />
          </div>
          <div>
            3 days ago:{" "}
            <RelativeTime date={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} locale="de" />
          </div>
        </div>
      </div>
    </div>
  ),
}

export const DifferentLocales: Story = {
  args: {
    date: testDate,
    locale: "de",
  },
  render: () => (
    <div className="space-y-4">
      <h3 className="font-semibold mb-2">Same date in different locales:</h3>
      <div className="space-y-2">
        <div>
          German: <FormattedDate date={testDate} dateStyle="long" locale="de" />
        </div>
        <div>
          English: <FormattedDate date={testDate} dateStyle="long" locale="en" />
        </div>
        <div>
          French: <FormattedDate date={testDate} dateStyle="long" locale="fr" />
        </div>
        <div>
          Spanish: <FormattedDate date={testDate} dateStyle="long" locale="es" />
        </div>
        <div>
          Italian: <FormattedDate date={testDate} dateStyle="long" locale="it" />
        </div>
      </div>
    </div>
  ),
}
