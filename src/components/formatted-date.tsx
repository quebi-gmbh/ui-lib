/**
 * FormattedDate — locale-aware date/time formatting
 *
 * A presentational formatter that renders a semantic <time> element using the
 * platform Intl APIs. Supports absolute formatting (dateStyle / timeStyle) and
 * relative formatting ("5 minutes ago") via Intl.RelativeTimeFormat. No styling
 * of its own — pass `className` to style the rendered <time>.
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
}: FormattedDateProps) {
  const dateObj = new Date(date)

  // Relative time formatting
  if (relative) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    const now = new Date()
    const diffInMs = dateObj.getTime() - now.getTime()
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
}: {
  date: Date | string | number
  className?: string
  locale?: string
}) {
  return <FormattedDate date={date} relative className={className} locale={locale} />
}
