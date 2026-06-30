interface FormattedDateProps {
  date: Date | string | number
  format?: "short" | "medium" | "long" | "full"
  timeStyle?: "short" | "medium" | "long" | "full"
  dateStyle?: "short" | "medium" | "long" | "full"
  showTime?: boolean
  relative?: boolean
  className?: string
  locale?: string
}

export function FormattedDate({
  date,
  format = "medium",
  timeStyle,
  dateStyle,
  relative = false,
  className,
  locale = "de",
}: FormattedDateProps) {
  const dateObj = new Date(date)

  // Handle relative time formatting
  if (relative) {
    try {
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
    } catch (error) {
      throw new Error(`Relative time formatting failed ${error}`)

      // Fall through to regular formatting
    }
  }

  // Options for the Intl.DateTimeFormat
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Berlin",
  }

  // Use specific dateStyle/timeStyle if provided, otherwise use format
  if (dateStyle || timeStyle) {
    if (dateStyle) options.dateStyle = dateStyle
    if (timeStyle) options.timeStyle = timeStyle
  }

  try {
    return (
      <time dateTime={dateObj.toISOString()} className={className}>
        {new Intl.DateTimeFormat(locale, options).format(dateObj)}
      </time>
    )
  } catch (error) {
    // Fallback if locale is not supported or date is invalid
    // biome-ignore lint/suspicious/noConsole: needed for debugging date formatting issues in UI component
    console.warn("Date formatting failed:", error)
    return (
      <time dateTime={dateObj.toISOString()} className={className}>
        {dateObj.toLocaleDateString("de", {
          timeZone: "Europe/Berlin",
          dateStyle: format,
        })}
      </time>
    )
  }
}

// Convenience components for common patterns
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
    <FormattedDate date={date} format="medium" showTime className={className} locale={locale} />
  )
}

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
