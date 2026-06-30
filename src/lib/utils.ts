import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with Tailwind-aware conflict resolution.
 * Later classes win when they target the same property.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
