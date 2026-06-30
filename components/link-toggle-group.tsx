import type { ReactNode } from "react"
import { twMerge } from "tailwind-merge"

export type LinkToggleGroupOption<T extends string = string> = {
  value: T
  label: ReactNode
  href: string
}

export interface LinkToggleGroupProps<T extends string = string> {
  options: LinkToggleGroupOption<T>[]
  current: T
  ariaLabel: string
  className?: string
}

export function LinkToggleGroup<T extends string = string>({
  options,
  current,
  ariaLabel,
  className,
}: LinkToggleGroupProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={twMerge(
        "inline-flex items-center gap-1 bg-ink-50 p-[3px] rounded-[10px]",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = current === opt.value
        return (
          <a
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            href={opt.href}
            className={`px-2.5 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors duration-[200ms] ${
              isActive ? "bg-surface text-ink-900 shadow-1" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {opt.label}
          </a>
        )
      })}
    </div>
  )
}
