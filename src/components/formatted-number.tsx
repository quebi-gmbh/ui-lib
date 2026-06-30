"use client"

import type { ReactNode } from "react"
import { useCallback } from "react"
import { useLocale } from "react-aria-components"

/**
 * FormattedNumber — quebi design system
 *
 * Locale-aware number formatting built on `Intl.NumberFormat`. Reads the active
 * locale from the nearest react-aria `I18nProvider` (override with the `locale`
 * prop). This is a headless formatter: it renders a bare `<span>` so it inherits
 * surrounding quebi typography — apply tokens via `className` or the `children`
 * render prop.
 */

export interface FormattedNumberProps {
  /**
   * The number value to format.
   */
  value: number | string
  /**
   * Locale for formatting. Defaults to the locale from the nearest I18nProvider.
   */
  locale?: string
  /**
   * Intl.NumberFormat options.
   */
  options?: Intl.NumberFormatOptions
  /**
   * Optional className applied to the default `<span>`.
   */
  className?: string
  /**
   * Custom children function for advanced formatting.
   */
  children?: (formattedValue: string) => ReactNode
}

/**
 * Format a plain number using locale-specific grouping (e.g. 1,024 in EN, 1.024 in DE).
 * Useful in string contexts (e.g. callback functions) where a React component cannot be used.
 */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Hook that returns a locale-aware number formatting function.
 * Reads locale from the nearest I18nProvider automatically.
 */
export function useFormatNumber() {
  const { locale } = useLocale()
  return useCallback((value: number) => formatNumber(value, locale), [locale])
}

/**
 * Format a number as EUR currency string with always 2 decimal places.
 * Useful in string contexts (e.g. callback functions) where a React component cannot be used.
 */
export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * A component for formatting numbers using Intl.NumberFormat.
 * Reads locale from the nearest I18nProvider (react-aria-components) when no locale prop is given.
 *
 * @example
 * // Format as currency
 * <FormattedNumber value={123.45} options={{ style: 'currency', currency: 'EUR' }} />
 *
 * @example
 * // Format as percentage
 * <FormattedNumber value={0.1234} options={{ style: 'percent', minimumFractionDigits: 2 }} />
 *
 * @example
 * // Custom formatting with children
 * <FormattedNumber value={123.45} options={{ style: 'currency', currency: 'EUR' }}>
 *   {(formatted) => <span className="font-semibold text-quebi-brand">{formatted}</span>}
 * </FormattedNumber>
 */
export function FormattedNumber({
  value,
  locale,
  options = {},
  className,
  children,
}: FormattedNumberProps) {
  const { locale: racLocale } = useLocale()
  const resolvedLocale = locale ?? racLocale

  const numericValue = typeof value === "string" ? parseFloat(value) : value

  if (Number.isNaN(numericValue)) {
    return <span className={className}>-</span>
  }

  const formatter = new Intl.NumberFormat(resolvedLocale, options)
  const formattedValue = formatter.format(numericValue)

  if (children) {
    return <>{children(formattedValue)}</>
  }

  return <span className={className}>{formattedValue}</span>
}

/**
 * Format a number as currency (EUR by default), always with 2 decimal places.
 * Reads locale from the nearest I18nProvider automatically.
 */
export function FormattedCurrency({
  value,
  currency = "EUR",
  locale,
  ...props
}: Omit<FormattedNumberProps, "options"> & { currency?: string }) {
  const { locale: racLocale } = useLocale()
  const resolvedLocale = locale ?? racLocale

  return (
    <FormattedNumber
      value={value}
      locale={resolvedLocale}
      options={{
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }}
      {...props}
    />
  )
}

/**
 * Format a number as a percentage. Reads locale from the nearest I18nProvider automatically.
 */
export function FormattedPercentage({
  value,
  minimumFractionDigits = 2,
  locale,
  ...props
}: Omit<FormattedNumberProps, "options"> & { minimumFractionDigits?: number }) {
  const { locale: racLocale } = useLocale()
  const resolvedLocale = locale ?? racLocale

  return (
    <FormattedNumber
      value={value}
      locale={resolvedLocale}
      options={{ style: "percent", minimumFractionDigits }}
      {...props}
    />
  )
}
