import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "react-aria-components"

type Theme = "light" | "dark"

const STORAGE_KEY = "quebi-theme"

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

function applyTheme(theme: Theme) {
  const el = document.documentElement
  el.classList.remove("light", "dark")
  el.classList.add(theme)
  el.style.colorScheme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* private mode / storage disabled — the in-page toggle still works */
  }
}

/**
 * Header dark/light switch. The actual initial theme is set before paint by the
 * inline script in root.tsx (no FOUC); this control only reads and flips the
 * `dark`/`light` class on <html> and persists the choice.
 *
 * Hydration-safe: `theme` starts `undefined` and is resolved from the live DOM
 * in an effect, so server markup and first client render agree.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | undefined>(undefined)

  useEffect(() => {
    setTheme(currentTheme())
  }, [])

  const isLight = theme === "light"
  const next: Theme = isLight ? "dark" : "light"

  function toggle() {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <Button
      onPress={toggle}
      aria-label={`Switch to ${next} theme`}
      className="inline-flex size-9 items-center justify-center rounded-quebi-sm border border-quebi-line/20 text-quebi-fg-muted transition-colors duration-200 hover:border-quebi-brand hover:text-quebi-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50"
    >
      {/* Icon reflects the target action; before mount (theme undefined) both are
          hidden to avoid rendering the wrong glyph, then it settles on mount. */}
      {theme !== undefined &&
        (isLight ? (
          <Moon className="size-4" aria-hidden />
        ) : (
          <Sun className="size-4" aria-hidden />
        ))}
    </Button>
  )
}
