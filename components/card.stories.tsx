import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"
import { Button } from "./button"
import { Card } from "./card"

const meta = {
  title: "Cellestial DS/Components/Cards",
  component: Card,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/* Inline badge to match the spec's .badge variants without reaching into
 * @cellestial/ui's Badge (different API — will be aligned separately). */
const Badge = ({
  variant = "neutral",
  children,
  className,
  style,
}: {
  variant?: "neutral" | "brand" | "accent" | "success"
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) => {
  const tone = {
    neutral: "bg-ink-100 text-ink-700",
    brand: "bg-brand-100 text-brand-700",
    accent: "bg-accent-100 text-accent-700",
    success: "bg-success-100 text-success-600",
  }[variant]
  return (
    <span
      style={style}
      className={`inline-flex items-center gap-[6px] text-[12px] font-semibold rounded-pill px-2 py-[3px] ${tone} ${className ?? ""}`}
    >
      {children}
    </span>
  )
}

const SuccessDot = () => (
  <Badge variant="success">
    <span className="w-[6px] h-[6px] rounded-full bg-success-500" />
    Live on kiosk
  </Badge>
)

/* Spec uses a tinted surface for the plan card example to test feature-card
 * contrast against the gradient tile. */
const Tint = ({ children }: { children: ReactNode }) => (
  <div className="bg-[linear-gradient(180deg,var(--color-brand-50),var(--color-surface))] border border-ink-100 rounded-lg p-6">
    {children}
  </div>
)

export const PlanCards: Story = {
  render: () => (
    <Tint>
      <div className="grid grid-cols-3 gap-4">
        {/* Entry — outline action */}
        <Card>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <Badge>Entry</Badge>
            <span className="text-ink-500 text-[12px]">24 months</span>
          </div>
          <h3 className="font-display! font-bold! text-heading-m! text-ink-900! mt-3 mb-1.5 tracking-[-0.01em]">
            Essentials 20
          </h3>
          <p className="text-ink-500 text-[14px]">Calls, texts and 20 GB of 4G data.</p>
          <div className="font-display font-bold text-[40px] text-ink-900 mt-4 tabular-nums">
            £19<span className="text-[18px] text-ink-500 font-medium">/mo</span>
          </div>
          <Button intent="outline" className="w-full mt-auto">
            Edit plan
          </Button>
        </Card>

        {/* Mid — most popular */}
        <Card className="border-2! border-brand-500! relative">
          <Badge variant="brand" className="absolute -top-[10px] left-4">
            Most popular
          </Badge>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <Badge variant="accent">Mid</Badge>
            <span className="text-ink-500 text-[12px]">24 months</span>
          </div>
          <h3 className="font-display! font-bold! text-heading-m! text-ink-900! mt-3 mb-1.5 tracking-[-0.01em]">
            Flex 50
          </h3>
          <p className="text-ink-500 text-[14px]">Unlimited calls, texts and 50 GB of 5G.</p>
          <div className="font-display font-bold text-[40px] text-brand-700 mt-4 tabular-nums">
            £29<span className="text-[18px] text-ink-500 font-medium">/mo</span>
          </div>
          <Button intent="primary" className="w-full mt-auto">
            Edit plan
          </Button>
        </Card>

        {/* Premium — feature gradient */}
        <Card variant="feature">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <span className="inline-flex items-center text-[12px] font-semibold rounded-pill px-2 py-[3px] bg-white/20 text-white">
              Premium
            </span>
            <span className="text-[12px] text-white/80">No contract</span>
          </div>
          <h3 className="font-display font-semibold text-heading-m text-white mt-3 mb-1.5 tracking-[-0.01em]">
            Unlimited Pro
          </h3>
          <p className="text-white/85 text-[14px]">
            Everything, everywhere, all at once. 5G+ included.
          </p>
          <div className="font-display font-bold text-[40px] text-white mt-4 tabular-nums">
            £49<span className="text-[18px] text-white/70 font-medium">/mo</span>
          </div>
          <button
            type="button"
            className="w-full mt-auto inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-body! font-semibold! leading-[18px]! px-4 py-2.5 rounded-sm cursor-pointer hover:-translate-y-px"
          >
            Edit plan
          </button>
        </Card>
      </div>
    </Tint>
  ),
}

export const DeviceCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {[
        {
          name: "iPhone 15 Pro Max",
          sub: "256 GB · Natural Titanium",
          price: "£1,199",
          monthly: "or £49/mo × 24",
          stock: <Badge>12 in stock</Badge>,
          live: <SuccessDot />,
        },
        {
          name: "Samsung Galaxy S24",
          sub: "128 GB · Marble Grey",
          price: "£799",
          monthly: "or £35/mo × 24",
          stock: (
            <Badge variant="brand" className="bg-warning-100! text-warning-600!">
              Low stock · 2
            </Badge>
          ),
          live: <Badge>Promo active</Badge>,
        },
      ].map((d) => (
        <div
          key={d.name}
          className="border border-ink-100 rounded-md p-4 bg-surface grid grid-cols-[64px_1fr_auto] gap-[14px] items-center"
        >
          <div
            className="w-16 h-16 rounded-sm flex items-center justify-center text-ink-400"
            style={{
              background: "linear-gradient(135deg, var(--color-ink-100), var(--color-ink-50))",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <title>Phone</title>
              <rect x="5" y="2" width="14" height="20" rx="3" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-ink-900">{d.name}</div>
            <div className="text-ink-500 text-[13px]">{d.sub}</div>
            <div className="mt-1 flex gap-1.5 flex-wrap">
              {d.stock}
              {d.live}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-[20px] text-brand-700">{d.price}</div>
            <div className="text-ink-500 text-[12px]">{d.monthly}</div>
          </div>
        </div>
      ))}
    </div>
  ),
}

export const Playground: Story = {
  args: {
    children: "Card content" as unknown as undefined,
  },
  render: ({ variant }) => (
    <Card variant={variant}>
      <h3 className="font-display font-semibold text-heading-m text-ink-900 mb-1.5 tracking-[-0.01em]">
        Card title
      </h3>
      <p className="text-ink-500 text-[14px]">
        Headline → price → supporting info → action. Don't break the order.
      </p>
    </Card>
  ),
  argTypes: {
    variant: { control: "select", options: ["default", "feature"] },
  },
}
