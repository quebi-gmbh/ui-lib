import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid"
import { tv } from "tailwind-variants"

export interface NoteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  intent?: "default" | "info" | "warning" | "danger" | "success"
  /** Show the leading status icon. Defaults to true (the `default` intent has no icon). */
  indicator?: boolean
  /** Optional bold heading rendered above the body content. */
  title?: React.ReactNode
}

const noteStyles = tv({
  base: [
    "flex w-full gap-3 rounded-lg border p-4 text-sm/5 text-pretty",
    "*:[a]:font-medium *:[a]:underline *:[a]:hover:no-underline",
    "**:[strong]:font-medium **:[.text-muted-fg]:opacity-70",
  ],
  variants: {
    intent: {
      default: "border-ink-200 bg-muted/60 text-secondary-fg",
      info: "border-info-subtle-fg/15 bg-info-subtle text-info-subtle-fg",
      success: "border-success-subtle-fg/15 bg-success-subtle text-success-subtle-fg",
      warning: "border-warning-subtle-fg/15 bg-warning-subtle text-warning-subtle-fg",
      danger: "border-danger-subtle-fg/15 bg-danger-subtle text-danger-subtle-fg",
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
    <div data-slot="note" className={noteStyles({ intent, className })} {...props}>
      {Icon && indicator && <Icon aria-hidden="true" className="mt-px size-5 shrink-0" />}
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        <div className={title ? "mt-1" : undefined}>{children}</div>
      </div>
    </div>
  )
}
