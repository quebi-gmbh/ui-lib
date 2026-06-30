import { cn } from "@/lib/utils"

/**
 * FormattedStorage — quebi design system
 *
 * Renders a storage capacity (in GB) as a compact, human-readable label.
 * Values of 1024GB and above are rolled up to TB. Returns nothing when the
 * value is missing, so it slots cleanly into spec tables and product rows.
 *
 * @example
 * <FormattedStorage value={128} />  // 128GB
 * <FormattedStorage value={1024} /> // 1TB
 * <FormattedStorage value={1536} /> // 1.5TB
 */

/**
 * Format storage capacity (in GB) for display.
 * @param storageGb - Storage capacity in GB
 * @returns Formatted string (e.g., "128GB", "1TB"), or "" when missing
 */
function formatStorage(storageGb: number | null | undefined): string {
  if (!storageGb) return ""

  // Convert to TB if >= 1024 GB
  if (storageGb >= 1024) {
    const tb = storageGb / 1024
    // Format as integer if whole number, otherwise show 1 decimal place
    return tb % 1 === 0 ? `${tb}TB` : `${tb.toFixed(1)}TB`
  }

  return `${storageGb}GB`
}

export interface FormattedStorageProps extends React.ComponentProps<"span"> {
  /** Storage capacity in GB (e.g., 128, 256, 512, 1024) */
  value: number | null | undefined
}

export function FormattedStorage({ value, className, ...props }: FormattedStorageProps) {
  const formatted = formatStorage(value)

  if (!formatted) {
    return null
  }

  return (
    <span
      className={cn("font-sans tabular-nums text-white", className)}
      {...props}
    >
      {formatted}
    </span>
  )
}
