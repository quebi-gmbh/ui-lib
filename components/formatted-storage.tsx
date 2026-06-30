/**
 * Format storage capacity (in GB) for display
 * @param storageGb - Storage capacity in GB
 * @returns Formatted string (e.g., "128GB", "1TB")
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

export interface FormattedStorageProps {
  /** Storage capacity in GB (e.g., 128, 256, 512, 1024) */
  value: number | null | undefined
  /** Optional className for styling */
  className?: string
}

/**
 * Component for displaying formatted storage capacity
 * @example
 * <FormattedStorage value={128} /> // Displays: 128GB
 * <FormattedStorage value={1024} /> // Displays: 1TB
 * <FormattedStorage value={2048} /> // Displays: 2TB
 */
export function FormattedStorage({ value, className }: FormattedStorageProps) {
  const formatted = formatStorage(value)

  if (!formatted) {
    return null
  }

  return <span className={className}>{formatted}</span>
}
