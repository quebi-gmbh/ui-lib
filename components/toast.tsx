"use client"

import { Toaster as ToasterPrimitive, type ToasterProps, toast } from "sonner"
import { twJoin } from "tailwind-merge"

export { toast }

/**
 * Toast — Cellestial Design System
 *
 * Spec (cellestial-ds/components.css .toast):
 *   - Default: `ink-900` bg, white text, `rounded-md`, `shadow-3`, 14px body.
 *     Used for autosave confirmations ("Changes autosaved · 14:02").
 *   - Status: success/warning/danger/info use the 100-subtle bg with the
 *     600-weight text matching the DS status ramps.
 */
export function Toast(props: ToasterProps) {
  return (
    <ToasterPrimitive
      theme={props.theme ?? "light"}
      className="toaster group"
      toastOptions={{
        className: twJoin(
          "will-change-transform font-body rounded-md shadow-3",
          "*:data-icon:mt-0.5 *:data-icon:self-start has-data-description:*:data-icon:mt-1",
        ),
      }}
      style={
        {
          // Default → spec: ink-900 bg, ink-50 text. No border. Using the ink
          // ramp (not literal #FFF) keeps the toast high-contrast in BOTH
          // themes: in dark the ramp inverts, so ink-900 bg → light / ink-50
          // text → dark, instead of the old white-on-white.
          "--normal-bg": "var(--color-ink-900)",
          "--normal-text": "var(--color-ink-50)",
          "--normal-border": "transparent",

          "--success-bg": "var(--color-success-100)",
          "--success-border": "transparent",
          "--success-text": "var(--color-success-600)",

          "--error-bg": "var(--color-danger-100)",
          "--error-border": "transparent",
          "--error-text": "var(--color-danger-600)",

          "--warning-bg": "var(--color-warning-100)",
          "--warning-border": "transparent",
          "--warning-text": "var(--color-warning-600)",

          "--info-bg": "var(--color-info-100)",
          "--info-border": "transparent",
          "--info-text": "var(--color-info-500)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
