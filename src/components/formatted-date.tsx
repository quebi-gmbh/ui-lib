"use client"

import { useEffect, useState } from "react"

/**
 * FormattedDate — locale-aware date/time formatting
 *
 * A presentational formatter that renders a semantic <time> element using the
 * platform Intl APIs. Supports absolute formatting (dateStyle / timeStyle) and
 * relative formatting ("5 minutes ago") via Intl.RelativeTimeFormat. No styling
 * of its own — pass `className` to style the rendered <time>.
 *
 * Locale and time zone are pinned rather than read from the runtime, so a date
 * formatted during a prerender and the same date formatted in the browser are
 * the same string. Relative output is the one part that cannot be pinned that
 * way — it depends on the current time — so it renders the absolute date until
 * the component has mounted, or takes an explicit `now`.
 */
export interface FormattedDateProps {
  /** The date to format. Accepts a Date, an ISO string, or a timestamp. */
  date: Date | string | number
  /** Fallback style used when neither dateStyle nor timeStyle is set. */
  format?: "short" | "medium" | "long" | "full"
  /** Time portion style (Intl.DateTimeFormat timeStyle). */
  timeStyle?: "short" | "medium" | "long" | "full"
  /** Date portion style (Intl.DateTimeFormat dateStyle). */
  dateStyle?: "short" | "medium" | "long" | "full"
  /** Render as relative time (e.g. "in 2 days", "5 minutes ago"). */
  relative?: boolean
  /** Class applied to the rendered <time> element. */
  className?: string
  /** BCP 47 locale tag. Defaults to "de". */
  locale?: string
  /** IANA time zone. Defaults to "Europe/Berlin". */
  timeZone?: string
  /**
   * Reference point for `relative` output. Pass it to make the result
   * deterministic — a prerendered "3 days ago" is computed against the moment
   * the HTML was generated, and would otherwise disagree with the browser that
   * hydrates it. Without it, the absolute date is rendered until mount.
   */
  now?: Date | string | number
}

export function FormattedDate({
  date,
  format = "medium",
  timeStyle,
  dateStyle,
  relative = false,
  className,
  locale = "de",
  timeZone = "Europe/Berlin",
  now,
}: FormattedDateProps) {
  const dateObj = new Date(date)

  // "3 days ago" is a function of when it is asked, and under `ssr: false` +
  // prerender the two askers are a Node build and a browser hours or days
  // later. Reading the clock during render would put one answer in the HTML and
  // a different one in the hydrated tree; the reference point therefore either
  // comes from the caller or is picked up after mount, where there is only one
  // runtime left to disagree with.
  const [mountedNow, setMountedNow] = useState<Date | null>(null)
  useEffect(() => {
    if (relative && now === undefined) setMountedNow(new Date())
  }, [relative, now])
  const reference = now === undefined ? mountedNow : new Date(now)

  // Relative time formatting
  if (relative && reference) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    const diffInMs = dateObj.getTime() - reference.getTime()
    const diffInMinutes = Math.round(diffInMs / (1000 * 60))
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))

    let value: number
    let unit: Intl.RelativeTimeFormatUnit

    if (Math.abs(diffInDays) >= 1) {
      value = diffInDays
      unit = "day"
    } else if (Math.abs(diffInHours) >= 1) {
      value = diffInHours
      unit = "hour"
    } else {
      value = diffInMinutes
      unit = "minute"
    }

    return (
      <time dateTime={dateObj.toISOString()} className={className}>
        {rtf.format(value, unit)}
      </time>
    )
  }

  // Absolute formatting
  const options: Intl.DateTimeFormatOptions = { timeZone }

  if (dateStyle || timeStyle) {
    if (dateStyle) options.dateStyle = dateStyle
    if (timeStyle) options.timeStyle = timeStyle
  } else {
    options.dateStyle = format
  }

  try {
    return (
      <time dateTime={dateObj.toISOString()} className={className}>
        {new Intl.DateTimeFormat(locale, options).format(dateObj)}
      </time>
    )
  } catch {
    // Fallback if the locale is unsupported or the date is invalid
    return (
      <time dateTime={dateObj.toISOString()} className={className}>
        {dateObj.toLocaleDateString("de", { timeZone, dateStyle: format })}
      </time>
    )
  }
}

/** Convenience: compact date, no time. */
export function ShortDate({
  date,
  className,
  locale,
}: {
  date: Date | string | number
  className?: string
  locale?: string
}) {
  return <FormattedDate date={date} format="short" className={className} locale={locale} />
}

/** Convenience: medium date with a short time. */
export function DateTime({
  date,
  className,
  locale,
}: {
  date: Date | string | number
  className?: string
  locale?: string
}) {
  return (
    <FormattedDate
      date={date}
      dateStyle="medium"
      timeStyle="short"
      className={className}
      locale={locale}
    />
  )
}

/** Convenience: relative time (e.g. "2 hours ago"). */
export function RelativeTime({
  date,
  className,
  locale,
  now,
}: {
  date: Date | string | number
  className?: string
  locale?: string
  /** Reference point, for output that has to survive hydration unchanged. */
  now?: Date | string | number
}) {
  return <FormattedDate date={date} relative now={now} className={className} locale={locale} />
}
