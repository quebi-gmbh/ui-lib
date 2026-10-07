import { cn, tv } from "@/lib/utils"

type IconProps = React.SVGProps<SVGSVGElement>

// `aria-hidden` is not in here: these icons are decorative — each one restates
// the intent the note's colour and text already carry — and
// lint/a11y/noSvgWithoutTitle cannot see an attribute arriving through a
// spread. So each <svg> states it literally, before the spreads, where a caller
// that needs a labelled icon can still override it.
const baseIconProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
}

const InformationCircleIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm9-1.5a.75.75 0 0 0 0 1.5h.255a.75.75 0 0 1 .73.926l-.708 2.836A1.75 1.75 0 0 0 13.225 18h.526a.75.75 0 0 0 0-1.5h-.255a.25.25 0 0 1-.243-.31l.71-2.836A1.75 1.75 0 0 0 12.265 11H11.25Zm.75-3.75a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z"
      clipRule="evenodd"
    />
  </svg>
)

const CheckCircleIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      clipRule="evenodd"
    />
  </svg>
)

const ExclamationTriangleIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
      clipRule="evenodd"
    />
  </svg>
)

const XCircleIcon = (props: IconProps) => (
  <svg aria-hidden="true" {...baseIconProps} {...props}>
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
      clipRule="evenodd"
    />
  </svg>
)

/**
 * Note — quebi design system
 *
 * An inline callout / alert for contextual feedback: a hairline-ruled box at
 * the control radius in the page flow, words in ink, links in signal. Five intents. `default` is the bare box;
 * the others thicken the leading edge to a 2px rule and add a status icon —
 * `info` in ink, `success`, `warning` and `danger` in their state tokens. The
 * hue goes on the rule and the icon only; the surface is never filled.
 */
export interface NoteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  intent?: "default" | "info" | "warning" | "danger" | "success"
  /** Show the leading status icon. Defaults to true (the `default` intent has no icon). */
  indicator?: boolean
  /** Optional bold heading rendered above the body content. */
  title?: React.ReactNode
}

const noteStyles = tv({
  base: [
    "flex w-full gap-3 rounded-(--q-radius-control) border border-quebi-hairline p-4 text-sm/5 text-pretty text-quebi-fg-muted",
    "**:[a]:text-quebi-signal **:[a]:underline **:[a]:decoration-1 **:[a]:underline-offset-3 **:[a]:transition-[text-underline-offset] **:[a]:duration-150 **:[a]:hover:underline-offset-5",
    "**:[strong]:font-medium **:[strong]:text-quebi-fg **:[.text-muted-fg]:text-quebi-fg-subtle",
  ],
  variants: {
    intent: {
      default: "",
      info: "border-l-2 border-l-quebi-rule *:data-[slot=note-icon]:text-quebi-fg",
      success: "border-l-2 border-l-quebi-success *:data-[slot=note-icon]:text-quebi-success",
      warning: "border-l-2 border-l-quebi-warn *:data-[slot=note-icon]:text-quebi-warn",
      danger: "border-l-2 border-l-quebi-danger *:data-[slot=note-icon]:text-quebi-danger",
    },
  },
  defaultVariants: { intent: "default" },
})

const iconMap = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: XCircleIcon,
  default: null,
} as const

export function Note({
  indicator = true,
  intent = "default",
  title,
  className,
  children,
  ...props
}: NoteProps) {
  const Icon = iconMap[intent]

  return (
    <div data-slot="note" className={cn(noteStyles({ intent }), className)} {...props}>
      {Icon && indicator && (
        <Icon aria-hidden="true" data-slot="note-icon" className="mt-px size-5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        {/* Title in ink, body in running-text muted, on every intent: the
            hue belongs to the rule and the icon, not the sentence. */}
        {title && <div className="font-medium text-quebi-fg">{title}</div>}
        <div className={title ? "mt-1" : undefined}>{children}</div>
      </div>
    </div>
  )
}
